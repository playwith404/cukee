"""
Public OpenAI-compatible API (API key auth)
"""
from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Header, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.services.api_key_service import ApiKeyService
from app.services.api_usage_service import estimate_tokens, log_usage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cuk/et", tags=["Public AI"])

EXTERNAL_MODEL_NAME = "Cukee-1.5-it"
AI_SERVER_URL = "http://10.0.19.117:5000"

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


def _openai_error(
    message: str,
    error_type: str = "invalid_request_error",
    param: Optional[str] = None,
    code: Optional[str] = None,
    status_code: int = 400,
) -> JSONResponse:
    payload: dict[str, Any] = {"error": {"message": message, "type": error_type}}
    if param is not None:
        payload["error"]["param"] = param
    if code is not None:
        payload["error"]["code"] = code
    return JSONResponse(status_code=status_code, content=payload)


def _extract_api_key(authorization: Optional[str], x_api_key: Optional[str]) -> Optional[str]:
    if x_api_key:
        return x_api_key.strip()
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def _normalize_content(content: Any) -> Optional[str]:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") != "text":
                continue
            text = item.get("text")
            if isinstance(text, str) and text.strip():
                parts.append(text.strip())
        joined = " ".join(parts).strip()
        return joined if joined else None
    return None


def _extract_prompt(messages: Any) -> Optional[str]:
    if not isinstance(messages, list):
        return None

    user_messages: list[str] = []
    for message in messages:
        if not isinstance(message, dict):
            continue
        if message.get("role") != "user":
            continue
        content = _normalize_content(message.get("content"))
        if content:
            user_messages.append(content)

    if user_messages:
        return user_messages[-1]

    for message in reversed(messages):
        if not isinstance(message, dict):
            continue
        content = _normalize_content(message.get("content"))
        if content:
            return content
    return None


@router.post("/chat/api/enterprise")
async def enterprise_chat(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: DBSession = Depends(get_db),
):
    start_time = time.monotonic()
    endpoint = request.url.path
    api_key_record = None
    prompt = None
    ip = None
    user_agent = request.headers.get("user-agent")
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    elif request.client:
        ip = request.client.host

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    if not isinstance(payload, dict):
        return _openai_error("Invalid request body.")

    api_key = _extract_api_key(authorization, x_api_key)
    if not api_key:
        return _openai_error(
            "API key required.",
            param="authorization",
            code="invalid_api_key",
            status_code=401,
        )

    api_key_record = ApiKeyService.get_by_api_key(db, api_key)
    if not api_key_record:
        return _openai_error(
            "Invalid API key.",
            param="authorization",
            code="invalid_api_key",
            status_code=401,
        )

    if (
        api_key_record.status != "active"
        or api_key_record.revoked_at is not None
        or (api_key_record.expires_at and api_key_record.expires_at <= datetime.utcnow())
    ):
        return _openai_error(
            "API key is not active.",
            param="authorization",
            code="invalid_api_key",
            status_code=401,
        )

    model = payload.get("model") or EXTERNAL_MODEL_NAME
    if model != EXTERNAL_MODEL_NAME:
        response = _openai_error(
            f"Model '{model}' not found.",
            param="model",
            code="model_not_found",
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return response

    if payload.get("stream") is True:
        response = _openai_error(
            "Streaming is not supported.",
            param="stream",
            code="unsupported",
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return response

    prompt = _extract_prompt(payload.get("messages"))
    if not prompt:
        response = _openai_error(
            "messages must include a user prompt.",
            param="messages",
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return response

    ticket_id = payload.get("ticketId", 3)
    try:
        ticket_id = int(ticket_id)
    except (TypeError, ValueError):
        response = _openai_error(
            "ticketId must be an integer.",
            param="ticketId",
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return response

    theme = TICKET_TO_THEME.get(ticket_id)
    if not theme:
        response = _openai_error(
            f"ticketId {ticket_id} is not supported.",
            param="ticketId",
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return response

    pinned_ids = payload.get("pinnedMovieIds") or []
    if not isinstance(pinned_ids, list):
        response = _openai_error(
            "pinnedMovieIds must be an array.",
            param="pinnedMovieIds",
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return response

    is_adult_allowed = bool(payload.get("isAdultAllowed", False))

    ai_request: dict[str, Any] = {
        "prompt": prompt,
        "theme": theme,
        "ticketId": ticket_id,
        "pinnedMovieIds": pinned_ids,
        "isAdultAllowed": is_adult_allowed,
    }

    if payload.get("max_tokens") is not None:
        ai_request["max_length"] = payload.get("max_tokens")
    if payload.get("temperature") is not None:
        ai_request["temperature"] = payload.get("temperature")
    if payload.get("top_p") is not None:
        ai_request["top_p"] = payload.get("top_p")
    if payload.get("top_k") is not None:
        ai_request["top_k"] = payload.get("top_k")

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{AI_SERVER_URL}/api/v1/generate",
                json=ai_request,
            )
        if response.status_code != 200:
            logger.error("AI server error: %s - %s", response.status_code, response.text)
            error_response = _openai_error(
                "Upstream AI server error.",
                error_type="server_error",
                code="upstream_error",
                status_code=502,
            )
            _log_public_usage(
                db=db,
                api_key_id=api_key_record.id,
                endpoint=endpoint,
                model=model,
                prompt_text=prompt,
                completion_text=None,
                status_code=error_response.status_code,
                latency_ms=_elapsed_ms(start_time),
                ip=ip,
                user_agent=user_agent,
            )
            return error_response
    except httpx.TimeoutException:
        error_response = _openai_error(
            "Upstream AI server timeout.",
            error_type="server_error",
            code="timeout",
            status_code=504,
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=error_response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return error_response
    except httpx.RequestError as exc:
        logger.error("AI server connection error: %s", exc)
        error_response = _openai_error(
            "Upstream AI server connection error.",
            error_type="server_error",
            code="upstream_unavailable",
            status_code=502,
        )
        _log_public_usage(
            db=db,
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            model=model,
            prompt_text=prompt,
            completion_text=None,
            status_code=error_response.status_code,
            latency_ms=_elapsed_ms(start_time),
            ip=ip,
            user_agent=user_agent,
        )
        return error_response

    result = response.json()
    result_json = result.get("result_json", result.get("resultJson", {}))
    content = ""
    if isinstance(result_json, dict):
        content = result_json.get("curatorComment") or ""
    if not content:
        content = "OK"

    prompt_tokens = estimate_tokens(prompt)
    completion_tokens = estimate_tokens(content)
    total_tokens, api_cost = _log_public_usage(
        db=db,
        api_key_id=api_key_record.id,
        endpoint=endpoint,
        model=model,
        prompt_text=prompt,
        completion_text=content,
        status_code=200,
        latency_ms=_elapsed_ms(start_time),
        ip=ip,
        user_agent=user_agent,
    )

    request.state.api_model = EXTERNAL_MODEL_NAME
    request.state.api_cost = api_cost

    return JSONResponse(
        status_code=200,
        content={
            "id": f"chatcmpl-{uuid.uuid4().hex}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": EXTERNAL_MODEL_NAME,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": content},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
            },
        },
    )


def _elapsed_ms(start_time: float) -> int:
    return int((time.monotonic() - start_time) * 1000)


def _log_public_usage(
    db: DBSession,
    api_key_id: int,
    endpoint: str,
    model: str,
    prompt_text: Optional[str],
    completion_text: Optional[str],
    status_code: int,
    latency_ms: int,
    ip: Optional[str],
    user_agent: Optional[str],
) -> tuple[int, float]:
    model_value = model if isinstance(model, str) else str(model)
    prompt_tokens = estimate_tokens(prompt_text)
    completion_tokens = estimate_tokens(completion_text)
    try:
        return log_usage(
            db=db,
            api_key_id=api_key_id,
            endpoint=endpoint,
            model=model_value,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            status_code=status_code,
            latency_ms=latency_ms,
            ip=ip,
            user_agent=user_agent,
        )
    except Exception as exc:
        logger.error("Failed to log API usage: %s", exc)
        return prompt_tokens + completion_tokens, 0.0
