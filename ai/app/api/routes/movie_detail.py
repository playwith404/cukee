"""영화 상세 설명 생성 엔드포인트"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.dependencies import get_db_session
from app.models.model_loader import model_manager

logger = logging.getLogger(__name__)
router = APIRouter()

class MovieDetailRequest(BaseModel):
    movieId: int
    theme: str = "일반"

class MovieDetailResponse(BaseModel):
    movieId: int
    title: str
    detail: str

@router.post("/movie-detail", response_model=MovieDetailResponse)
async def generate_movie_detail(
    request: MovieDetailRequest,
    db: Session = Depends(get_db_session)
):
    """영화 포스터 클릭 시 상세 소개 생성"""
    try:
        if not model_manager.is_ready():
            raise HTTPException(status_code=503, detail="Model not ready")
        
        # 1. DB에서 영화 정보 조회
        query = text("""
            SELECT id, title_ko, overview_ko, directors, release_date_kr, runtime
            FROM movies
            WHERE id = :movie_id
        """)
        
        result = db.execute(query, {"movie_id": request.movieId})
        movie = result.fetchone()
        
        if not movie:
            raise HTTPException(status_code=404, detail=f"Movie {request.movieId} not found")
        
        logger.info(f"Generating detail for movie: {movie.title_ko}")
        
        # 2. LLM으로 상세 소개 생성
        detail_prompt = f"""Write a detailed movie introduction in Korean (200-300 characters).

Movie Title: {movie.title_ko}
Overview: {movie.overview_ko or '정보 없음'}
Director: {', '.join(movie.directors) if movie.directors else '정보 없음'}
Release Date: {movie.release_date_kr or '정보 없음'}
Runtime: {movie.runtime or '정보 없음'}분
Theme: {request.theme}

Write a compelling introduction for {request.theme} theme audience. Include:
- What makes this movie special
- Why it fits the theme
- What to expect

Write ONLY in Korean, 200-300 characters:"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_length=512,  # 상세 설명이므로 좀 더 길게
            temperature=0.7,
            top_p=0.9,
            top_k=50
        ).strip()
        
        logger.info(f"Successfully generated detail for movie {request.movieId}")
        
        return MovieDetailResponse(
            movieId=movie.id,
            title=movie.title_ko,
            detail=detail
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Movie detail generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
