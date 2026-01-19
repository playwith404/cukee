"""관리자 관련 스키마"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class AdminLoginRequest(BaseModel):
    token: str = Field(..., min_length=32, max_length=32)


class AdminLoginResponse(BaseModel):
    message: str


class AdminTokenInfo(BaseModel):
    expires_at: datetime


class CreateConsoleTokenRequest(BaseModel):
    name: Optional[str] = None
    expires_in_days: Optional[int] = None


class ConsoleTokenItem(BaseModel):
    id: int
    name: Optional[str]
    token_preview: str
    created_at: datetime
    expires_at: Optional[datetime]
    is_revoked: bool


class CreateApiKeyRequest(BaseModel):
    owner_token_id: int
    name: Optional[str] = None


class ApiKeyItem(BaseModel):
    id: int
    owner_token_id: int
    name: Optional[str]
    key_preview: str
    created_at: datetime
    is_revoked: bool


class CreatedTokenResponse(BaseModel):
    id: int
    name: Optional[str]
    token: str
    api_key: str
    created_at: datetime
    expires_at: Optional[datetime]


class CreatedApiKeyResponse(BaseModel):
    id: int
    owner_token_id: int
    name: Optional[str]
    key: str
    created_at: datetime
