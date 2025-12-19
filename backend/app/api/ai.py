"""
AI 관련 API 엔드포인트 (Mock)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.schemas.ai import AIGenerateRequest, AIGenerateResponse
from app.utils.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


@router.post("/generate", response_model=AIGenerateResponse, status_code=status.HTTP_200_OK)
def generate_exhibition(
    request_data: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    AI 전시회 생성 (Mock)
    - HttpOnly Cookie 필요
    - 실제 AI 모델 연동 전까지 Mock 데이터 반환
    """
    if not request_data.prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="프롬프트를 입력해주세요."
        )

    # Mock 응답 데이터
    mock_response = {
        "resultJson": {
            "title": f"{request_data.prompt[:20]}... 큐레이션",
            "design": {
                "font": "Pretendard",
                "colorScheme": "dark",
                "layoutType": "grid",
                "frameStyle": "modern",
                "background": "#1a1a1a",
                "backgroundImage": "https://images.unsplash.com/photo-1478720568477-152d9b164e26"
            },
            "movies": [
                {
                    "movieId": 101,
                    "curatorComment": "당신의 취향에 딱 맞는 영화입니다."
                },
                {
                    "movieId": 102,
                    "curatorComment": "감동적인 스토리가 인상적입니다."
                },
                {
                    "movieId": 103,
                    "curatorComment": "시각적으로 아름다운 작품입니다."
                }
            ],
            "keywords": ["감성", "힐링", "추천"]
        }
    }

    return AIGenerateResponse(**mock_response)
