"""콘솔 API"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Response, status, Cookie
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, desc
from sqlalchemy.orm import Session as DBSession
import logging

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.schemas.console import ConsoleLoginRequest, ConsoleLoginResponse, ConsoleKeyItem
from app.services.console_service import ConsoleTokenService
from app.models.api_usage import CukApiKey, CukApiUsageLog, CukApiUsageDaily
from app.utils.dependencies import get_console_token

router = APIRouter(prefix="/api/console", tags=["Console"])
logger = logging.getLogger(__name__)


def set_console_cookie(response: Response, token: str, environment: str = "development"):
    max_age = settings.CONSOLE_SESSION_EXPIRE_HOURS * 3600
    if environment == "development":
        response.set_cookie(
            key="console_token",
            value=token,
            httponly=True,
            samesite="lax",
            path="/",
            max_age=max_age,
        )
    else:
        response.set_cookie(
            key="console_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=max_age,
            domain=".cukee.world",
        )


def clear_console_cookie(response: Response, environment: str = "development"):
    if environment == "development":
        response.delete_cookie(key="console_token", path="/")
    else:
        response.delete_cookie(key="console_token", path="/", domain=".cukee.world")


@router.post("/auth/login", response_model=ConsoleLoginResponse, status_code=status.HTTP_200_OK)
def console_login(
    response: Response,
    data: ConsoleLoginRequest,
    db: DBSession = Depends(get_db)
):
    token_record = ConsoleTokenService.get_by_access_token(db, data.token)
    if not token_record:
        raise UnauthorizedException(
            message="콘솔 토큰이 유효하지 않습니다.",
            details="토큰이 만료되었거나 존재하지 않습니다."
        )
    if token_record.expires_at and token_record.expires_at <= datetime.utcnow():
        raise UnauthorizedException(
            message="콘솔 토큰이 만료되었습니다.",
            details="관리자에게 문의해주세요."
        )

    ConsoleTokenService.mark_used(db, token_record.id)
    set_console_cookie(response, data.token, settings.ENVIRONMENT)
    return ConsoleLoginResponse(message="ok")


@router.post("/auth/logout", status_code=status.HTTP_200_OK)
def console_logout(
    response: Response,
    _console_token: str | None = Cookie(None),
):
    clear_console_cookie(response, settings.ENVIRONMENT)
    return {"message": "ok"}


@router.get("/auth/me", status_code=status.HTTP_200_OK)
def console_me(_token=Depends(get_console_token)):
    return {"message": "ok"}


@router.get("/keys", response_model=list[ConsoleKeyItem], status_code=status.HTTP_200_OK)
def list_keys(
    token=Depends(get_console_token),
    db: DBSession = Depends(get_db),
):
    try:
        keys = (
            db.query(CukApiKey)
            .filter(CukApiKey.console_token_id == token.id, CukApiKey.status == "active")
            .order_by(CukApiKey.created_at.desc())
            .all()
        )
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("Failed to read api keys for console: %s", exc)
        keys = []
    if not keys:
        return [
            ConsoleKeyItem(
                id=token.id,
                name=token.token_name,
                key_preview=f"{token.api_key[:6]}...{token.api_key[-4:]}",
                created_at=token.created_at,
            )
        ]
    return [
        ConsoleKeyItem(
            id=key.id,
            name=key.token_name,
            key_preview=f"{key.api_key[:6]}...{key.api_key[-4:]}",
            created_at=key.created_at,
        )
        for key in keys
    ]


@router.get("/usage/summary", status_code=status.HTTP_200_OK)
def usage_summary(
    token=Depends(get_console_token),
    db: DBSession = Depends(get_db),
):
    try:
        key_ids = [
            row.id for row in db.query(CukApiKey.id).filter(CukApiKey.console_token_id == token.id).all()
        ]
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("Failed to read api key ids for usage summary: %s", exc)
        key_ids = []
    if not key_ids:
        return {
            "total_requests": 0,
            "success_rate": 0.0,
            "avg_latency_ms": 0.0,
            "traffic": [0] * 12,
            "top_endpoints": [],
        }

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)

    total_requests = (
        db.query(func.count(CukApiUsageLog.id))
        .filter(
            CukApiUsageLog.api_key_id.in_(key_ids),
            CukApiUsageLog.created_at >= start_time,
        )
        .scalar()
        or 0
    )
    success_requests = (
        db.query(func.count(CukApiUsageLog.id))
        .filter(
            CukApiUsageLog.api_key_id.in_(key_ids),
            CukApiUsageLog.created_at >= start_time,
            CukApiUsageLog.status_code.between(200, 399),
        )
        .scalar()
        or 0
    )
    latency_avg = (
        db.query(func.avg(CukApiUsageLog.latency_ms))
        .filter(
            CukApiUsageLog.api_key_id.in_(key_ids),
            CukApiUsageLog.created_at >= start_time,
        )
        .scalar()
    )
    avg_latency_ms = float(latency_avg) if latency_avg else 0.0

    traffic = []
    for i in range(12):
        bucket_start = start_time + timedelta(hours=2 * i)
        bucket_end = bucket_start + timedelta(hours=2)
        count = (
            db.query(func.count(CukApiUsageLog.id))
            .filter(
                CukApiUsageLog.api_key_id.in_(key_ids),
                CukApiUsageLog.created_at >= bucket_start,
                CukApiUsageLog.created_at < bucket_end,
            )
            .scalar()
            or 0
        )
        traffic.append(int(count))

    top_rows = (
        db.query(
            CukApiUsageLog.endpoint,
            CukApiUsageLog.status_code,
            func.count(CukApiUsageLog.id).label("count"),
        )
        .filter(
            CukApiUsageLog.api_key_id.in_(key_ids),
            CukApiUsageLog.created_at >= start_time,
        )
        .group_by(CukApiUsageLog.endpoint, CukApiUsageLog.status_code)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )
    top_endpoints = [
        {
            "endpoint": row.endpoint,
            "method": "POST",
            "status": str(row.status_code),
            "count": int(row.count),
        }
        for row in top_rows
    ]

    success_rate = 0.0
    if total_requests > 0:
        success_rate = (success_requests / total_requests) * 100

    return {
        "total_requests": int(total_requests),
        "success_rate": round(success_rate, 2),
        "avg_latency_ms": round(avg_latency_ms, 2),
        "traffic": traffic,
        "top_endpoints": top_endpoints,
    }


@router.get("/billing/summary", status_code=status.HTTP_200_OK)
def billing_summary(
    token=Depends(get_console_token),
    db: DBSession = Depends(get_db),
):
    try:
        key_ids = [
            row.id for row in db.query(CukApiKey.id).filter(CukApiKey.console_token_id == token.id).all()
        ]
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("Failed to read api key ids for billing summary: %s", exc)
        key_ids = []
    if not key_ids:
        next_month = (_first_day_of_month(datetime.utcnow()) + timedelta(days=32)).replace(day=1)
        return {
            "total_30d": 0.0,
            "history": [],
            "next_billing_date": next_month.strftime("%Y-%m-%d"),
        }

    today = datetime.utcnow().date()
    start_date = today - timedelta(days=30)

    total_cost = (
        db.query(func.sum(CukApiUsageDaily.cost))
        .filter(
            CukApiUsageDaily.api_key_id.in_(key_ids),
            CukApiUsageDaily.day >= start_date,
        )
        .scalar()
        or 0
    )

    history = []
    current_month_start = _first_day_of_month(datetime.utcnow())
    for offset in range(3, 0, -1):
        period_start = _add_months(current_month_start, -offset)
        period_end = _add_months(current_month_start, -(offset - 1))
        period_cost = (
            db.query(func.sum(CukApiUsageDaily.cost))
            .filter(
                CukApiUsageDaily.api_key_id.in_(key_ids),
                CukApiUsageDaily.day >= period_start.date(),
                CukApiUsageDaily.day < period_end.date(),
            )
            .scalar()
            or 0
        )
        history.append(
            {
                "date": period_start.strftime("%Y-%m"),
                "amount": round(float(period_cost), 2),
                "status": "Paid",
            }
        )

    next_month = _add_months(current_month_start, 1)
    return {
        "total_30d": round(float(total_cost), 2),
        "history": history,
        "next_billing_date": next_month.strftime("%Y-%m-%d"),
    }


def _first_day_of_month(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _add_months(dt: datetime, months: int) -> datetime:
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    return dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
