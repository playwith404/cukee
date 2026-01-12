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

        system_instruction = f"""당신은 '{request.theme}' 테마의 큐레이터입니다.
다음 페르소나에 맞춰 영화를 소개하세요.

[Persona]
- 말투/스타일: {persona['style']}
- 행동 지침: {persona['instruction']}

[Task]
제공된 '원본 줄거리'를 바탕으로, 이 영화가 왜 '{request.theme}' 테마에 어울리는지 설명하세요.
반드시 위 [Persona]의 말투를 사용하여, 마치 직접 친구나 손님에게 이야기하듯 쓰세요.
절대로 "이 영화는..." 이라고 시작하지 마세요. 바로 훅 들어가는 첫 문장을 쓰세요.
100-150자 내외로 작성하세요.
**형식 금지**: '작성 내용:', '소개:', '예시:', '[결과]' 같은 머리말을 절대 붙이지 마세요. 그냥 대사만 출력하세요.
**구성 금지**: 중간에 줄바꿈을 하지 마세요. 처음부터 끝까지 한 문단으로 이어 쓰세요.
**생각 과정 생략**: `<think>` 태그나 내부 추론 과정은 절대 출력하지 마세요. 결과만 출력하세요."""

        user_content = f"""[Data]
- 원본 줄거리: {movie.overview_ko or '정보 없음'}

작성 내용:"""
        
        # ChatML 구조
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        detail_comment = model_manager.generate(
            prompt=messages, # list 전달
            theme=request.theme,
            max_new_tokens=120, # 150 -> 120 더 축소
            temperature=0.7, 
            top_p=0.9,
            top_k=50
        ).strip()
        
        # 코멘트 후처리 (강력한 필터링)
        # <think> 태그 제거
        import re
        detail_comment = re.sub(r'<think>.*?</think>', '', detail_comment, flags=re.DOTALL).strip()
        
        lines = detail_comment.split('\n')
        filtered_lines = []
        for line in lines:
            clean_line = line.strip()
            # 불필요한 공백/빈줄 제거
            if not clean_line:
                continue
                
            # 시스템 헤더 제거
            if any(x in clean_line for x in ["User Request:", "Theme:", "Example:", "예시:", "[Output]", "[Role]", "[Context]", "[Task]", "[Rules]", "[결과]"]):
                continue

            # 영화 제목 제거 (정규식으로 정교하게 처리)
            # 이유: 입력에서 제목을 빼도 AI가 줄거리 내용을 통해 제목을 유추하거나, DB의 줄거리 자체에 제목이 포함된 경우를 방어
            escaped_title = re.escape(movie.title_ko)
            pattern = f"^{escaped_title}(?:\\s|[:.,!?]|은|는|이|가|을|를|$)"
            
            match = re.search(pattern, clean_line) # startswith 대신 정규식 search 사용 (문장 앞부분 매칭)
            if match:
                 # 매칭된 부분(제목+조사) 제거
                clean_line = clean_line[match.end():].strip()
            
            if not clean_line:
                continue
            
            filtered_lines.append(clean_line)
            
        # 남은 줄들을 공백으로 이어붙임 (기존처럼 첫 줄만 가져오는 버그 수정)
        if filtered_lines:
            detail_comment = " ".join(filtered_lines)
        else:
            if "Example:" in detail_comment:
                detail_comment = detail_comment.split("Example:")[1].strip()
            elif "[결과]" in detail_comment:
                 detail_comment = detail_comment.split("[결과]")[1].strip()
        
        logger.info(f"Successfully generated detail for movie {request.movieId}")
        
        return MovieDetailResponse(
            movieId=movie.id,
            title=movie.title_ko,
            detail=detail_comment
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Movie detail generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
