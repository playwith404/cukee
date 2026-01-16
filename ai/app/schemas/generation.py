"""Generation 관련 스키마"""
from pydantic import BaseModel, Field
from typing import Optional, List

class GenerateRequest(BaseModel):
    """AI 전시회 생성 요청"""
    prompt: str = Field(..., description="사용자 프롬프트")
    theme: str = Field(..., description="테마")
    ticketId: int = Field(..., description="Ticket ID for filtering movies")
    pinnedMovieIds: List[int] = Field(default=[], description="고정된 영화 ID 목록")
    isAdultAllowed: bool = Field(False, description="19금 영화 허용 여부")
    max_length: Optional[int] = Field(2048, description="최대 생성 길이")
    temperature: Optional[float] = Field(0.7, description="Temperature")
    top_p: Optional[float] = Field(0.9, description="Top-p")
    top_k: Optional[int] = Field(50, description="Top-k")

class GenerateResponse(BaseModel):
    """AI 전시회 생성 응답"""
    result_json: dict = Field(..., description="생성된 JSON 결과")
    theme: str = Field(..., description="사용된 테마")
