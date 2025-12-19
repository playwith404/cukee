"""
전역 예외 핸들러
모든 예외를 API 명세서(v1.6) 형식으로 변환하여 응답
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Union
import logging

from app.core.exceptions import CukeeException

# 로거 설정
logger = logging.getLogger(__name__)


async def cukee_exception_handler(request: Request, exc: CukeeException) -> JSONResponse:
    """
    커스텀 예외 핸들러
    CukeeException을 표준 에러 포맷으로 응답
    """
    logger.warning(f"CukeeException: {exc.code} - {exc.message} | Path: {request.url.path}")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def validation_exception_handler(
    request: Request,
    exc: Union[RequestValidationError, ValidationError]
) -> JSONResponse:
    """
    Pydantic 유효성 검사 에러 핸들러
    422 Unprocessable Entity로 응답
    """
    errors = exc.errors()
    details = "; ".join([
        f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}"
        for err in errors
    ])

    logger.warning(f"Validation Error: {details} | Path: {request.url.path}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "요청 데이터의 유효성 검사에 실패했습니다.",
                "details": details
            }
        }
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """
    데이터베이스 무결성 제약 위반 핸들러
    409 Conflict로 응답
    """
    # PostgreSQL 에러 코드 파싱
    error_msg = str(exc.orig)

    # 주요 제약 조건 위반 메시지 파싱
    if "duplicate key value violates unique constraint" in error_msg:
        message = "이미 존재하는 데이터입니다."
        if "users_email_key" in error_msg:
            message = "이미 등록된 이메일입니다."
        elif "users_nickname_key" in error_msg:
            message = "이미 사용 중인 닉네임입니다."
    elif "foreign key constraint" in error_msg:
        message = "참조하는 데이터가 존재하지 않습니다."
    else:
        message = "데이터 무결성 제약 조건을 위반했습니다."

    logger.error(f"IntegrityError: {error_msg} | Path: {request.url.path}")

    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": {
                "code": "CONFLICT",
                "message": message,
                "details": error_msg
            }
        }
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    SQLAlchemy 일반 에러 핸들러
    500 Internal Server Error로 응답
    """
    error_msg = str(exc)
    logger.error(f"SQLAlchemyError: {error_msg} | Path: {request.url.path}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "DATABASE_ERROR",
                "message": "데이터베이스 오류가 발생했습니다.",
                "details": error_msg if logger.level <= logging.DEBUG else ""
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    예상하지 못한 모든 예외 핸들러
    500 Internal Server Error로 응답
    """
    error_msg = str(exc)
    logger.error(f"Unhandled Exception: {error_msg} | Path: {request.url.path}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "서버 내부 오류가 발생했습니다.",
                "details": error_msg if logger.level <= logging.DEBUG else ""
            }
        }
    )
