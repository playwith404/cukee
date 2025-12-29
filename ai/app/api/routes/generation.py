"""AI 전시회 생성 엔드포인트"""
import json
import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.models.model_loader import model_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate", response_model=GenerateResponse)
async def generate_exhibition(request: GenerateRequest):
    """AI 전시회 생성"""
    try:
        if not model_manager.is_ready():
            raise HTTPException(status_code=503, detail="Model not ready")
        
        if request.theme not in model_manager.get_loaded_themes():
            raise HTTPException(status_code=400, detail=f"Theme not found: {request.theme}")
        
        logger.info(f"Generating for theme: {request.theme}")
        
        # 구조화된 프롬프트
        structured_prompt = f"""You are a professional movie curator AI. Respond ONLY in valid JSON format.

User Request: {request.prompt}
Theme: {request.theme}

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
