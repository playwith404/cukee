"""
티켓 관련 Pydantic 스키마
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class TicketResponse(BaseModel):
    """티켓 응답 스키마 (프론트엔드 형식에 맞춤)"""
    id: int
    title: str = Field(..., description="티켓 이름 (DB의 name 필드)")
    curatorName: str = Field(..., description="큐레이터 이름")
    tags: List[str] = Field(default_factory=list, description="태그 목록")
    ticketImageUrl: str = Field(..., description="티켓 이미지 URL")
    characterImageUrl: Optional[str] = Field(None, description="캐릭터 이미지 URL")
    width: Optional[int] = Field(None, description="이미지 너비")
    height: Optional[int] = Field(None, description="이미지 높이")
    ticketCode: str = Field(..., description="티켓 코드")
    curatorMessage: Optional[str] = Field(None, description="큐레이터 메시지")
    color: Optional[str] = Field(None, description="테마 색상")
    description: Optional[str] = Field(None, description="설명")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,  # SQLAlchemy 모델에서 변환 가능
        json_schema_extra={
            "example": {
                "id": 1,
                "title": "숏폼 러버 MZ",
                "curatorName": "트렌디 큐레이터 MZ",
                "tags": ["트렌디", "숏폼", "MZ"],
                "ticketImageUrl": "/ticket/ticket1.png",
                "characterImageUrl": "/cara/cara1.png",
                "width": 295,
                "height": 638,
                "ticketCode": "shortform_mz",
                "curatorMessage": "빠르게 즐기는 MZ세대 맞춤 영화",
                "color": "#FF6B6B",
                "description": "숏폼 콘텐츠를 즐기는 MZ세대를 위한 티켓"
            }
        }
    )


class TicketListResponse(BaseModel):
    """티켓 목록 응답"""
    data: List[TicketResponse]
    total: int

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "data": [],
                "total": 11
            }
        }
    )


class TicketDetailResponse(TicketResponse):
    """티켓 상세 응답 (목록과 동일하지만 확장 가능)"""
    pass
