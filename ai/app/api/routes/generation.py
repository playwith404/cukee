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
                db, request.prompt, request.ticketId, limit=limit, exclude_ids=request.pinnedMovieIds, adult_exclude=request.adultExclude
            )
        
        logger.info(f"Retrieved {len(retrieved_movies)} movies from PGVECTOR")
        
        # 합치기: 고정된 영화 + 검색된 영화
        final_movies = pinned_movies + retrieved_movies
        
        if not final_movies:
            logger.warning("No movies found from PGVECTOR search")
            raise HTTPException(status_code=404, detail="No similar movies found")
        
        logger.info(f"Retrieved {len(retrieved_movies)} movies from PGVECTOR")
        
        # 2. 큐레이션 전체에 대한 소개 생성 (추천된 영화 리스트 활용)
        movie_titles = ", ".join([movie['title_ko'] for movie in final_movies])
        
        curation_prompt = f"""[Role]
You are a professional movie curator with a distinct personality matching the '{request.theme}' theme.

[Context]
- User Query: {request.prompt}
- Theme: {request.theme} (Adopt the tone and persona suited for this theme)
- Recommended Movies: {movie_titles}

[Task]
Write a warm and engaging introduction for this movie curation in Korean. 
The introduction should explain why these movies ({movie_titles}) were selected based on the user's query and theme.

[Rules]
1. Length: 50-100 characters.
2. Format: Must consist of COMPLETE sentences ending with proper punctuation (e.g., '.', '!', '?').
3. Persona: Use a tone and vocabulary that perfectly matches the '{request.theme}' persona.
4. Language: Korean only.
5. NO meta-talk like "Here is your introduction:".

[Output]
"""
        
        curator_comment = model_manager.generate(
            prompt=curation_prompt,
            theme=request.theme,
            max_length=180,  
            temperature=0.3,
            top_p=0.9,
            top_k=50
        ).strip()
        
        # 코멘트 후처리 (강력한 필터링)
        lines = curator_comment.split('\n')
        filtered_lines = []
        for line in lines:
            clean_line = line.strip()
            # 불필요한 시스템 텍스트가 포함된 줄 제거
            if any(x in clean_line for x in ["User Request:", "Theme:", "Example:", "[Output]", "[Role]", "[Context]", "[Task]", "[Rules]"]):
                continue
            if not clean_line:
                continue
            filtered_lines.append(clean_line)
            
        # 남은 줄이 있다면 첫 번째 줄 사용, 없으면 원본(정제 시도) 사용
        if filtered_lines:
            curator_comment = filtered_lines[0]
        else:
            if "Example:" in curator_comment:
                curator_comment = curator_comment.split("Example:")[0].strip()
        
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
