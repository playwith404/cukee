"""관리자 콘솔 API"""
from fastapi import APIRouter, Depends, Response, status, Cookie
from sqlalchemy.orm import Session as DBSession

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
from app.utils.dependencies import get_admin_token
from app.models.console import ApiAccessToken

router = APIRouter(prefix="/api/admin", tags=["Admin"])


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
    display_name = record.token_type if record.token_type and record.token_type != "Bearer" else None
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
        name = t.token_type if t.token_type and t.token_type != "Bearer" else None
        items.append(
            ConsoleTokenItem(
                id=t.id,
                name=name,
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
    raw_api_key = ConsoleTokenService.generate_api_key()
    record.api_key = raw_api_key
    db.commit()
    return CreatedApiKeyResponse(
        id=record.id,
        owner_token_id=record.id,
        name=data.name,
        key=raw_api_key,
        created_at=record.created_at
    )


@router.get("/api-keys", response_model=list[ApiKeyItem], status_code=status.HTTP_200_OK)
def list_api_keys(
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    keys = db.query(ApiAccessToken).order_by(ApiAccessToken.created_at.desc()).all()
    return [
        ApiKeyItem(
            id=k.id,
            owner_token_id=k.id,
            name=None,
            key_preview=f"{k.api_key[:6]}...{k.api_key[-4:]}",
            created_at=k.created_at,
            is_revoked=False,
        )
        for k in keys
    ]


@router.post("/api-keys/{key_id}/revoke", status_code=status.HTTP_200_OK)
def revoke_api_key(
    key_id: int,
    _token=Depends(get_admin_token),
    db: DBSession = Depends(get_db)
):
    record = db.query(ApiAccessToken).filter(ApiAccessToken.id == key_id).first()
    if not record:
        raise NotFoundException(message="API 키를 찾을 수 없습니다.")
    db.delete(record)
    db.commit()
    return {"message": "ok"}
