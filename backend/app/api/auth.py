"""
인증 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from sqlalchemy.orm import Session as DBSession
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.schemas.user import SignupRequest, SignupResponse, LoginRequest, LoginResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.services.session_service import SessionService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def set_session_cookie(response: Response, session_id: str, environment: str = "development"):
    """
    HttpOnly Cookie 설정
    개발 환경: SameSite=Lax
    배포 환경: Secure; SameSite=None
    """
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # 7일 (초 단위)

    if environment == "development":
        response.set_cookie(
            key="session",
            value=session_id,
            httponly=True,
            samesite="lax",
            path="/",
            max_age=max_age,
        )
    else:
        response.set_cookie(
            key="session",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=max_age,
        )


@router.post("/signup", response_model=SignupResponse, response_model_by_alias=False, status_code=status.HTTP_201_CREATED)
def signup(
    response: Response,
    request: Request,
    signup_data: SignupRequest,
    db: DBSession = Depends(get_db)
):
    """
    회원가입
    - 이메일 중복 체크
    - 비밀번호 해싱
    - HttpOnly Cookie로 세션 발급
    """
    # 사용자 생성
    user = AuthService.create_user(db, signup_data)

    # 세션 생성
    session = SessionService.create_session(
        db,
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    # HttpOnly Cookie 설정
    set_session_cookie(response, session.id, settings.ENVIRONMENT)

    return SignupResponse(
        user_id=user.id,
        email=user.email,
        nickname=user.nickname
    )


@router.post("/login", response_model=LoginResponse, response_model_by_alias=False, status_code=status.HTTP_200_OK)
def login(
    response: Response,
    request: Request,
    login_data: LoginRequest,
    db: DBSession = Depends(get_db)
):
    """
    로그인
    - 이메일/비밀번호 검증
    - HttpOnly Cookie로 세션 발급
    """
    # 사용자 인증
    user = AuthService.authenticate_user(db, login_data)

    # 세션 생성
    session = SessionService.create_session(
        db,
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    # HttpOnly Cookie 설정
    set_session_cookie(response, session.id, settings.ENVIRONMENT)

    return LoginResponse(
        user_id=user.id,
        email=user.email,
        nickname=user.nickname
    )


@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    session: Optional[str] = Cookie(None),
    db: DBSession = Depends(get_db)
):
    """
    로그아웃
    - 세션 무효화
    - HttpOnly Cookie 삭제
    """
    if session:
        SessionService.revoke_session(db, session)

    # Cookie 삭제
    response.delete_cookie(key="session", path="/")

    return MessageResponse(message="Logged out successfully")


@router.post("/refresh", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def refresh(
    response: Response,
    request: Request,
    session: Optional[str] = Cookie(None),
    db: DBSession = Depends(get_db)
):
    """
    토큰 갱신 (Silent Refresh)
    - 기존 세션 검증
    - 새로운 세션 발급
    """
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="세션이 존재하지 않습니다."
        )

    # 기존 세션 검증
    db_session = SessionService.get_session(db, session)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 세션입니다."
        )

    # 기존 세션 무효화
    SessionService.revoke_session(db, session)

    # 새 세션 생성
    new_session = SessionService.create_session(
        db,
        user_id=db_session.user_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )

    # HttpOnly Cookie 갱신
    set_session_cookie(response, new_session.id, settings.ENVIRONMENT)

    return MessageResponse(message="Token refreshed")
