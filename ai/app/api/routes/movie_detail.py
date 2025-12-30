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
        detail_prompt = f"""영화를 한국어로 간결하게 소개하세요 (100-150자).

영화 제목: {movie.title_ko}
줄거리: {movie.overview_ko or '정보 없음'}
테마: {request.theme}

이 영화가 '{request.theme}' 테마에 맞는 이유를 짧고 명확하게 설명하세요.
완전한 문장으로 작성하고, 100-150자 이내로 끝내세요:

소개:"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_new_tokens=80,  # 짧고 명확한 소개 (약 100-120자)
            temperature=0.3,  # 더 일관된 출력
            top_p=0.9,
            top_k=50
        ).strip()
        
        # "소개:" 접두사 제거 (있을 경우)
        if detail.startswith("소개:"):
            detail = detail[3:].strip()
        
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
