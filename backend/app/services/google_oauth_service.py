"""
Google OAuth 서비스
"""
import secrets
import httpx
from typing import Optional
from app.core.config import settings


class GoogleOAuthService:
    """Google OAuth 서비스"""

    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    @staticmethod
    def generate_state() -> str:
        """CSRF 방지를 위한 state 토큰 생성"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Google OAuth 인증 URL 생성"""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{GoogleOAuthService.GOOGLE_AUTH_URL}?{query_string}"

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        """인증 코드를 액세스 토큰으로 교환"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GoogleOAuthService.GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI
                }
            )

            if response.status_code != 200:
                raise Exception(f"Failed to exchange code: {response.text}")

            return response.json()

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """액세스 토큰으로 사용자 정보 조회"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GoogleOAuthService.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                raise Exception(f"Failed to get user info: {response.text}")

            return response.json()
