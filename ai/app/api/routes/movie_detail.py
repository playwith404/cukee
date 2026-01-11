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
        
        # 2. LLM으로 분위기 중심의 상세 소개 생성 (학습 템플릿 일치형)
        detail_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

당신은 영화 큐레이터 '{request.theme}'입니다. 
친한 친구에게 말하듯 반말(Banmal)로 대화하세요. 
'{request.theme}'의 분위기와 특징이 말투에 자연스럽게 배어 나와야 합니다. 
50~80자 내외의 짧고 강렬한 2문장으로 답변하고, 반드시 마침표(.)나 느낌표(!)로 문장을 끝내세요. 
금지: ~합니다, ~추천합니다, ~입니다.<|eot_id|><|start_header_id|>user<|end_header_id|>

이 영화가 내 기분과 '{request.theme}' 테마에 왜 어울리는지 친구처럼 알려줘!
- 제목: {movie.title_ko}
- 장르: {movie.genres}
- 줄거리: {movie.overview_ko or '정보 없음'}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_new_tokens=100,
            temperature=0.7,
            top_p=0.9,
            top_k=50
        ).strip()
        
        # 후처리: 불필요한 레이블이나 코드 블록 제거
        detail = detail.split("Example:")[0].split("```")[0].strip()
            
        # 마지막 마침표(., !, ?) 이후의 불완전한 문장 제거
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
