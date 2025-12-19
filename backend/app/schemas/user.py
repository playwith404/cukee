"""
사용자 관련 Pydantic 스키마
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class SignupRequest(BaseModel):
    """회원가입 요청"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    nickname: str = Field(..., min_length=1, max_length=20)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "password123",
                "nickname": "큐키유저"
            }
        }
    )


class SignupResponse(BaseModel):
    """회원가입 응답"""
    userId: int = Field(..., alias="user_id")
    email: str
    nickname: str

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "userId": 1,
                "email": "user@example.com",
                "nickname": "큐키유저"
            }
        }
    )


class LoginRequest(BaseModel):
    """로그인 요청"""
    email: EmailStr
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }
    )


class LoginResponse(BaseModel):
    """로그인 응답"""
    userId: int = Field(..., alias="user_id")
    email: str
    nickname: str

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "userId": 1,
                "email": "user@example.com",
                "nickname": "큐키유저"
            }
        }
    )


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    userId: int = Field(..., alias="user_id")
    email: str
    nickname: str
    createdAt: datetime = Field(..., alias="created_at")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "userId": 1,
                "email": "user@example.com",
                "nickname": "큐키유저",
                "createdAt": "2025-12-17T10:00:00Z"
            }
        }
    )


class UpdateUserRequest(BaseModel):
    """사용자 정보 수정 요청"""
    nickname: str = Field(..., min_length=1, max_length=20)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nickname": "새닉네임"
            }
        }
    )
