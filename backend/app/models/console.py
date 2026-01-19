"""
콘솔 토큰 테이블 모델 (기존 테이블 사용)
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class ApiAccessToken(Base):
    """콘솔 토큰 + API 키"""
    __tablename__ = "api_access_tokens"

    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String(100), nullable=False)
    access_token = Column(String, nullable=False)
    token_type = Column(String(50), default="Bearer")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
