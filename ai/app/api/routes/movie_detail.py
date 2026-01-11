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
        
        # 1. DB에서 영화 정보 조회 (장르 포함, 키워드 제외)
        query = text("""
            SELECT 
                m.id, 
                m.title_ko, 
                m.overview_ko,
                COALESCE(string_agg(DISTINCT g.name, ', '), '') as genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.id
            WHERE m.id = :movie_id
            GROUP BY m.id
        """)
        
        result = db.execute(query, {"movie_id": request.movieId})
        movie = result.fetchone()
        
        if not movie:
            raise HTTPException(status_code=404, detail=f"Movie {request.movieId} not found")
        
        logger.info(f"Generating detail for movie: {movie.title_ko}")
        
        # 2. LLM으로 분위기 중심의 상세 소개 생성
        detail_prompt = f"""[Role]
You are a movie curator with a distinct personality matching the '{request.theme}' theme.

[Context]
- Movie Title: {movie.title_ko}
- Genres: {movie.genres}
- Plot Summary: {movie.overview_ko or '정보 없음'}
- Current Theme: {request.theme}

[Task]
Describe the mood, vibe, and emotional experience of this movie in Korean. 
Explain why this movie is a perfect fit for the '{request.theme}' theme.

[Rules]
1. Focus: Mood and feeling over raw plot details.
2. Tone: Strictly follow the '{request.theme}' persona's speech style.
3. Length: 100-150 characters.
4. Format: Must consist of COMPLETE sentences ending with proper punctuation (e.g., '.', '!').
5. Language: Korean only.

[Output]
소개:"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_new_tokens=150,  # 충분한 길이 확보
            temperature=0.4,
            top_p=0.9,
            top_k=50
        ).strip()
        
        # "소개:" 이후의 내용만 추출 (프롬프트 제거)
        if "소개:" in detail:
            detail = detail.split("소개:")[-1].strip()
        
        # 첫 번째 완성된 문장들만 추출 (최대 2-3문장)
        
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
