"""
RAG 검색 서비스
"""
import logging
from sqlalchemy import text
from app.api.dependencies import get_db_session
from app.models.embedding_loader import embedding_manager

logger = logging.getLogger(__name__)

class RetrievalService:
    """PGVECTOR 기반 유사 영화 검색 서비스"""

    @staticmethod
    async def retrieve_similar_movies(db_session, prompt: str, limit: int = 5):
        """
        사용자 프롬프트와 유사한 영화 검색
        
        Args:
            db_session: DB 세션
            prompt: 사용자 입력 프롬프트
            limit: 반환할 영화 개수
            
        Returns:
            유사한 영화 목록 (List[dict])
        """
        try:
            # 1. 프롬프트 임베딩 생성
            embedding = embedding_manager.encode(prompt)
            
            # 2. PGVECTOR 코사인 유사도 검색
            # embedding <=> vector : 코사인 거리 (작을수록 유사)
            # 1 - (embedding <=> vector) : 코사인 유사도 (클수록 유사)
            query = text("""
                SELECT m.id, m.title_ko, m.overview_ko, m.poster_path, 
                       1 - (me.embedding <=> :embedding) as similarity
                FROM movies m
                JOIN movie_embeddings me ON m.id = me.movie_id
                WHERE me.embedding IS NOT NULL
                ORDER BY me.embedding <=> :embedding ASC
                LIMIT :limit
            """)
            
            # vector 타입은 문자열로 변환하여 전달해야 할 수도 있음 (pgvector 버전에 따라 다름)
            # 여기서는 리스트를 문자열로 변환 "[1.0, 0.5, ...]"
            embedding_str = str(embedding)
            
            result = db_session.execute(query, {"embedding": embedding_str, "limit": limit})
            rows = result.fetchall()
            
            movies = []
            for row in rows:
                movies.append({
                    "id": row.id,
                    "title": row.title_ko,
                    "overview": row.overview_ko or "설명 없음",
                    "poster_path": row.poster_path,
                    "similarity": float(row.similarity)
                })
            
            logger.info(f"Retrieved {len(movies)} similar movies for prompt: {prompt[:30]}...")
            return movies
            
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            # 검색 실패 시 빈 리스트 반환 (RAG 없이 진행 가능하도록)
            return []
