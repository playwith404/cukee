"""Prometheus 조회 서비스"""
from typing import Any
import httpx

from app.core.config import settings
from app.core.exceptions import InternalServerErrorException


def _get_prometheus_url(path: str) -> str:
    return f"{settings.PROMETHEUS_URL.rstrip('/')}{path}"


async def query_instant(query: str) -> float:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(_get_prometheus_url("/api/v1/query"), params={"query": query})
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
    except Exception as exc:
        raise InternalServerErrorException(
            message="Prometheus 조회 실패",
            details=str(exc)
        )

    if payload.get("status") != "success":
        return 0.0

    result = payload.get("data", {}).get("result", [])
    if not result:
        return 0.0

    value = result[0].get("value")
    if not value or len(value) < 2:
        return 0.0
    try:
        return float(value[1])
    except (TypeError, ValueError):
        return 0.0


async def query_range(query: str, start: float, end: float, step: int) -> list[float]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                _get_prometheus_url("/api/v1/query_range"),
                params={
                    "query": query,
                    "start": start,
                    "end": end,
                    "step": step,
                },
            )
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
    except Exception as exc:
        raise InternalServerErrorException(
            message="Prometheus 조회 실패",
            details=str(exc)
        )

    if payload.get("status") != "success":
        return []

    result = payload.get("data", {}).get("result", [])
    if not result:
        return []

    values = result[0].get("values", [])
    output: list[float] = []
    for entry in values:
        if len(entry) < 2:
            continue
        try:
            output.append(float(entry[1]))
        except (TypeError, ValueError):
            output.append(0.0)
    return output


async def query_vector(query: str) -> list[dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(_get_prometheus_url("/api/v1/query"), params={"query": query})
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
    except Exception as exc:
        raise InternalServerErrorException(
            message="Prometheus 조회 실패",
            details=str(exc)
        )

    if payload.get("status") != "success":
        return []

    result = payload.get("data", {}).get("result", [])
    output: list[dict[str, Any]] = []
    for row in result:
        metric = row.get("metric", {})
        value = row.get("value", [None, "0"])
        try:
            numeric = float(value[1])
        except (TypeError, ValueError):
            numeric = 0.0
        output.append({"metric": metric, "value": numeric})
    return output
