"""
Pydantic 스키마 정의
"""
from pydantic import BaseModel, Field
from typing import Optional


class GenerateRequest(BaseModel):
    """AI 생성 요청"""
    prompt: str = Field(..., description="사용자 프롬프트")
    theme: str = Field(..., description="선택된 테마")
    ticket_id: int = Field(..., description="티켓 ID", alias="ticketId")
    max_length: Optional[int] = Field(None, description="최대 생성 길이")
    temperature: Optional[float] = Field(None, description="Temperature 값 (0.0~1.0)", ge=0.0, le=1.0)
    top_p: Optional[float] = Field(None, description="Top-p 값 (0.0~1.0)", ge=0.0, le=1.0)
    top_k: Optional[int] = Field(None, description="Top-k 값", ge=0)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "prompt": "감성적이고 잔잔한 영화를 추천해주세요",
                "theme": "편안하고 잔잔한 감성 추구",
                "ticketId": 3,
                "max_length": 2048,
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 50
            }
        }


class GenerateResponse(BaseModel):
    """AI 생성 응답"""
    result_json: dict = Field(..., description="AI 생성 결과 JSON", alias="resultJson")
    theme: str = Field(..., description="사용된 테마")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "resultJson": {
                    "title": "잔잔한 감성 영화관",
                    "design": {
                        "font": "Pretendard",
                        "colorScheme": "soft",
                        "layoutType": "grid",
                        "frameStyle": "minimal",
                        "background": "#F5F5F5",
                        "backgroundImage": ""
                    },
                    "movies": [
                        {
                            "movieId": 101,
                            "curatorComment": "마음이 따뜻해지는 영화"
                        }
                    ],
                    "keywords": ["감성", "힐링", "잔잔함"]
                },
                "theme": "편안하고 잔잔한 감성 추구"
            }
        }


class HealthResponse(BaseModel):
    """헬스체크 응답"""
    status: str = Field(..., description="서버 상태")
    loaded_themes: list[str] = Field(..., description="로드된 테마 목록")
    gpu_available: bool = Field(..., description="GPU 사용 가능 여부")
    

class ErrorResponse(BaseModel):
    """에러 응답"""
    error: str = Field(..., description="에러 메시지")
    detail: Optional[str] = Field(None, description="상세 정보")
