"""
애플리케이션 설정 관리
"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/cukee_db"

    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7일

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://cukee.com"

    # Environment
    ENVIRONMENT: str = "development"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    EMAIL_FROM_NAME: str = "Cukee"

    # Verification Code
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 5

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "https://middle.cloudkakao.store/api/auth/google/callback"

    # Kakao OAuth
    KAKAO_CLIENT_ID: Optional[str] = None
    KAKAO_CLIENT_SECRET: Optional[str] = None
    KAKAO_REDIRECT_URI: str = "https://middle.cloudkakao.store/api/auth/kakao/callback"

    @property
    def allowed_origins_list(self) -> List[str]:
        """CORS 허용 출처 리스트 반환"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        """개발 환경 여부"""
        return self.ENVIRONMENT == "development"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
