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
        
        # 2. LLM으로 상세 소개 생성 (영화 제목과 줄거리만 사용)
        detail_prompt = f"""Write a detailed movie introduction in Korean (200-300 characters).

Movie Title: {movie.title_ko}
Overview: {movie.overview_ko or '정보 없음'}
Theme: {request.theme}

Write a compelling introduction for {request.theme} theme audience. Include:
- What makes this movie special
- Why it fits the theme
- What to expect

Write ONLY in Korean, 200-300 characters:"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_new_tokens=150,  # 입력과 별도로 150 토큰 생성
            temperature=0.3,  # 더 일관된 출력
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
