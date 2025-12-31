"""
인증 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, status, Response, Request, Cookie, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, BadRequestException
from app.schemas.user import (
    SignupRequest, SignupResponse, LoginRequest, LoginResponse,
    SendVerificationRequest, SendVerificationResponse,
    VerifyCodeRequest, VerifyCodeResponse
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.services.session_service import SessionService
from app.services.verification_service import VerificationService
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
    - 이메일 인증 완료 확인
    - 이메일 중복 체크
    - 비밀번호 해싱
    - HttpOnly Cookie로 세션 발급
    """
    # 이메일 인증 완료 확인
    if not VerificationService.is_email_verified(signup_data.email):
        raise BadRequestException(
            message="이메일 인증이 완료되지 않았습니다.",
            details="먼저 이메일 인증을 완료해주세요."
        )

    # 사용자 생성
    user = AuthService.create_user(db, signup_data)

    # 인증 완료 플래그 삭제
    VerificationService.clear_verified_flag(signup_data.email)

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
        raise UnauthorizedException(
            message="세션이 존재하지 않습니다.",
            details="쿠키에 세션 정보가 없습니다."
        )

    # 기존 세션 검증
    db_session = SessionService.get_session(db, session)
    if not db_session:
        raise UnauthorizedException(
            message="유효하지 않은 세션입니다.",
            details="세션이 만료되었거나 유효하지 않습니다."
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


@router.post("/email/send", response_model=SendVerificationResponse, status_code=status.HTTP_200_OK)
def send_verification_code(
    request_data: SendVerificationRequest,
    db: DBSession = Depends(get_db)
):
    """
    이메일 인증번호 발송
    - 6자리 인증번호 생성
    - Redis에 저장 (5분 TTL)
    - 이메일 발송
    - Rate limiting: 1분에 1회
    """
    from app.models import User

    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == request_data.email).first()
    # 이미 존재하고, 활동 중인 유저인 경우에만 에러 발생 (탈퇴 유저는 인증 허용)
    if existing_user and not existing_user.is_deleted:
        raise BadRequestException(
            message="이미 등록된 이메일입니다.",
            details="다른 이메일을 사용해주세요."
        )

    try:
        result = VerificationService.send_verification_code(request_data.email)
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "success": False,
                    "message": result["message"],
                    "retry_after": result.get("retry_after")
                }
            )
        return SendVerificationResponse(
            success=True,
            message=result["message"],
            expires_in=result.get("expires_in")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": "이메일 발송에 실패했습니다."}
        )


@router.post("/email/verify", response_model=VerifyCodeResponse, status_code=status.HTTP_200_OK)
def verify_email_code(request_data: VerifyCodeRequest):
    """
    이메일 인증번호 검증
    - Redis에서 인증번호 확인
    - 성공 시 인증 완료 플래그 설정
    """
    result = VerificationService.verify_code(request_data.email, request_data.code)

    if not result["success"]:
        error_code = result.get("error_code")
        if error_code == "EXPIRED":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail={
                    "success": False,
                    "message": result["message"],
                    "error_code": error_code
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": result["message"],
                    "error_code": error_code
                }
            )

    return VerifyCodeResponse(
        success=True,
        message=result["message"]
    )


@router.get("/me", response_model=LoginResponse, response_model_by_alias=False, status_code=status.HTTP_200_OK)
def get_current_user_info(
    current_user=Depends(get_current_user)
):
    """
    내 정보 조회 (세션 확인용)
    - 쿠키 세션이 유효하면 사용자 정보 반환
    - 유효하지 않으면 401 Unauthorized (get_current_user에서 처리)
    """
    return LoginResponse(
        user_id=current_user.id,
        email=current_user.email,
        nickname=current_user.nickname
    )
