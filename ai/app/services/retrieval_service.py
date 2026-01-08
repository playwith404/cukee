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
    async def get_movies_by_ids(db_session, movie_ids: list[int]):
        """
        영화 ID 목록으로 영화 상세 정보 조회
        """
        if not movie_ids:
            return []
            
        try:
            # ID 목록을 문자열로 변환 (SQL IN 절 사용을위해)
            ids_str = ",".join(map(str, movie_ids))
            
            query = text(f"""
                SELECT m.id, m.title_ko, m.overview_ko, m.poster_path
                FROM movies m
                WHERE m.id IN ({ids_str})
            """)
            
            result = db_session.execute(query)
            rows = result.fetchall()
            
            movies = []
            for row in rows:
                movies.append({
                    "id": row.id,
                    "title": row.title_ko,
                    "overview": row.overview_ko or "설명 없음",
                    "poster_path": row.poster_path,
                    "similarity": 1.0 # 고정된 영화이므로 유사도 1.0 (임의값)
                })
                
            return movies
        except Exception as e:
            logger.error(f"Failed to fetch movies by IDs: {e}")
            return []

    @staticmethod
    async def retrieve_similar_movies(db_session, prompt: str, ticket_id: int, limit: int = 5, exclude_ids: list[int] = None, adult_exclude: bool = False):
        """
        사용자 프롬프트와 유사한 영화 검색 (티켓별 필터링 + 19금 필터링)
        """
        try:
            # 1. 프롬프트 임베딩 생성
            embedding = embedding_manager.encode(prompt)
            
            # 제외할 ID 조건 추가
            exclude_condition = ""
            if exclude_ids:
                exclude_ids_str = ",".join(map(str, exclude_ids))
                exclude_condition = f"AND m.id NOT IN ({exclude_ids_str})"

            # 19금 필터링 조건 추가
            # adult_exclude가 True이면 18세 이상(18, 19, Restricted, R, NC-17) 제외
            # (:adult_exclude = false OR m.certification NOT IN (...))
            
            query = text(f"""
                SELECT m.id, m.title_ko, m.overview_ko, m.poster_path, 
                       1 - (me.embedding <=> :embedding) as similarity
                FROM movies m
                JOIN movie_embeddings me ON m.id = me.movie_id
                JOIN ticket_group_movies tgm ON m.id = tgm.movie_id
                WHERE me.embedding IS NOT NULL
                  AND tgm.ticket_group_id = :ticket_id
                {exclude_condition}
                  AND (:adult_exclude = false OR m.certification NOT IN ('18', '19', 'Restricted', 'R', 'NC-17'))
                ORDER BY me.embedding <=> :embedding ASC
                LIMIT :limit
            """)
            
            # vector 타입은 문자열로 변환하여 전달해야 할 수도 있음 (pgvector 버전에 따라 다름)
            embedding_str = str(embedding)
            
            result = db_session.execute(query, {
                "embedding": embedding_str, 
                "ticket_id": ticket_id,
                "limit": limit,
                "adult_exclude": adult_exclude
            })
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
