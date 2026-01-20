"""
API key and usage tracking models.
"""
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.sql import func

from app.core.database import Base


class CukApiKey(Base):
    __tablename__ = "cuk_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    console_token_id = Column(Integer, ForeignKey("api_access_tokens.id"), nullable=False, index=True)
    api_key = Column(String(100), nullable=False, unique=True, index=True)
    token_name = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, server_default="active")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    rpm_limit = Column(Integer, nullable=False, server_default="200")
    tpm_limit = Column(Integer, nullable=False, server_default="30000")
    rpd_limit = Column(Integer, nullable=False, server_default="200000")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)


class CukApiUsageLog(Base):
    __tablename__ = "cuk_api_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("cuk_api_keys.id"), nullable=False, index=True)
    request_id = Column(String(64), nullable=False, index=True)
    endpoint = Column(String(255), nullable=False)
    model = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, nullable=False, server_default="0")
    completion_tokens = Column(Integer, nullable=False, server_default="0")
    total_tokens = Column(Integer, nullable=False, server_default="0")
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Integer, nullable=False, server_default="0")
    cost = Column(Numeric(12, 4), nullable=False, server_default="0")
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CukApiUsageDaily(Base):
    __tablename__ = "cuk_api_usage_daily"

    day = Column(Date, primary_key=True)
    api_key_id = Column(Integer, ForeignKey("cuk_api_keys.id"), primary_key=True)
    model = Column(String(100), primary_key=True)
    requests = Column(Integer, nullable=False, server_default="0")
    errors = Column(Integer, nullable=False, server_default="0")
    prompt_tokens = Column(Integer, nullable=False, server_default="0")
    completion_tokens = Column(Integer, nullable=False, server_default="0")
    total_tokens = Column(Integer, nullable=False, server_default="0")
    cost = Column(Numeric(12, 4), nullable=False, server_default="0")
