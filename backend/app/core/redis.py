"""
Redis 연결 관리
"""
import redis
from app.core.config import settings

# Redis 클라이언트 인스턴스
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis() -> redis.Redis:
    """Redis 클라이언트 반환"""
    return redis_client
