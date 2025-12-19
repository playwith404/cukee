"""
커스텀 예외 클래스 정의
API 명세서(v1.6) - 공통 에러 응답 형식에 맞춘 예외 처리
"""
from fastapi import HTTPException, status
from typing import Optional


class CukeeException(HTTPException):
    """
    큐키 기본 예외 클래스
    API 명세서 표준 에러 포맷: { "error": { "code": "string", "message": "string", "details": "string" } }
    """
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[str] = None
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or ""
        super().__init__(status_code=status_code, detail=self._format_error())

    def _format_error(self) -> dict:
        """에러 응답을 API 명세서 형식으로 포맷"""
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details
            }
        }


# 400 Bad Request - 잘못된 요청
class BadRequestException(CukeeException):
    """잘못된 요청"""
    def __init__(self, message: str = "잘못된 요청입니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message=message,
            details=details
        )


# 401 Unauthorized - 인증 실패
class UnauthorizedException(CukeeException):
    """인증 실패 (쿠키 없음/만료)"""
    def __init__(self, message: str = "인증에 실패했습니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
            details=details
        )


# 403 Forbidden - 권한 없음
class ForbiddenException(CukeeException):
    """권한 없음"""
    def __init__(self, message: str = "접근 권한이 없습니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
            details=details
        )


# 404 Not Found - 리소스 없음
class NotFoundException(CukeeException):
    """리소스 없음"""
    def __init__(self, message: str = "요청한 리소스를 찾을 수 없습니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
            details=details
        )


# 409 Conflict - 충돌
class ConflictException(CukeeException):
    """충돌 (이메일 중복 등)"""
    def __init__(self, message: str = "리소스 충돌이 발생했습니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
            message=message,
            details=details
        )


# 422 Unprocessable Entity - 비즈니스 로직 오류
class UnprocessableEntityException(CukeeException):
    """비즈니스 로직 오류"""
    def __init__(self, message: str = "요청을 처리할 수 없습니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="UNPROCESSABLE_ENTITY",
            message=message,
            details=details
        )


# 500 Internal Server Error - 서버 오류
class InternalServerErrorException(CukeeException):
    """서버 내부 오류"""
    def __init__(self, message: str = "서버 내부 오류가 발생했습니다.", details: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message=message,
            details=details
        )
