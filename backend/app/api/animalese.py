"""
Animalese API Router
동물의 숲 스타일 음성 합성 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.services.animalese_service import animalese_service

router = APIRouter(prefix="/api/animalese", tags=["animalese"])


class CharSoundRequest(BaseModel):
    """단일 문자 사운드 요청"""
    char: str = Field(..., min_length=1, max_length=1, description="변환할 문자")
    high_pitch: bool = Field(False, description="고음 버전 사용 여부")


class TextSoundRequest(BaseModel):
    """텍스트 사운드 요청"""
    text: str = Field(..., min_length=1, max_length=500, description="변환할 텍스트")
    high_pitch: bool = Field(False, description="고음 버전 사용 여부")


class CharSoundResponse(BaseModel):
    """단일 문자 사운드 응답"""
    char: str
    audio: Optional[str] = Field(None, description="Base64 인코딩된 MP3 오디오")


class TextSoundResponse(BaseModel):
    """텍스트 사운드 응답"""
    text: str
    audio: Optional[str] = Field(None, description="Base64 인코딩된 MP3 오디오")


class BatchSoundResponse(BaseModel):
    """배치 사운드 응답"""
    text: str
    sounds: list[Optional[str]] = Field(description="각 문자별 Base64 인코딩된 MP3 오디오 리스트")


@router.post("/char", response_model=CharSoundResponse)
async def generate_char_sound(request: CharSoundRequest):
    """
    단일 문자에 대한 Animalese 사운드 생성

    타이핑 애니메이션 중 각 글자마다 실시간으로 호출
    """
    audio = animalese_service.generate_char_sound(
        char=request.char,
        high_pitch=request.high_pitch
    )

    return CharSoundResponse(
        char=request.char,
        audio=audio
    )


@router.post("/text", response_model=TextSoundResponse)
async def generate_text_sound(request: TextSoundRequest):
    """
    전체 텍스트에 대한 Animalese 사운드 생성

    텍스트 전체를 하나의 오디오로 합성
    """
    audio = animalese_service.generate_text_sound(
        text=request.text,
        high_pitch=request.high_pitch
    )

    return TextSoundResponse(
        text=request.text,
        audio=audio
    )


@router.post("/batch", response_model=BatchSoundResponse)
async def generate_batch_sounds(request: TextSoundRequest):
    """
    텍스트의 각 문자에 대한 Animalese 사운드를 배치로 생성

    타이핑 애니메이션 시작 전 모든 사운드를 미리 로드할 때 사용
    (네트워크 요청 최소화)
    """
    sounds = animalese_service.generate_char_sounds_batch(
        text=request.text,
        high_pitch=request.high_pitch
    )

    return BatchSoundResponse(
        text=request.text,
        sounds=sounds
    )


@router.get("/health")
async def health_check():
    """Animalese 서비스 상태 확인"""
    return {
        "status": "ok",
        "service": "animalese",
        "jamo_available": animalese_service._load_sounds()
    }
