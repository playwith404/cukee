"""콘솔 관련 스키마"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class ConsoleLoginRequest(BaseModel):
    token: str = Field(..., min_length=16, max_length=16)


class ConsoleLoginResponse(BaseModel):
    message: str


class ConsoleKeyItem(BaseModel):
    id: int
    name: Optional[str]
    key_preview: str
    created_at: datetime
