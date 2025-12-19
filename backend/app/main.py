"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, users, ai, exhibitions

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

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,  # 필수! HttpOnly Cookie 사용
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(ai.router)
app.include_router(exhibitions.router)


@app.get("/")
def root():
    """헬스체크"""
    return {
        "status": "ok",
        "message": "Cukee API is running",
        "version": "1.6.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
def health_check():
    """헬스체크"""
    return {"status": "healthy"}
