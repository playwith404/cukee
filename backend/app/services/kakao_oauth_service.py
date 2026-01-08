"""
Kakao OAuth 서비스
"""
import secrets
import httpx
from urllib.parse import urlencode
from app.core.config import settings


class KakaoOAuthService:
    """Kakao OAuth 서비스"""

    KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize"
    KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
    KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me"

    @staticmethod
    def generate_state() -> str:
        """CSRF 방지를 위한 state 토큰 생성"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Kakao OAuth 인증 URL 생성"""
        params = {
            "client_id": settings.KAKAO_CLIENT_ID,
            "redirect_uri": settings.KAKAO_REDIRECT_URI,
            "response_type": "code",
            "state": state,
        }
        query_string = urlencode(params)
        return f"{KakaoOAuthService.KAKAO_AUTH_URL}?{query_string}"

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        """인증 코드를 액세스 토큰으로 교환"""
        async with httpx.AsyncClient() as client:
            data = {
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "redirect_uri": settings.KAKAO_REDIRECT_URI,
                "code": code,
            }

            # client_secret이 설정된 경우에만 추가
            if settings.KAKAO_CLIENT_SECRET:
                data["client_secret"] = settings.KAKAO_CLIENT_SECRET

            response = await client.post(
                KakaoOAuthService.KAKAO_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if response.status_code != 200:
                raise Exception(f"Failed to exchange code: {response.text}")

            return response.json()

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """액세스 토큰으로 사용자 정보 조회"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                KakaoOAuthService.KAKAO_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                raise Exception(f"Failed to get user info: {response.text}")

            return response.json()
