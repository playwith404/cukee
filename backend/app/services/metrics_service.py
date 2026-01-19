"""Prometheus 메트릭 수집 서비스"""
import time
from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.database import SessionLocal
from app.services.console_service import ConsoleTokenService

API_REQUESTS = Counter(
    "cukee_api_requests_total",
    "API 요청 수",
    ["token_id", "endpoint", "method", "status"],
)

API_LATENCY = Histogram(
    "cukee_api_request_latency_ms",
    "API 요청 지연(ms)",
    ["token_id", "endpoint", "method"],
    buckets=(10, 25, 50, 100, 200, 300, 500, 800, 1200, 2000, 5000),
)

API_COST = Counter(
    "cukee_api_cost_total",
    "API 누적 비용",
    ["token_id", "model"],
)


def _get_endpoint(request: Request) -> str:
    route = request.scope.get("route")
    if route and hasattr(route, "path"):
        return route.path
    return request.url.path


def _extract_api_key(request: Request) -> str | None:
    api_key = request.headers.get("x-api-key")
    if api_key:
        return api_key.strip()

    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


class ApiMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        token_id = None

        api_key = _extract_api_key(request)
        if api_key:
            db = SessionLocal()
            try:
                token_record = ConsoleTokenService.get_by_api_key(db, api_key)
                if token_record:
                    token_id = str(token_record.id)
                    ConsoleTokenService.mark_used(db, token_record.id)
                else:
                    token_id = "invalid"
            finally:
                db.close()

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception:
            status_code = 500
            if token_id is not None:
                duration_ms = (time.monotonic() - start) * 1000
                endpoint = _get_endpoint(request)
                API_REQUESTS.labels(
                    token_id=token_id,
                    endpoint=endpoint,
                    method=request.method,
                    status=str(status_code),
                ).inc()
                API_LATENCY.labels(
                    token_id=token_id,
                    endpoint=endpoint,
                    method=request.method,
                ).observe(duration_ms)
            raise
        else:
            if token_id is not None:
                duration_ms = (time.monotonic() - start) * 1000
                endpoint = _get_endpoint(request)
                API_REQUESTS.labels(
                    token_id=token_id,
                    endpoint=endpoint,
                    method=request.method,
                    status=str(status_code),
                ).inc()
                API_LATENCY.labels(
                    token_id=token_id,
                    endpoint=endpoint,
                    method=request.method,
                ).observe(duration_ms)

                api_cost = getattr(request.state, "api_cost", None)
                api_model = getattr(request.state, "api_model", None)
                if api_cost is not None and api_model:
                    API_COST.labels(token_id=token_id, model=api_model).inc(api_cost)
            return response
