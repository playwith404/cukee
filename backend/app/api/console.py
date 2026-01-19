"""콘솔 API"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Response, status, Cookie
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.schemas.console import ConsoleLoginRequest, ConsoleLoginResponse, ConsoleKeyItem
from app.services.console_service import ConsoleTokenService
from app.utils.dependencies import get_console_token
from app.services.prometheus_service import query_instant, query_range, query_vector

router = APIRouter(prefix="/api/console", tags=["Console"])


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
    token=Depends(get_console_token)
):
    return [
        ConsoleKeyItem(
            id=token.id,
            name=None,
            key_preview=f"{token.api_key[:6]}...{token.api_key[-4:]}",
            created_at=token.created_at,
        )
    ]


@router.get("/usage/summary", status_code=status.HTTP_200_OK)
async def usage_summary(token=Depends(get_console_token)):
    token_id = token.id
    total_query = f'sum(cukee_api_requests_total{{token_id="{token_id}"}})'
    success_query = f'sum(cukee_api_requests_total{{token_id="{token_id}",status=~"2..|3.."}})'
    latency_sum_query = f'sum(rate(cukee_api_request_latency_ms_sum{{token_id="{token_id}"}}[5m]))'
    latency_count_query = f'sum(rate(cukee_api_request_latency_ms_count{{token_id="{token_id}"}}[5m]))'

    total_requests = await query_instant(total_query)
    success_requests = await query_instant(success_query)
    latency_sum = await query_instant(latency_sum_query)
    latency_count = await query_instant(latency_count_query)

    success_rate = 0.0
    if total_requests > 0:
        success_rate = (success_requests / total_requests) * 100

    avg_latency_ms = 0.0
    if latency_count > 0:
        avg_latency_ms = latency_sum / latency_count

    end = datetime.utcnow().timestamp()
    start = (datetime.utcnow() - timedelta(hours=24)).timestamp()
    traffic_query = f'sum(increase(cukee_api_requests_total{{token_id="{token_id}"}}[2h]))'
    traffic = await query_range(traffic_query, start, end, 7200)

    top_query = (
        f'topk(5, sum by (endpoint, method, status) '
        f'(increase(cukee_api_requests_total{{token_id="{token_id}"}}[24h])))'
    )
    top_rows = await query_vector(top_query)
    top_endpoints = [
        {
            "endpoint": row["metric"].get("endpoint", "-"),
            "method": row["metric"].get("method", "-"),
            "status": row["metric"].get("status", "-"),
            "count": int(row["value"]),
        }
        for row in top_rows
    ]

    return {
        "total_requests": int(total_requests),
        "success_rate": round(success_rate, 2),
        "avg_latency_ms": round(avg_latency_ms, 2),
        "traffic": [int(v) for v in traffic],
        "top_endpoints": top_endpoints,
    }


@router.get("/billing/summary", status_code=status.HTTP_200_OK)
async def billing_summary(token=Depends(get_console_token)):
    token_id = token.id
    total_query = f'sum(increase(cukee_api_cost_total{{token_id="{token_id}"}}[30d]))'
    total_cost = await query_instant(total_query)

    end = datetime.utcnow()
    start = end - timedelta(days=90)
    history_query = f'sum(increase(cukee_api_cost_total{{token_id="{token_id}"}}[30d]))'
    history_values = await query_range(history_query, start.timestamp(), end.timestamp(), 2592000)

    history = []
    for idx, value in enumerate(history_values[-3:]):
        date = (end - timedelta(days=30 * (len(history_values[-3:]) - idx - 1))).strftime("%Y-%m")
        history.append({
            "date": date,
            "amount": round(float(value), 2),
            "status": "Paid"
        })

    next_month = (end.replace(day=1) + timedelta(days=32)).replace(day=1)
    return {
        "total_30d": round(total_cost, 2),
        "history": history,
        "next_billing_date": next_month.strftime("%Y-%m-%d"),
    }
