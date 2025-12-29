"""
영화 데이터 임베딩 생성 스크립트
실행: python -m app.scripts.generate_embeddings
"""
import sys
import os
import asyncio
import logging
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.embedding_loader import embedding_manager

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_embeddings():
    """모든 영화에 대해 임베딩 생성 및 저장"""
    logger.info("Initializing embedding model...")
    embedding_manager.initialize()
    
    db = SessionLocal()
    try:
        # 1. 임베딩이 없는 영화 조회 (movie_embeddings 테이블과 LEFT JOIN)
        logger.info("Fetching movies without embeddings...")
        query = text("""
            SELECT m.id, m.title_ko, m.overview_ko, m.genres 
            FROM movies m 
            LEFT JOIN movie_embeddings me ON m.id = me.movie_id 
            WHERE me.id IS NULL
        """)
        movies = db.execute(query).fetchall()
        
        total_movies = len(movies)
        logger.info(f"Found {total_movies} movies to embed")
        
        for i, movie in enumerate(movies):
            try:
                # 2. 텍스트 청크 생성 (제목 + 줄거리 + 장르)
                # 장르는 배열일 수 있으므로 문자열로 변환 처리
                genres_str = ""
                if hasattr(movie, 'genres') and movie.genres:
                    if isinstance(movie.genres, list):
                        genres_str = " ".join(movie.genres)
                    else:
                        genres_str = str(movie.genres)
                        
                text_chunk = f"{movie.title_ko}\n{genres_str}\n{movie.overview_ko or ''}"
                
                # 3. 임베딩 생성
                embedding = embedding_manager.encode(text_chunk)
                
                # 4. DB 저장 (movie_embeddings 테이블에 INSERT)
                # vector 타입은 문자열로 변환하여 저장
                embedding_str = str(embedding)
                
                insert_query = text("""
                    INSERT INTO movie_embeddings (movie_id, embedding, model_name, updated_at)
                    VALUES (:movie_id, :embedding, 'bge-m3', NOW())
                """)
                db.execute(insert_query, {"movie_id": movie.id, "embedding": embedding_str})
                
                # 50개마다 커밋
                if (i + 1) % 50 == 0:
                    db.commit()
                    logger.info(f"Progress: {i + 1}/{total_movies} movies processed")
                    
            except Exception as e:
                logger.error(f"Failed to process movie {movie.id} ({movie.title_ko}): {e}")
                continue
                
        db.commit()
        logger.info("Successfully finished generating embeddings for all movies!")
        
    except Exception as e:
        logger.error(f"Script failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_embeddings()
