"""
Animalese Sound Service
동물의 숲 스타일 음성 합성 서비스 (PyAnimalese 기반)
"""
import random
import io
import base64
from pathlib import Path
from typing import Optional
from pydub import AudioSegment

# jamo 라이브러리가 없을 경우를 대비한 fallback
try:
    from jamo import h2j, j2hcj
    JAMO_AVAILABLE = True
except ImportError:
    JAMO_AVAILABLE = False

# 지원하는 한글 초성 리스트
CHAR_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', ' ']

# 음성 파일 경로
SOURCES_DIR = Path(__file__).parent.parent.parent / "animalese_sources"


class AnimaleseService:
    """동물의 숲 스타일 음성 합성 서비스"""

    def __init__(self):
        self.char_sounds: dict[str, AudioSegment] = {}
        self.char_sounds_high: dict[str, AudioSegment] = {}
        self._loaded = False

    def _load_sounds(self) -> bool:
        """음성 파일 로드"""
        if self._loaded:
            return True

        if not SOURCES_DIR.exists():
            print(f"Warning: Animalese sources directory not found: {SOURCES_DIR}")
            return False

        try:
            for idx, char in enumerate(CHAR_LIST):
                str_idx = str(idx + 1).zfill(2)
                normal_path = SOURCES_DIR / f"{str_idx}.mp3"
                high_path = SOURCES_DIR / "high" / f"{str_idx}.mp3"

                if normal_path.exists():
                    self.char_sounds[char] = AudioSegment.from_mp3(str(normal_path))
                if high_path.exists():
                    self.char_sounds_high[char] = AudioSegment.from_mp3(str(high_path))

            self._loaded = len(self.char_sounds) > 0
            return self._loaded
        except Exception as e:
            print(f"Error loading animalese sounds: {e}")
            return False

    def _get_initial_consonant(self, char: str) -> Optional[str]:
        """한글 문자에서 초성 추출"""
        if not JAMO_AVAILABLE:
            return None

        if char == ' ':
            return ' '

        try:
            jamo = j2hcj(h2j(char))
            if jamo and jamo[0] in CHAR_LIST:
                return jamo[0]
        except:
            pass
        return None

    def generate_char_sound(self, char: str, high_pitch: bool = False) -> Optional[str]:
        """
        단일 문자에 대한 Animalese 사운드 생성

        Args:
            char: 변환할 문자
            high_pitch: 고음 버전 사용 여부

        Returns:
            Base64 인코딩된 오디오 데이터 (MP3)
        """
        if not self._load_sounds():
            return None

        initial = self._get_initial_consonant(char)
        if not initial:
            return None

        sounds = self.char_sounds_high if high_pitch else self.char_sounds
        if initial not in sounds:
            return None

        char_sound = sounds[initial]

        # 랜덤 피치 변조 (동물의 숲 스타일)
        octaves = 2 * random.uniform(0.96, 1.15)
        new_sample_rate = int(char_sound.frame_rate * (2.0 ** octaves))

        pitched_sound = char_sound._spawn(
            char_sound.raw_data,
            overrides={'frame_rate': new_sample_rate}
        )

        # Base64로 인코딩하여 반환
        buffer = io.BytesIO()
        pitched_sound.export(buffer, format="mp3")
        buffer.seek(0)

        return base64.b64encode(buffer.read()).decode('utf-8')

    def generate_text_sound(self, text: str, high_pitch: bool = False) -> Optional[str]:
        """
        전체 텍스트에 대한 Animalese 사운드 생성

        Args:
            text: 변환할 텍스트
            high_pitch: 고음 버전 사용 여부

        Returns:
            Base64 인코딩된 오디오 데이터 (MP3)
        """
        if not self._load_sounds():
            return None

        result_sound = None
        sounds = self.char_sounds_high if high_pitch else self.char_sounds

        for char in text:
            initial = self._get_initial_consonant(char)
            if not initial or initial not in sounds:
                continue

            char_sound = sounds[initial]

            # 랜덤 피치 변조
            octaves = 2 * random.uniform(0.96, 1.15)
            new_sample_rate = int(char_sound.frame_rate * (2.0 ** octaves))

            pitched_sound = char_sound._spawn(
                char_sound.raw_data,
                overrides={'frame_rate': new_sample_rate}
            )

            if result_sound is None:
                result_sound = pitched_sound
            else:
                result_sound = result_sound + pitched_sound

        if result_sound is None:
            return None

        # Base64로 인코딩하여 반환
        buffer = io.BytesIO()
        result_sound.export(buffer, format="mp3")
        buffer.seek(0)

        return base64.b64encode(buffer.read()).decode('utf-8')

    def generate_char_sounds_batch(self, text: str, high_pitch: bool = False) -> list[Optional[str]]:
        """
        텍스트의 각 문자에 대한 Animalese 사운드를 배치로 생성

        Args:
            text: 변환할 텍스트
            high_pitch: 고음 버전 사용 여부

        Returns:
            각 문자에 대한 Base64 인코딩된 오디오 데이터 리스트
        """
        if not self._load_sounds():
            return [None] * len(text)

        result = []
        sounds = self.char_sounds_high if high_pitch else self.char_sounds

        for char in text:
            initial = self._get_initial_consonant(char)

            if not initial or initial not in sounds:
                result.append(None)
                continue

            char_sound = sounds[initial]

            # 랜덤 피치 변조
            octaves = 2 * random.uniform(0.96, 1.15)
            new_sample_rate = int(char_sound.frame_rate * (2.0 ** octaves))

            pitched_sound = char_sound._spawn(
                char_sound.raw_data,
                overrides={'frame_rate': new_sample_rate}
            )

            # Base64로 인코딩
            buffer = io.BytesIO()
            pitched_sound.export(buffer, format="mp3")
            buffer.seek(0)

            result.append(base64.b64encode(buffer.read()).decode('utf-8'))

        return result


# 싱글톤 인스턴스
animalese_service = AnimaleseService()
