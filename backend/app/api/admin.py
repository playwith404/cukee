"""관리자 콘솔 API"""
from fastapi import APIRouter, Depends, Response, status, Cookie
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session as DBSession
import logging

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException, BadRequestException, NotFoundException
from app.schemas.admin import (
    AdminLoginRequest,
    AdminLoginResponse,
    CreateConsoleTokenRequest,
    ConsoleTokenItem,
    CreateApiKeyRequest,
    ApiKeyItem,
    CreatedTokenResponse,
    CreatedApiKeyResponse,
)
from app.services.admin_service import AdminTokenService
from app.services.console_service import ConsoleTokenService
from app.services.api_key_service import ApiKeyService
from app.utils.dependencies import get_admin_token
from app.models.console import ApiAccessToken
from app.models.api_usage import CukApiKey

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


def set_admin_cookie(response: Response, token: str, environment: str = "development"):
    max_age = settings.ADMIN_TOKEN_TTL_HOURS * 3600
    if environment == "development":
        response.set_cookie(
            key="admin_token",
            value=token,
            httponly=True,
            samesite="lax",
            path="/",
            max_age=max_age,
        )
    else:
        response.set_cookie(
            key="admin_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=max_age,
            domain=".cukee.world",
        )


def clear_admin_cookie(response: Response, environment: str = "development"):
    if environment == "development":
        response.delete_cookie(key="admin_token", path="/")
    else:
        response.delete_cookie(key="admin_token", path="/", domain=".cukee.world")


@router.post("/auth/login", response_model=AdminLoginResponse, status_code=status.HTTP_200_OK)
def admin_login(
    response: Response,
    data: AdminLoginRequest,
    db: DBSession = Depends(get_db)
):
    AdminTokenService.ensure_token(db)
    if not AdminTokenService.verify_token(db, data.token):
        raise UnauthorizedException(
            message="관리자 토큰이 유효하지 않습니다.",
            details="토큰이 만료되었거나 일치하지 않습니다. 최신 토큰을 이메일에서 확인하세요."
        )
    AdminTokenService.mark_login(db)
    set_admin_cookie(response, data.token, settings.ENVIRONMENT)
    return AdminLoginResponse(message="ok")


@router.post("/auth/logout", status_code=status.HTTP_200_OK)
def admin_logout(
    response: Response,
    _admin_token: str | None = Cookie(None),
    db: DBSession = Depends(get_db)
):
    clear_admin_cookie(response, settings.ENVIRONMENT)
    return {"message": "ok"}


@router.get("/auth/me", status_code=status.HTTP_200_OK)
def admin_me(_token=Depends(get_admin_token)):
    return {"message": "ok"}


@router.post("/console-tokens", response_model=CreatedTokenResponse, status_code=status.HTTP_201_CREATED)
def create_console_token(
    data: CreateConsoleTokenRequest,
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    record, raw_token, raw_api_key = ConsoleTokenService.create_access_token(
        db,
        name=data.name,
        expires_in_days=data.expires_in_days,
    )
    ApiKeyService.create_api_key(
        db,
        console_token_id=record.id,
        name=record.token_name,
        api_key_value=raw_api_key,
    )
    display_name = record.token_name
    return CreatedTokenResponse(
        id=record.id,
        name=display_name,
        token=raw_token,
        api_key=raw_api_key,
        created_at=record.created_at,
        expires_at=record.expires_at,
    )


@router.get("/console-tokens", response_model=list[ConsoleTokenItem], status_code=status.HTTP_200_OK)
def list_console_tokens(
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    tokens = db.query(ApiAccessToken).order_by(ApiAccessToken.created_at.desc()).all()
    items: list[ConsoleTokenItem] = []
    for t in tokens:
        items.append(
            ConsoleTokenItem(
                id=t.id,
                name=t.token_name,
                token_preview=f"{t.access_token[:4]}...{t.access_token[-4:]}",
                created_at=t.created_at,
                expires_at=t.expires_at,
                is_revoked=False,
            )
        )
    return items


@router.post("/console-tokens/{token_id}/revoke", status_code=status.HTTP_200_OK)
def revoke_console_token(
    token_id: int,
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    record = db.query(ApiAccessToken).filter(ApiAccessToken.id == token_id).first()
    if not record:
        raise NotFoundException(message="토큰을 찾을 수 없습니다.")
    db.delete(record)
    db.commit()
    return {"message": "ok"}


@router.post("/api-keys", response_model=CreatedApiKeyResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    data: CreateApiKeyRequest,
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    record = db.query(ApiAccessToken).filter(ApiAccessToken.id == data.owner_token_id).first()
    if not record:
        raise BadRequestException(message="유효하지 않은 콘솔 토큰입니다.")
    try:
        api_key_record, raw_api_key = ApiKeyService.create_api_key(
            db,
            console_token_id=record.id,
            name=data.name,
        )
        record.api_key = raw_api_key
        db.commit()
        return CreatedApiKeyResponse(
            id=api_key_record.id,
            owner_token_id=api_key_record.console_token_id,
            name=api_key_record.token_name,
            key=raw_api_key,
            created_at=api_key_record.created_at,
        )
    except SQLAlchemyError as exc:
        logger.error("Failed to create api key in new table: %s", exc)
        raw_api_key = ConsoleTokenService.generate_api_key()
        record.api_key = raw_api_key
        db.commit()
        return CreatedApiKeyResponse(
            id=record.id,
            owner_token_id=record.id,
            name=data.name,
            key=raw_api_key,
            created_at=record.created_at,
        )


@router.get("/api-keys", response_model=list[ApiKeyItem], status_code=status.HTTP_200_OK)
def list_api_keys(
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    try:
        keys = db.query(CukApiKey).order_by(CukApiKey.created_at.desc()).all()
    except SQLAlchemyError as exc:
        logger.error("Failed to read api keys from new table: %s", exc)
        keys = []
    if not keys:
        legacy_keys = db.query(ApiAccessToken).order_by(ApiAccessToken.created_at.desc()).all()
        return [
            ApiKeyItem(
                id=k.id,
                owner_token_id=k.id,
                name=k.token_name,
                key_preview=f"{k.api_key[:6]}...{k.api_key[-4:]}",
                created_at=k.created_at,
                is_revoked=False,
            )
            for k in legacy_keys
        ]
    return [
        ApiKeyItem(
            id=k.id,
            owner_token_id=k.console_token_id,
            name=k.token_name,
            key_preview=f"{k.api_key[:6]}...{k.api_key[-4:]}",
            created_at=k.created_at,
            is_revoked=(k.status == "revoked" or k.revoked_at is not None),
        )
        for k in keys
    ]


@router.post("/api-keys/{key_id}/revoke", status_code=status.HTTP_200_OK)
def revoke_api_key(
    key_id: int,
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    record = ApiKeyService.revoke_api_key(db, key_id)
    if not record:
        raise NotFoundException(message="API 키를 찾을 수 없습니다.")
    return {"message": "ok"}
