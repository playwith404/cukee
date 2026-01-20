"""
FastAPI 의존성 (Dependency Injection)
"""
from typing import Optional
from datetime import datetime
from fastapi import Cookie, Depends, Header, Request
from sqlalchemy.orm import Session as DBSession
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.services.session_service import SessionService
from app.services.admin_service import AdminTokenService
from app.services.console_service import ConsoleTokenService
from app.models.admin import AdminToken
from app.models.console import ApiAccessToken
from app.services.auth_service import AuthService
from app.models import User


def get_current_user(
    request: Request,
    session: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: DBSession = Depends(get_db)
) -> User:
    """
    현재 인증된 사용자 조회 (HttpOnly Cookie 또는 Authorization 헤더)
    - 쿠키: 웹 브라우저에서 자동 전송
    - Authorization: 익스텐션에서 세션 ID를 헤더로 전송 (Bearer <session_id>)
    """
    # 1. 쿠키에서 세션 확인
    session_id = session

    # 2. 쿠키가 없으면 Authorization 헤더에서 확인
    if not session_id and authorization:
        if authorization.startswith("Bearer "):
            session_id = authorization[7:]  # "Bearer " 제거

    if not session_id:
        raise UnauthorizedException(
            message="인증이 필요합니다.",
            details="쿠키 또는 Authorization 헤더에 세션 정보가 없습니다."
        )

    # 세션 검증
    db_session = SessionService.get_session(db, session_id)
    if not db_session:
        raise UnauthorizedException(
            message="유효하지 않은 세션입니다.",
            details="세션이 만료되었거나 유효하지 않습니다."
        )

    # 사용자 조회
    user = AuthService.get_user_by_id(db, db_session.user_id)
    return user


def get_current_user_optional(
    request: Request,
    session: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: DBSession = Depends(get_db)
) -> Optional[User]:
    """
    현재 사용자 조회 (선택적) - 인증되지 않아도 None 반환
    쿠키 또는 Authorization 헤더 지원
    """
    # 1. 쿠키에서 세션 확인
    session_id = session

    # 2. 쿠키가 없으면 Authorization 헤더에서 확인
    if not session_id and authorization:
        if authorization.startswith("Bearer "):
            session_id = authorization[7:]

    if not session_id:
        return None

    try:
        db_session = SessionService.get_session(db, session_id)
        if not db_session:
            return None

        user = AuthService.get_user_by_id(db, db_session.user_id)
        return user
    except:
        return None


def get_session_id(
    session: Optional[str] = Cookie(None)
) -> Optional[str]:
    """
    세션 ID 추출 (캐시 키 생성용)
    """
    return session


def get_admin_token(
    admin_token: Optional[str] = Cookie(None),
    db: DBSession = Depends(get_db)
) -> AdminToken:
    """관리자 토큰 쿠키 검증"""
    if not admin_token:
        raise UnauthorizedException(
            message="관리자 인증이 필요합니다.",
            details="쿠키에 관리자 토큰이 없습니다."
        )
    if not AdminTokenService.verify_token(db, admin_token):
        raise UnauthorizedException(
            message="관리자 토큰이 유효하지 않습니다.",
            details="토큰이 만료되었거나 일치하지 않습니다."
        )
    record = AdminTokenService.get_record(db)
    if not record:
        raise UnauthorizedException(
            message="관리자 토큰이 유효하지 않습니다.",
            details="토큰을 찾을 수 없습니다."
        )
    return record


def get_console_token(
    console_token: Optional[str] = Cookie(None),
    db: DBSession = Depends(get_db)
) -> ApiAccessToken:
    """콘솔 토큰 쿠키 검증"""
    if not console_token:
        raise UnauthorizedException(
            message="콘솔 인증이 필요합니다.",
            details="쿠키에 콘솔 토큰이 없습니다."
        )
    record = ConsoleTokenService.get_by_access_token(db, console_token)
    if not record:
        raise UnauthorizedException(
            message="유효하지 않은 콘솔 토큰입니다.",
            details="토큰이 만료되었거나 존재하지 않습니다."
        )
    if record.expires_at and record.expires_at <= datetime.utcnow():
        raise UnauthorizedException(
            message="콘솔 토큰이 만료되었습니다.",
            details="관리자에게 문의해주세요."
        )
    return record
