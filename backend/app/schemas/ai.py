"""
AI 관련 Pydantic 스키마
"""
from pydantic import BaseModel, ConfigDict
from typing import List


class ExhibitionDesign(BaseModel):
    """전시회 디자인"""
    font: str
    colorScheme: str
    layoutType: str
    frameStyle: str
    background: str
    backgroundImage: str

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "font": "Pretendard",
                "colorScheme": "dark",
                "layoutType": "grid",
                "frameStyle": "modern",
                "background": "#000000",
                "backgroundImage": "https://example.com/bg.jpg"
            }
        }
    )


class RecommendedMovie(BaseModel):
    """추천 영화"""
    movieId: int
    curatorComment: str

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "movieId": 101,
                "curatorComment": "감동적인 스토리와 뛰어난 연기가 돋보이는 작품입니다."
            }
        }
    )


class AIGenerateRequest(BaseModel):
    """AI 전시회 생성 요청"""
    prompt: str
    ticketId: int
    pinnedMovieIds: List[int] = []

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prompt": "감성적이고 잔잔한 영화를 추천해주세요",
                "ticketId": 3
            }
        }
    )


class AIGenerateResponse(BaseModel):
    """AI 전시회 생성 응답"""
    resultJson: dict

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
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
                }
            }
        }
    )
