"""
공통 Pydantic 스키마
"""
from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    """메시지 응답"""
    message: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Success"
            }
        }
    )


class ErrorResponse(BaseModel):
    """에러 응답"""
    error: dict

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": {
                    "code": "400",
                    "message": "잘못된 요청입니다.",
                    "details": "필수 필드가 누락되었습니다."
                }
            }
        }
    )
