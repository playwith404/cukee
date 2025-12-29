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
    """AI 전시회 생성 (RAG 적용)"""
    try:
        if not model_manager.is_ready():
            raise HTTPException(status_code=503, detail="Model not ready")
        
        if request.theme not in model_manager.get_loaded_themes():
            raise HTTPException(status_code=400, detail=f"Theme not found: {request.theme}")
        
        logger.info(f"Generating for theme: {request.theme}")
        
        # 1. RAG: 유사 영화 검색
        retrieved_movies = await RetrievalService.retrieve_similar_movies(db, request.prompt, limit=5)
        
        # 검색된 영화 정보를 컨텍스트로 구성
        movie_context = ""
        if retrieved_movies:
            movie_context = "Refer to these similar movies from our database:\n"
            for m in retrieved_movies:
                movie_context += f"- Title: {m['title']}\n  Overview: {m['overview'][:100]}...\n"
            logger.info(f"Added {len(retrieved_movies)} movies to context")

        # 2. 구조화된 프롬프트 (RAG 컨텍스트 추가)
        structured_prompt = f"""You are a professional movie curator AI. Respond ONLY in valid JSON format.

User Request: {request.prompt}
Theme: {request.theme}

{movie_context}

Respond with ONLY this JSON format:
{{
  "title": "전시회 제목 (한글)",
  "movies": [{{"movieId": 12345, "curatorComment": "한글 1-2문장", "posterUrl": "/path.jpg"}}],
  "design": {{"font": "Pretendard", "colorScheme": "dark", "layoutType": "grid", "frameStyle": "modern", "background": "#1a1a1a", "backgroundImage": ""}},
  "keywords": ["키워드1", "키워드2"]
}}

Rules: JSON only, no markdown, movieId as number, 5-10 movies, Korean text, posterUrl starts with "/"

JSON response:"""
        
        generated_text = model_manager.generate(
            prompt=structured_prompt,
            theme=request.theme,
            max_length=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k
        )
        
        # JSON 추출
        json_text = generated_text.strip()
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        json_text = json_text.strip()
        
        try:
            result_json = json.loads(json_text)
            logger.info(f"Successfully parsed JSON with {len(result_json.get('movies', []))} movies")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON: {e}")
            result_json = {
                "title": f"{request.theme} 큐레이션",
                "raw_output": generated_text,
                "design": {"font": "Pretendard", "colorScheme": "dark", "layoutType": "grid", "frameStyle": "modern", "background": "#1a1a1a", "backgroundImage": ""},
                "movies": [],
                "keywords": [request.theme]
            }
        
        return GenerateResponse(result_json=result_json, theme=request.theme)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
