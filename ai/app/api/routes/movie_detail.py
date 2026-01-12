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
        
        # 2. LLM으로 상세 소개 생성 (테마별 말투 변환)
        from app.core.prompts import get_persona
        persona = get_persona(request.theme)

        detail_prompt = f"""[Role]
당신은 '{request.theme}' 테마의 큐레이터입니다.
다음 페르소나에 맞춰 영화를 소개하세요.

[Persona]
- 말투/스타일: {persona['style']}
- 행동 지침: {persona['instruction']}

[Data]
- 영화 제목: {movie.title_ko}
- 원본 줄거리: {movie.overview_ko or '정보 없음'}

[Task]
위 '원본 줄거리'를 바탕으로, 이 영화가 왜 '{request.theme}' 테마에 어울리는지 설명하세요.
반드시 위 [Persona]의 말투를 사용하여, 마치 직접 친구나 손님에게 이야기하듯 쓰세요.
절대로 "이 영화는..." 이라고 시작하지 마세요. 바로 훅 들어가는 첫 문장을 쓰세요.
100-150자 내외로 작성하세요.

작성 내용:"""
        
        detail = model_manager.generate(
            prompt=detail_prompt,
            theme=request.theme,
            max_new_tokens=200,  # 충분한 길이 확보
            temperature=0.7,  # 창의적인 표현 허용 (기존 0.3 -> 0.7)
            top_p=0.9,
            top_k=50
        ).strip()
        
        
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
