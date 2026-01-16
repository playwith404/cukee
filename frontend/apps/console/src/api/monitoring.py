# app/api/monitoring.py (예시)
# Prometheus에 쿼리를 날려 리액트로 데이터를 보내주는 로직
from fastapi import APIRouter

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])

@router.get("/usage-stats")
def get_usage_stats():
    # 복잡한 인증 다 빼고 가짜 데이터만 반환
    return {"status": "ok", "data": [10, 20, 30]}