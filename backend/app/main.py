"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
import threading
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.exceptions import CukeeException
from app.core.exception_handlers import (
    cukee_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app.api import auth, users, ai, public_ai, exhibitions, tickets, google_oauth, kakao_oauth, animalese, admin, console
from app.services.admin_service import AdminTokenService
from app.services.metrics_service import ApiMetricsMiddleware

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱 생성
app = FastAPI(
    title="Cukee API",
    description="큐키 백엔드 API (HttpOnly Cookie 인증)",
    version="1.6.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

Instrumentator().instrument(app).expose(app, endpoint="/api/metrics")
app.add_middleware(ApiMetricsMiddleware)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,  # 필수! HttpOnly Cookie 사용
    allow_methods=["*"],
    allow_headers=["*"],
)

# 예외 핸들러 등록 (API 명세서 v1.6 표준 에러 포맷)
app.add_exception_handler(CukeeException, cukee_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(ai.router)
app.include_router(public_ai.router)
app.include_router(tickets.router)  # 티켓 API
app.include_router(exhibitions.router)  # 전시회 API (DB 연동)
app.include_router(google_oauth.router)  # Google OAuth
app.include_router(kakao_oauth.router)  # Kakao OAuth
app.include_router(animalese.router)  # Animalese 음성 합성
app.include_router(admin.router)  # Admin API
app.include_router(console.router)  # Console API


@app.get("/")
def root():
    """헬스체크"""
    return {
        "status": "ok",
        "message": "Cukee API is running",
        "version": "1.6.0",
        "environment": settings.ENVIRONMENT
    }


@app.on_event("startup")
def ensure_admin_token_on_startup():
    def refresh_loop():
        while True:
            db = SessionLocal()
            try:
                AdminTokenService.ensure_token(db)
            except Exception as exc:
                print(f"[admin] 토큰 갱신 실패: {exc}")
            finally:
                db.close()
            time.sleep(3600)

    thread = threading.Thread(target=refresh_loop, daemon=True)
    thread.start()


@app.get("/health")
def health_check():
    """헬스체크"""
    return {"status": "healthy"}
