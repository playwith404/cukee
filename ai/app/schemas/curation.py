"""Curation 관련 스키마"""
from pydantic import BaseModel, Field

class CuratedMovie(BaseModel):
    """큐레이션된 영화 정보"""
    movieId: int = Field(..., alias="movieId")
    title: str
    posterUrl: str = Field(..., alias="posterUrl")
    class Config:
        populate_by_name = True

class CurateMoviesRequest(BaseModel):
    """티켓별 영화 큐레이션 요청"""
    ticketId: int = Field(..., alias="ticketId")
    limit: int = Field(5, ge=1, le=20)
    adultExclude: bool = Field(False, description="19금 영화 제외 여부")
    class Config:
        populate_by_name = True

class CurateMoviesResponse(BaseModel):
    """티켓별 영화 큐레이션 응답"""
    ticketId: int
    movies: list[CuratedMovie]
    class Config:
        populate_by_name = True
