"""
API usage logging and billing helpers.
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime, date
from typing import Optional, Tuple

from sqlalchemy.orm import Session as DBSession

from app.models.api_usage import CukApiUsageDaily, CukApiUsageLog


INPUT_COST_PER_MILLION = 2000.0
CACHED_INPUT_COST_PER_MILLION = 250.0
OUTPUT_COST_PER_MILLION = 15000.0


def estimate_tokens(text: Optional[str]) -> int:
    if not text:
        return 0
    ascii_count = sum(1 for c in text if ord(c) < 128)
    non_ascii_count = len(text) - ascii_count
    # Rough heuristic: ASCII ~ 4 chars/token, non-ASCII ~ 2 chars/token.
    return max(1, int(math.ceil(ascii_count / 4 + non_ascii_count / 2)))


def calculate_cost(
    prompt_tokens: int,
    completion_tokens: int,
    cached_prompt_tokens: int = 0,
) -> float:
    prompt_cost = (prompt_tokens / 1_000_000) * INPUT_COST_PER_MILLION
    cached_cost = (cached_prompt_tokens / 1_000_000) * CACHED_INPUT_COST_PER_MILLION
    completion_cost = (completion_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION
    return float(prompt_cost + cached_cost + completion_cost)


def log_usage(
    db: DBSession,
    api_key_id: int,
    endpoint: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    status_code: int,
    latency_ms: int,
    ip: Optional[str],
    user_agent: Optional[str],
    created_at: Optional[datetime] = None,
) -> Tuple[int, float]:
    timestamp = created_at or datetime.utcnow()
    total_tokens = prompt_tokens + completion_tokens
    cost = calculate_cost(prompt_tokens, completion_tokens)
    request_id = uuid.uuid4().hex

    log = CukApiUsageLog(
        api_key_id=api_key_id,
        request_id=request_id,
        endpoint=endpoint,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        status_code=status_code,
        latency_ms=latency_ms,
        cost=cost,
        ip=ip,
        user_agent=user_agent,
        created_at=timestamp,
    )
    db.add(log)

    day_value: date = timestamp.date()
    daily = (
        db.query(CukApiUsageDaily)
        .filter(
            CukApiUsageDaily.day == day_value,
            CukApiUsageDaily.api_key_id == api_key_id,
            CukApiUsageDaily.model == model,
        )
        .first()
    )
    if daily:
        daily.requests += 1
        if status_code >= 400:
            daily.errors += 1
        daily.prompt_tokens += prompt_tokens
        daily.completion_tokens += completion_tokens
        daily.total_tokens += total_tokens
        daily.cost = float(daily.cost) + cost
    else:
        daily = CukApiUsageDaily(
            day=day_value,
            api_key_id=api_key_id,
            model=model,
            requests=1,
            errors=1 if status_code >= 400 else 0,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=cost,
        )
        db.add(daily)

    db.commit()
    return total_tokens, cost
