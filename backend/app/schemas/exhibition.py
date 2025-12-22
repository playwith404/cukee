"""
전시회 관련 Pydantic 스키마
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
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


# ===== CRUD 스키마 =====

class ExhibitionDesignCreate(BaseModel):
    """전시회 디자인 생성 스키마"""
    font: Optional[str] = Field(None, max_length=50)
    colorScheme: Optional[str] = Field(None, max_length=50, alias="color_scheme")
    layoutType: Optional[str] = Field(None, max_length=50, alias="layout_type")
    frameStyle: Optional[str] = Field(None, max_length=20, alias="frame_style")
    background: Optional[str] = Field(None, max_length=100)
    backgroundImage: Optional[str] = Field(None, alias="background_image")

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionMovieCreate(BaseModel):
    """전시회 영화 생성 스키마"""
    movieId: int = Field(..., alias="movie_id")
    displayOrder: int = Field(0, alias="display_order")
    curatorComment: Optional[str] = Field(None, alias="curator_comment")
    isPinned: bool = Field(False, alias="is_pinned")

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionKeywordCreate(BaseModel):
    """전시회 키워드 생성 스키마"""
    keyword: str = Field(..., max_length=100)
    weight: float = Field(1.0)

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionCreate(BaseModel):
    """전시회 생성 요청"""
    title: str = Field(..., max_length=200, description="전시회 제목")
    isPublic: bool = Field(True, description="공개 여부")
    design: Optional[ExhibitionDesignCreate] = Field(None, description="디자인 설정")
    movies: Optional[List[ExhibitionMovieCreate]] = Field(default_factory=list, description="영화 목록")
    keywords: Optional[List[ExhibitionKeywordCreate]] = Field(default_factory=list, description="키워드 목록")

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "title": "나만의 영화 전시회",
                "isPublic": True,
                "design": {
                    "font": "Pretendard",
                    "colorScheme": "dark",
                    "layoutType": "grid",
                    "frameStyle": "modern",
                    "background": "#1a1a1a"
                },
                "movies": [],
                "keywords": [
                    {"keyword": "감성", "weight": 0.9},
                    {"keyword": "힐링", "weight": 0.8}
                ]
            }
        }
    )


class ExhibitionUpdate(BaseModel):
    """전시회 수정 요청"""
    title: Optional[str] = Field(None, max_length=200)
    isPublic: Optional[bool] = None
    design: Optional[ExhibitionDesignCreate] = None
    movies: Optional[List[ExhibitionMovieCreate]] = None
    keywords: Optional[List[ExhibitionKeywordCreate]] = None

    model_config = ConfigDict(populate_by_name=True)


class ExhibitionResponse(BaseModel):
    """전시회 기본 응답"""
    id: int
    userId: int
    title: str
    isPublic: bool
    createdAt: datetime
    updatedAt: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
