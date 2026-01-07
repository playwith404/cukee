"""
Persona Summary 캐싱 서비스
- Redis 캐싱: 영화 포스터 클릭 시 생성된 영화 소개 임시 저장
- DB 저장: 전시회 저장 시 캐시 데이터를 DB로 이관
- 백그라운드 생성: 캐시되지 않은 영화의 소개 생성
"""
import logging
import httpx
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from app.core.redis import get_redis
from app.models.exhibition import ExhibitionMovie

logger = logging.getLogger(__name__)

# Redis 캐시 설정
CACHE_PREFIX = "persona"
CACHE_TTL = 1800  # 30분

# AI 서버 설정
AI_SERVER_URL = "http://10.0.19.117:5000"

# 테마 매핑 (ai.py에서 가져옴)
TICKET_TO_THEME = {
    1: "숏폼 러버 MZ 스타일",
    2: "영화덕후의 최애 마이너영화",
    3: "편안하고 잔잔한 감성 추구",
    4: "찝찝한 여운의 우울한 명작들",
    5: "뇌 빼고도 볼 수 있는 레전드 코미디 ",
    6: "심장 터질 것 같은 액션 범죄 영화",
    7: "세계관 과몰입 판타지러버",
    8: "이거 실화야? 실화야. ",
    9: "여름에 찰떡인 역대급 호러 ",
    10: "설레고 싶은 날의 로맨스 ",
    11: "3D 보단 2D ",
}


def _get_cache_key(session_id: str, movie_id: int, ticket_id: int) -> str:
    """캐시 키 생성"""
    return f"{CACHE_PREFIX}:{session_id}:{movie_id}:{ticket_id}"


def _get_session_pattern(session_id: str) -> str:
    """세션의 모든 캐시 키 패턴"""
    return f"{CACHE_PREFIX}:{session_id}:*"


def get_cached_summary(session_id: str, movie_id: int, ticket_id: int) -> Optional[str]:
    """Redis에서 캐시된 영화 소개 조회"""
    try:
        redis = get_redis()
        key = _get_cache_key(session_id, movie_id, ticket_id)
        cached = redis.get(key)
        if cached:
            logger.info(f"Cache HIT: {key}")
            return cached
        logger.info(f"Cache MISS: {key}")
        return None
    except Exception as e:
        logger.error(f"Redis get error: {e}")
        return None


def cache_summary(session_id: str, movie_id: int, ticket_id: int, summary: str) -> bool:
    """Redis에 영화 소개 캐싱"""
    try:
        redis = get_redis()
        key = _get_cache_key(session_id, movie_id, ticket_id)
        redis.setex(key, CACHE_TTL, summary)
        logger.info(f"Cached: {key} (TTL: {CACHE_TTL}s)")
        return True
    except Exception as e:
        logger.error(f"Redis set error: {e}")
        return False


def clear_session_cache(session_id: str) -> int:
    """세션의 모든 캐시 삭제"""
    try:
        redis = get_redis()
        pattern = _get_session_pattern(session_id)
        keys = redis.keys(pattern)
        if keys:
            deleted = redis.delete(*keys)
            logger.info(f"Cleared {deleted} cache entries for session {session_id}")
            return deleted
        return 0
    except Exception as e:
        logger.error(f"Redis clear error: {e}")
        return 0


def get_all_session_summaries(session_id: str) -> Dict[str, str]:
    """세션의 모든 캐시된 영화 소개 조회
    Returns: {"{movie_id}:{ticket_id}": summary}
    """
    try:
        redis = get_redis()
        pattern = _get_session_pattern(session_id)
        keys = redis.keys(pattern)
        
        if not keys:
            return {}
        
        result = {}
        for key in keys:
            # key format: persona:{session_id}:{movie_id}:{ticket_id}
            parts = key.split(":")
            if len(parts) >= 4:
                movie_id = parts[2]
                ticket_id = parts[3]
                value = redis.get(key)
                if value:
                    result[f"{movie_id}:{ticket_id}"] = value
        
        logger.info(f"Retrieved {len(result)} cached summaries for session {session_id}")
        return result
    except Exception as e:
        logger.error(f"Redis get all error: {e}")
        return {}


def save_summaries_to_db(
    session_id: str,
    exhibition_id: int,
    ticket_id: int,
    db: Session
) -> int:
    """Redis 캐시를 DB로 이관
    Returns: 저장된 영화 수
    """
    try:
        # 전시회의 영화 목록 조회
        exhibition_movies = db.query(ExhibitionMovie).filter(
            ExhibitionMovie.exhibition_id == exhibition_id
        ).all()
        
        if not exhibition_movies:
            logger.warning(f"No movies found for exhibition {exhibition_id}")
            return 0
        
        saved_count = 0
        redis = get_redis()
        
        for em in exhibition_movies:
            # 캐시에서 해당 영화의 소개 조회
            key = _get_cache_key(session_id, em.movie_id, ticket_id)
            cached_summary = redis.get(key)
            
            if cached_summary:
                em.persona_summary = cached_summary
                saved_count += 1
                logger.info(f"Saved persona_summary for movie {em.movie_id}")
        
        if saved_count > 0:
            db.commit()
            logger.info(f"Committed {saved_count} persona summaries to DB")
        
        return saved_count
    except Exception as e:
        logger.error(f"DB save error: {e}")
        db.rollback()
        return 0


async def generate_missing_summaries(
    exhibition_id: int,
    ticket_id: int,
    db: Session
) -> int:
    """캐시되지 않은 영화들의 소개를 생성하여 DB에 저장
    Returns: 생성된 영화 수
    """
    try:
        # persona_summary가 없는 영화 조회
        missing_movies = db.query(ExhibitionMovie).filter(
            ExhibitionMovie.exhibition_id == exhibition_id,
            ExhibitionMovie.persona_summary.is_(None)
        ).all()
        
        if not missing_movies:
            logger.info(f"No missing summaries for exhibition {exhibition_id}")
            return 0
        
        theme = TICKET_TO_THEME.get(ticket_id, "편안하고 잔잔한 감성 추구")
        generated_count = 0
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for em in missing_movies:
                try:
                    response = await client.post(
                        f"{AI_SERVER_URL}/api/v1/movie-detail",
                        json={
                            "movieId": em.movie_id,
                            "theme": theme
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        em.persona_summary = data.get("detail", "")
                        generated_count += 1
                        logger.info(f"Generated summary for movie {em.movie_id}")
                    else:
                        logger.warning(f"AI server error for movie {em.movie_id}: {response.status_code}")
                        
                except Exception as e:
                    logger.error(f"Failed to generate summary for movie {em.movie_id}: {e}")
                    continue
        
        if generated_count > 0:
            db.commit()
            logger.info(f"Generated and saved {generated_count} summaries")
        
        return generated_count
    except Exception as e:
        logger.error(f"Generate missing summaries error: {e}")
        db.rollback()
        return 0
