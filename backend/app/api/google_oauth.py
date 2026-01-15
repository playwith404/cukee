"""
Google OAuth API 엔드포인트
"""
from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.core.config import settings
from app.schemas.user import LoginResponse
from app.services.google_oauth_service import GoogleOAuthService
from app.services.auth_service import AuthService
from app.services.session_service import SessionService

router = APIRouter(prefix="/api/auth/google", tags=["Google OAuth"])


def set_session_cookie(response: Response, session_id: str, environment: str = "development"):
    """
    세션 쿠키 설정
    - session: HttpOnly 쿠키 (웹용, XSS 방지)
    - session_ext: Non-HttpOnly 쿠키 (Extension용, chrome.cookies API로 접근 가능)
    """
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    if environment == "development":
        # 웹용 HttpOnly 쿠키
        response.set_cookie(
            key="session",
            value=session_id,
            httponly=True,
            samesite="lax",
            path="/",
            max_age=max_age,
        )
        # Extension용 Non-HttpOnly 쿠키
        response.set_cookie(
            key="session_ext",
            value=session_id,
            httponly=False,
            samesite="lax",
            path="/",
            max_age=max_age,
        )
    else:
        # 웹용 HttpOnly 쿠키
        response.set_cookie(
            key="session",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=max_age,
            domain=".cukee.world",
        )
        # Extension용 Non-HttpOnly 쿠키
        response.set_cookie(
            key="session_ext",
            value=session_id,
            httponly=False,
            secure=True,
            samesite="none",
            path="/",
            max_age=max_age,
            domain=".cukee.world",
        )


@router.get("/login")
async def google_login(request: Request):
    """
    Google 로그인 시작
    - state 토큰 생성 후 세션에 저장
    - Google 인증 페이지로 리다이렉트
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )

    state = GoogleOAuthService.generate_state()

    # state를 쿠키에 저장 (CSRF 방지)
    auth_url = GoogleOAuthService.get_authorization_url(state)

    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        max_age=600,  # 10분
        path="/"
    )

    return response


@router.get("/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: str = None,
    state: str = None,
    error: str = None,
    db: DBSession = Depends(get_db)
):
    """
    Google OAuth 콜백 처리
    - 인증 코드를 액세스 토큰으로 교환
    - 사용자 정보 조회
    - 사용자 생성 또는 조회
    - 세션 생성 및 쿠키 설정
    """
    # 프론트엔드 기본 URL (GOOGLE_REDIRECT_URI에서 추출)
    frontend_base_url = settings.GOOGLE_REDIRECT_URI.rsplit('/api', 1)[0]

    # 에러 처리
    if error:
        return RedirectResponse(
            url=f"{frontend_base_url}/auth/login?error=google_auth_failed"
        )

    if not code:
        return RedirectResponse(
            url=f"{frontend_base_url}/auth/login?error=no_code"
        )

    # state 검증 (CSRF 방지)
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        return RedirectResponse(
            url=f"{frontend_base_url}/auth/login?error=invalid_state"
        )

    try:
        # 인증 코드를 액세스 토큰으로 교환
        token_data = await GoogleOAuthService.exchange_code_for_token(code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token"
            )

        # 사용자 정보 조회
        user_info = await GoogleOAuthService.get_user_info(access_token)

        # 사용자 생성 또는 조회
        user = AuthService.get_or_create_google_user(db, user_info)

        # 세션 생성
        session = SessionService.create_session(
            db,
            user_id=user.id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )

        # 프론트엔드 티켓 선택 페이지로 리다이렉트
        redirect_response = RedirectResponse(
            url=f"{settings.GOOGLE_REDIRECT_URI.rsplit('/api', 1)[0]}/home"
        )

        # 세션 쿠키 설정
        set_session_cookie(redirect_response, session.id, settings.ENVIRONMENT)

        # oauth_state 쿠키 삭제
        redirect_response.delete_cookie(key="oauth_state", path="/")

        return redirect_response

    except Exception as e:
        print(f"Google OAuth error: {e}")
        return RedirectResponse(
            url=f"{frontend_base_url}/auth/login?error=google_auth_failed"
        )


@router.get("/url")
async def get_google_auth_url():
    """
    Google 인증 URL 반환 (프론트엔드에서 직접 리다이렉트할 경우 사용)
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )

    state = GoogleOAuthService.generate_state()
    auth_url = GoogleOAuthService.get_authorization_url(state)

    return {
        "url": auth_url,
        "state": state
    }
