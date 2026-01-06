"""
사용자 관련 데이터베이스 모델
"""
from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class SocialProviderEnum(str, enum.Enum):
    """소셜 로그인 제공자"""
    kakao = "kakao"
    google = "google"
    email = "email"


class User(Base):
    """사용자 테이블"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nickname = Column(String(20), nullable=False, index=True)
    email_verified = Column(Boolean, default=False)
    hashed_password = Column(String, nullable=False)
    social_provider = Column(Enum(SocialProviderEnum), nullable=True)
    social_id = Column(String, nullable=True)
    agree_service = Column(Boolean, nullable=False)
    agree_privacy = Column(Boolean, nullable=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
