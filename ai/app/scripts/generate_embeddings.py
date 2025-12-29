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
        # 1. 임베딩이 없는 영화 조회
        logger.info("Fetching movies without embeddings...")
        query = text("SELECT id, title_ko, overview_ko, genres FROM movies WHERE embedding IS NULL")
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
                
                # 4. DB 업데이트
                # vector 타입은 문자열로 변환하여 저장 (pgvector 호환성)
                embedding_str = str(embedding)
                
                update_query = text("UPDATE movies SET embedding = :embedding WHERE id = :id")
                db.execute(update_query, {"embedding": embedding_str, "id": movie.id})
                
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
