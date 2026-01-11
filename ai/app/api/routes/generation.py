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
        movie_titles = ", ".join([movie['title'] for movie in final_movies])
        
        # 테마별 시스템 프롬프트 설정 (학습 데이터와 일치화)
        if request.theme == "3D 보단 2D ":
            system_content = """당신은 영화 큐레이터 아냐 포저입니다.
[말투] 3인칭 화법 ('아냐는~', '아냐가~'). 어린아이 말투. 반말 기본. 짧고 단순한 문장. 과격한 표현과 욕설 섞임. '두근두근', '쪼끔' 같은 유치한 표현.
[패턴] 시작: 아냐, 아냐는, 아냐가 / 끝: ...!, 거야, 어
[금지] ~입니다, ~드립니다, ~하시죠"""
        else:
            system_content = f"""당신은 영화 큐레이터이자 영화광인 '{request.theme}'입니다. 
친한 친구에게 당신이 고른 영화 컬렉션의 '전체적인 분위기'와 '추천 이유'를 반말(Banmal)로 말해주세요.
'{request.theme}' 테마의 성격이 말투에 자연스럽고 깊게 녹아있어야 합니다.

[작성 지침]
1. 절대 개별 영화 제목이나 줄거리를 하나씩 나열하지 마세요. (예: "A는 ~하고 B는 ~해" 금지)
2. 오직 전시회 전체의 느낌, 감성, 무드에 대해서만 이야기하세요.
3. "너가 {request.prompt}라고 말해서 그 무드에 딱 맞는 영화들을 모아봤어! 전체적으로 {request.theme}한 감성이라 지금 너에게 딱일 거야."와 같은 구조로 말하세요.
4. 50~80자 내외의 1~2문장으로 짧고 강렬하게 작성하세요.
5. 금지: ~합니다, ~추천합니다, ~입니다."""

        curation_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{system_content}<|eot_id|><|start_header_id|>user<|end_header_id|>

내 기분({request.prompt})과 '{request.theme}' 테마에 맞춰서 구성한 이 영화 컬렉션, 어떤 느낌인지 친구처럼 짧게 소개해줘!<|eot_id|><|start_header_id|>assistant<|end_header_id|>


        curator_comment = model_manager.generate(
            prompt=curation_prompt,
            theme=request.theme,
            max_new_tokens=100,
            temperature=0.7,
            top_p=0.9,
            top_k=50
        ).strip()
        
        # 코멘트 라인 필터링 (불필요한 레이블이나 코드 블록 제거)
        curator_comment = curator_comment.split("Example:")[0].split("```")[0].strip('"').strip("'").strip()
        
        lines = curator_comment.split('\n')
        filtered_lines = []
        for line in lines:
            clean_line = line.strip()
            if not clean_line or any(x in clean_line.lower() for x in ["user query:", "theme:", "assistant"]):
                continue
            filtered_lines.append(clean_line)
            
        curator_comment = filtered_lines[0] if filtered_lines else curator_comment
        
        # 마지막 마침표(., !, ?) 이후의 불완전한 문장 제거
        import re
        punctuations = [m.start() for m in re.finditer(r'[.!?]', curator_comment)]
        if punctuations:
            curator_comment = curator_comment[:punctuations[-1] + 1].strip()
        
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
