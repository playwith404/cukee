"""AI 전시회 생성 엔드포인트"""
import json
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.models.model_loader import model_manager
from app.api.dependencies import get_db_session
from app.services.retrieval_service import RetrievalService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate", response_model=GenerateResponse)
async def generate_exhibition(request: GenerateRequest, db: Session = Depends(get_db_session)):
    """AI 전시회 생성 (PGVECTOR-first + 큐레이션 코멘트)"""
    try:
        if not model_manager.is_ready():
            raise HTTPException(status_code=503, detail="Model not ready")
        
        if request.theme not in model_manager.get_loaded_themes():
            raise HTTPException(status_code=400, detail=f"Theme not found: {request.theme}")
        
        logger.info(f"Generating for theme: {request.theme}")
        
        # 1. PGVECTOR로 유사 영화 검색 (빠름, ~1초)
        retrieved_movies = await RetrievalService.retrieve_similar_movies(
            db, request.prompt, limit=10
        )
        
        if not retrieved_movies:
            logger.warning("No movies found from PGVECTOR search")
            raise HTTPException(status_code=404, detail="No similar movies found")
        
        logger.info(f"Retrieved {len(retrieved_movies)} movies from PGVECTOR")
        
        # 2. 큐레이션 전체에 대한 코멘트 생성 (사용자 프롬프트에 맞게 추천했다는 메시지)
        curation_prompt = f"""Write a SHORT friendly curator message in Korean (50-100 characters).

User Request: {request.prompt}
Theme: {request.theme}
Number of movies recommended: {len(retrieved_movies)}

Write a message like: "잔잔한 영화를 원하셨군요! 마음을 편안하게 해줄 영화들을 추천해봤어요." 
Write ONLY the curator message in Korean, friendly tone, 50-100 characters:"""
        
        curator_comment = model_manager.generate(
            prompt=curation_prompt,
            theme=request.theme,
            max_length=128,  # 짧은 큐레이션 메시지
            temperature=0.7,
            top_p=0.9,
            top_k=50
        ).strip()
        
        logger.info(f"Generated curation comment: {curator_comment}")
        
        # 3. 영화 목록 구성 (PGVECTOR 결과 사용, 개별 코멘트 없음)
        movies_list = []
        for movie in retrieved_movies:
            movies_list.append({
                "movieId": movie['id'],
                "posterUrl": movie['poster_path'] or ""
            })
        
        # 4. 응답 구성
        result_json = {
            "title": f"{request.theme} 큐레이션",
            "curatorComment": curator_comment,  # 전체 큐레이션에 대한 코멘트
            "movies": movies_list,
            "design": {
                "font": "Pretendard",
                "colorScheme": "dark",
                "layoutType": "grid",
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
