"""AI 전시회 생성 엔드포인트"""
import json
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.models.model_loader import model_manager
from app.api.dependencies import get_db_session
from app.services.retrieval_service import RetrievalService
from app.core.guardrails_manager import guardrails_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate", response_model=GenerateResponse)
async def generate_exhibition(request: GenerateRequest, db: Session = Depends(get_db_session)):
    """AI 전시회 생성 (PGVECTOR-first + 큐레이션 코멘트)"""
    try:
        # 0. Guardrails 검사 (주제 차단)
        allowed, refusal_message = await guardrails_manager.check_input(request.prompt)
        if not allowed:
            logger.info(f"Guardrails blocked request: {request.prompt}")
            return GenerateResponse(
                result_json={
                    "title": "안내",
                    "curatorComment": refusal_message,
                    "movies": [],
                    "design": {
                        "font": "Pretendard",
                        "colorScheme": "dark",
                        "cukeeStyle": "grid",
                        "frameStyle": "modern",
                        "background": "#1a1a1a",
                        "backgroundImage": ""
                    },
                    "keywords": ["안내"]
                },
                theme=request.theme
            )

        if not model_manager.is_ready():
            raise HTTPException(status_code=503, detail="Model not ready")
        
        if request.theme not in model_manager.get_loaded_themes():
            raise HTTPException(status_code=400, detail=f"Theme not found: {request.theme}")
        
        logger.info(f"Generating for theme: {request.theme}")
        
        # 1. 고정된 영화 처리
        pinned_movies = []
        if request.pinnedMovieIds:
            pinned_movies = await RetrievalService.get_movies_by_ids(db, request.pinnedMovieIds)
            logger.info(f"Loaded {len(pinned_movies)} pinned movies")

        # 2. PGVECTOR로 유사 영화 검색 (빠름, ~1초) - 티켓별 필터링
        # 고정된 개수만큼 limit에서 차감
        limit = max(0, 5 - len(pinned_movies))
        
        retrieved_movies = []
        if limit > 0:
            retrieved_movies = await RetrievalService.retrieve_similar_movies(
                db, request.prompt, request.ticketId, limit=limit, exclude_ids=request.pinnedMovieIds, is_adult_allowed=request.isAdultAllowed
            )
        
        logger.info(f"Retrieved {len(retrieved_movies)} movies from PGVECTOR")
        
        # 합치기: 고정된 영화 + 검색된 영화
        final_movies = pinned_movies + retrieved_movies
        
        if not final_movies:
            logger.warning("No movies found from PGVECTOR search")
            raise HTTPException(status_code=404, detail="No similar movies found")
        
        logger.info(f"Retrieved {len(retrieved_movies)} movies from PGVECTOR")
        
        # 2. 큐레이션 전체에 대한 코멘트 생성 (시스템 프롬프팅으로 페르소나 주입)
        from app.core.prompts import get_persona
        persona = get_persona(request.theme)
        
        # 영화 제목 추출 (환각 방지용)
        movie_titles_str = ", ".join([f"<{m['title']}>" for m in final_movies])
        
        system_instruction = f"""당신은 '{request.theme}' 테마의 영화 큐레이터입니다.
다음 페르소나 지침을 완벽하게 따라 연기하세요.

[Persona]
- 말투/스타일: {persona['style']}
- 행동 지침: {persona['instruction']}

[Instruction]
위 [Persona]의 말투를 200% 살려서, **사용자의 요청에 대해 공감하거나 반응하는** 멘트를 작성하세요.
**지침**:
1. 구체적인 영화 제목을 나열하지 마세요. (예: "<영화이름> 추천해요" X)
2. 대신 "이런 따뜻한 영화들을 모아봤어요", "완전 취향 저격일 거예요" 처럼 묶어서 추천하세요.
3. 상투적인 인사말("안녕하세요")은 생략하고, 바로 본론이나 감탄사로 시작하세요.
4. 한국어로 자연스럽게, 40-60자 내외로 짧고 강렬하게 작성하세요.

따옴표(")는 쓰지 마세요.
**형식 금지**: '멘트:', '답변:', '예시:', '[결과]' 같은 머리말을 절대 붙이지 마세요. 그냥 대사만 출력하세요.
**생각 과정 생략**: `<think>` 태그나 내부 추론 과정은 절대 출력하지 마세요. 결과만 출력하세요."""

        user_content = f"""[Context]
사용자 요청: "{request.prompt}"
추천 영화 목록: {movie_titles_str} (총 {len(final_movies)}편)

멘트:"""

        # ChatML 구조로 메시지 생성
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]
        
        curator_comment = model_manager.generate(
            prompt=messages, # 이제 list를 넘김
            theme=request.theme,
            max_new_tokens=90, # 출력 길이
            top_p=0.9,
            top_k=50
        ).strip()
        
        # 코멘트 후처리 (강력한 필터링)
        # <think> 태그 제거
        import re
        curator_comment = re.sub(r'<think>.*?</think>', '', curator_comment, flags=re.DOTALL).strip()
        
        lines = curator_comment.split('\n')
        filtered_lines = []
        for line in lines:
            clean_line = line.strip()
            # 불필요한 시스템 텍스트/헤더 제거
            if any(x in clean_line for x in ["User Request:", "Theme:", "Example:", "예시:", "[Output]", "[Role]", "[Context]", "[Task]", "[Rules]", "[결과]"]):
                continue
            if not clean_line:
                continue
            filtered_lines.append(clean_line)
            
        # 남은 줄들을 공백으로 이어붙임 (기존처럼 첫 줄만 가져오는 버그 수정)
        if filtered_lines:
            curator_comment = " ".join(filtered_lines)
        else:
            # 예시/Example 라벨 제거 시도 (백업 로직)
            if "Example:" in curator_comment:
                curator_comment = curator_comment.split("Example:")[1].strip()
            elif "예시:" in curator_comment:
                curator_comment = curator_comment.split("예시:")[1].strip()
            elif "[결과]" in curator_comment:
                 curator_comment = curator_comment.split("[결과]")[1].strip()
        
        curator_comment = curator_comment.strip('"').strip("'")
        
        logger.info(f"Generated curation comment: {curator_comment}")
        
        # 3. 영화 목록 구성 (PGVECTOR 결과 사용, 개별 코멘트 없음)
        movies_list = []
        for movie in final_movies:
            movies_list.append({
                "movieId": movie['id'],
                "posterUrl": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie['poster_path'] else ""
            })
        
        # 4. 응답 구성
        result_json = {
            "title": f"{request.theme} 큐레이션",
            "curatorComment": curator_comment,  # 전체 큐레이션에 대한 코멘트
            "movies": movies_list,
            "design": {
                "font": "Pretendard",
                "colorScheme": "dark",
                "cukeeStyle": "grid",
                "frameStyle": "modern",
                "background": "#1a1a1a",
                "backgroundImage": ""
            },
            "keywords": [request.theme, request.prompt[:20]]
        }
        
        logger.info(f"Successfully generated curation with {len(movies_list)} movies")
        return GenerateResponse(result_json=result_json, theme=request.theme)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
