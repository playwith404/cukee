"""
전시회 관련 Pydantic 스키마
"""
from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import datetime


class ExhibitionListItem(BaseModel):
    """전시회 목록 아이템 (홈 화면용)"""
    id: int
    ticketId: int
    title: str
    curator: str
    curatorMsg: str
    likes: int
    imageUrl: str
    tags: List[str]
    color: str
    width: int
    height: int

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "ticketId": 1,
                "title": "숏폼 러버 MZ",
                "curator": "트렌디 큐레이터 MZ",
                "curatorMsg": "빠르게 즐기는 MZ세대 맞춤 영화",
                "likes": 150,
                "imageUrl": "https://example.com/ticket1.jpg",
                "tags": ["트렌디", "숏폼", "MZ"],
                "color": "#FF6B6B",
                "width": 300,
                "height": 450
            }
        }
    )


class ExhibitionListResponse(BaseModel):
    """전시회 목록 응답"""
    data: List[ExhibitionListItem]
    total: int
    page: int
    limit: int

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "data": [],
                "total": 11,
                "page": 1,
                "limit": 20
            }
        }
    )


class ExhibitionDesign(BaseModel):
    """전시회 디자인"""
    font: str
    colorScheme: str
    layoutType: str
    frameStyle: str
    background: str
    backgroundImage: str

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionMovie(BaseModel):
    """전시회 영화"""
    id: int
    movieId: int
    title: str
    posterUrl: str
    displayOrder: int
    isPinned: bool
    curatorComment: str

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionKeyword(BaseModel):
    """전시회 키워드"""
    keyword: str
    weight: float

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionDetailResponse(BaseModel):
    """전시회 상세 응답"""
    id: int
    userId: int
    title: str
    isPublic: bool
    design: ExhibitionDesign
    movies: List[ExhibitionMovie]
    keywords: List[ExhibitionKeyword]
    createdAt: datetime
    updatedAt: datetime

    model_config = ConfigDict(populate_by_name=True)
