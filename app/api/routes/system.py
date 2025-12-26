"""시스템 관련 엔드포인트"""
import torch
from fastapi import APIRouter
from app.models.model_loader import model_manager

router = APIRouter()

@router.get("/health")
def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "model_loaded": model_manager.is_ready(),
        "loaded_themes": len(model_manager.get_loaded_themes())
    }

@router.get("/themes")
def list_themes():
    """로드된 테마 목록"""
    return {
        "themes": model_manager.get_loaded_themes(),
        "total": len(model_manager.get_loaded_themes())
    }

@router.get("/gpu-info")
def gpu_info():
    """GPU 정보"""
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
