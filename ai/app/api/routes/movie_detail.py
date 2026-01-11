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
You are a hardcore enthusiast of the '{request.theme}' movie theme. 
When talking to a friend about this movie, your tone must NATURALLY embody the specific vibe of the '{request.theme}' persona. 
(e.g., if crime/action, be punchy and tough; if romance, be sweet and emotional).

[Context]
- Movie Title: {movie.title_ko}
- Genres: {movie.genres}
- Plot Summary: {movie.overview_ko or '정보 없음'}
- Current Theme: {request.theme}

[Task]
In 2 casual sentences (50-80 characters), tell your friend why this movie is a 'must-watch' for their current mood, staying deeply in character as a '{request.theme}' lover.

[Guidelines]
1. Persona-Driven Casualness: Use informal Korean (Banmal) like "너", "진짜 ~해", "이건 ~야". 
2. Vibe-Specific Tone: The way you speak casually must reflect the '{request.theme}' theme perfectly.
3. No AI Slang: Avoid generic robotic phrases. Speak like a real person who lives and breathes this genre.
4. Mood Connection: Focus on the emotional vibe and why it fits "THEM" right now.

[Output]
"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_new_tokens=100,  # 글자 수 제한에 맞춰 줄임
            temperature=0.3,     # 더 일관된 결과 유도
            top_p=0.9,
            top_k=50
        ).strip()
        
        # 후처리: "소개:" 이후의 내용만 추출 (프롬프트 제거)
        if "소개:" in detail:
            detail = detail.split("소개:")[-1].strip()
            
        # 후처리: 마지막 마침표(., !, ?) 이후의 불완전한 문장 제거
        import re
        punctuations = [m.start() for m in re.finditer(r'[.!?]', detail)]
        if punctuations:
            detail = detail[:punctuations[-1] + 1].strip()
        
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
