"""
Cukee AI Model API Server
"""
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models.model_loader import model_manager
from app.models.embedding_loader import embedding_manager
from app.api.routes import generation, curation, system

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 실행"""
    logger.info("Starting Cukee AI Server...")
    
    # 모델 로드 (순차적)
    model_manager.initialize()
    embedding_manager.initialize()
    
    logger.info("✓ All models loaded successfully")
    yield
    logger.info("Shutting down Cukee AI Server...")


# FastAPI 앱 생성
app = FastAPI(
    title="Cukee AI Model API",
    description="영화 큐레이션 AI 모델 서버",
    version="1.0.0",
    lifespan=lifespan
)

# 라우터 등록
app.include_router(generation.router, prefix="/api/v1", tags=["AI"])
app.include_router(curation.router, prefix="/api/v1", tags=["Curation"])
app.include_router(system.router, tags=["System"])


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "message": "Cukee AI Model API Server",
        "version": "1.0.0",
        "status": "running"
    }
