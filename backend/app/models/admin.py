"""
관리자 토큰 모델 (기존 테이블 사용)
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class AdminToken(Base):
    """관리자 로그인 토큰"""
    __tablename__ = "admin_tokens"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(50), nullable=False)
    admin_token = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
