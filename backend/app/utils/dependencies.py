"""
FastAPI 의존성 (Dependency Injection)
"""
from typing import Optional
from fastapi import Cookie, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session as DBSession
from app.core.database import get_db
from app.services.session_service import SessionService
from app.services.auth_service import AuthService
from app.models import User


def get_current_user(
    request: Request,
    session: Optional[str] = Cookie(None),
    db: DBSession = Depends(get_db)
) -> User:
    """
    현재 인증된 사용자 조회 (HttpOnly Cookie)
    """
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다."
        )

    # 세션 검증
    db_session = SessionService.get_session(db, session)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 세션입니다."
        )

    # 사용자 조회
    user = AuthService.get_user_by_id(db, db_session.user_id)
    return user


def get_current_user_optional(
    request: Request,
    session: Optional[str] = Cookie(None),
    db: DBSession = Depends(get_db)
) -> Optional[User]:
    """
    현재 사용자 조회 (선택적) - 인증되지 않아도 None 반환
    """
    if not session:
        return None

    try:
        db_session = SessionService.get_session(db, session)
        if not db_session:
            return None

        user = AuthService.get_user_by_id(db, db_session.user_id)
        return user
    except:
        return None
