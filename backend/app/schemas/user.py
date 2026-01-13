"""
사용자 관련 Pydantic 스키마
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class SendVerificationRequest(BaseModel):
    """인증번호 발송 요청"""
    email: EmailStr

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com"
            }
        }
    )


class SendVerificationResponse(BaseModel):
    """인증번호 발송 응답"""
    success: bool
    message: str
    expiresIn: Optional[int] = Field(None, alias="expires_in")
    retryAfter: Optional[int] = Field(None, alias="retry_after")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "success": True,
                "message": "인증번호가 발송되었습니다.",
                "expiresIn": 300
            }
        }
    )


class VerifyCodeRequest(BaseModel):
    """인증번호 검증 요청"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "code": "123456"
            }
        }
    )


class VerifyCodeResponse(BaseModel):
    """인증번호 검증 응답"""
    success: bool
    message: str
    errorCode: Optional[str] = Field(None, alias="error_code")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "success": True,
                "message": "이메일 인증이 완료되었습니다."
            }
        }
    )


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
        by_alias=False,
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
    sessionId: Optional[str] = Field(None, alias="session_id")  # 익스텐션용 세션 ID

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        by_alias=False,
        json_schema_extra={
            "example": {
                "userId": 1,
                "email": "user@example.com",
                "nickname": "큐키유저",
                "sessionId": "uuid-session-id"
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
        by_alias=False,
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
    nickname: Optional[str] = Field(None, min_length=1, max_length=20)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nickname": "새닉네임"
            }
        }
    )


class WithdrawRequest(BaseModel):
    """회원 탈퇴 요청"""
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "password": "password123"
            }
        }
    )


class ResetPasswordRequest(BaseModel):
    """비밀번호 재설정 요청"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=100, alias="newPassword")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "code": "123456",
                "newPassword": "newpassword123"
            }
        }
    )
