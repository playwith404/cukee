"""
애플리케이션 설정 관리
"""
from pydantic_settings import BaseSettings
from typing import List


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
