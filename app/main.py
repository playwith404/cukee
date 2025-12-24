"""
FastAPI 메인 애플리케이션 - AI Model API Server
"""
import logging
import json
import torch
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.schemas import GenerateRequest, GenerateResponse, HealthResponse, ErrorResponse
from app.model_loader import model_manager

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 라이프사이클 이벤트"""
    # 시작 시
    logger.info("Starting AI Model API Server...")
    logger.info(f"GPU Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"GPU Device: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    
    # 모델 초기화
    try:
        model_manager.initialize()
        logger.info("✓ All models loaded successfully")
    except Exception as e:
        logger.error(f"✗ Failed to initialize models: {e}")
        raise
    
    yield
    
    # 종료 시
    logger.info("Shutting down AI Model API Server...")
    # 메모리 정리
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# FastAPI 앱 생성
app = FastAPI(
    title="Cukee AI Model API",
    description="11개 테마의 LoRA 어댑터를 사용한 영화 추천 AI API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 - VM1의 백엔드와 통신 가능하도록
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 구체적으로 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    """루트 엔드포인트"""
    return {
        "service": "Cukee AI Model API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """헬스체크 엔드포인트"""
    return HealthResponse(
        status="healthy" if model_manager.is_ready() else "initializing",
        loaded_themes=model_manager.get_loaded_themes(),
        gpu_available=torch.cuda.is_available()
    )


@app.get("/themes", tags=["Model"])
def list_themes():
    """로드된 테마 목록 조회"""
    return {
        "themes": model_manager.get_loaded_themes(),
        "total": len(model_manager.get_loaded_themes())
    }


@app.post("/api/v1/generate", response_model=GenerateResponse, tags=["AI"])
async def generate_exhibition(request: GenerateRequest):
    """
    AI 전시회 생성 엔드포인트
    
    - 선택된 테마의 LoRA 어댑터를 사용하여 영화 추천 생성
    - 프롬프트 기반으로 큐레이션 결과 JSON 생성
    """
    try:
        # 모델 준비 확인
        if not model_manager.is_ready():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model is not ready yet"
            )
        
        # 테마 확인
        if request.theme not in model_manager.get_loaded_themes():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Theme '{request.theme}' not found. Available themes: {model_manager.get_loaded_themes()}"
            )
        
        logger.info(f"Generating exhibition for theme: {request.theme}")
        logger.info(f"Prompt: {request.prompt[:100]}...")
        
        # AI 모델로 텍스트 생성
        generated_text = model_manager.generate(
            prompt=request.prompt,
            theme=request.theme,
            max_length=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k
        )
        
        logger.info(f"Generated text length: {len(generated_text)}")
        
        # 생성된 텍스트를 JSON으로 파싱 시도
        try:
            result_json = json.loads(generated_text)
        except json.JSONDecodeError:
            # JSON 파싱 실패 시, 텍스트를 그대로 반환하거나 기본 구조 사용
            logger.warning("Failed to parse generated text as JSON, using fallback structure")
            result_json = {
                "title": f"{request.theme} 큐레이션",
                "raw_output": generated_text,
                "design": {
                    "font": "Pretendard",
                    "colorScheme": "dark",
                    "layoutType": "grid",
                    "frameStyle": "modern",
                    "background": "#1a1a1a",
                    "backgroundImage": ""
                },
                "movies": [],
                "keywords": [request.theme]
            }
        
        return GenerateResponse(
            result_json=result_json,
            theme=request.theme
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


@app.get("/gpu-info", tags=["System"])
def gpu_info():
    """GPU 정보 조회"""
    if not torch.cuda.is_available():
        return {"gpu_available": False}
    
    return {
        "gpu_available": True,
        "device_count": torch.cuda.device_count(),
        "device_name": torch.cuda.get_device_name(0),
        "total_memory_gb": torch.cuda.get_device_properties(0).total_memory / 1e9,
        "allocated_memory_gb": torch.cuda.memory_allocated(0) / 1e9,
        "cached_memory_gb": torch.cuda.memory_reserved(0) / 1e9,
        "cuda_version": torch.version.cuda
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        log_level=settings.LOG_LEVEL
    )
