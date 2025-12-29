"""
BGE-M3 임베딩 모델 로더
"""
import logging
from typing import List, Union
from sentence_transformers import SentenceTransformer
import torch
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingManager:
    """BGE-M3 임베딩 모델 관리"""
    
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    def initialize(self):
        """임베딩 모델 로드"""
        try:
            logger.info(f"Loading embedding model from: {settings.EMBEDDING_MODEL_PATH}")
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL_PATH)
            self.model.to(self.device)
            self.model.eval()
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    def encode(self, texts: Union[str, List[str]]) -> List[float]:
        """텍스트 임베딩 생성 (1024차원)"""
        if not self.model:
            raise RuntimeError("Embedding model not initialized")
            
        try:
            # BGE-M3는 [1024] 차원 벡터 반환
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise

    def is_ready(self) -> bool:
        return self.model is not None

# 전역 임베딩 매니저
embedding_manager = EmbeddingManager()
