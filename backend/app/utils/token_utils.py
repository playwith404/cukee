"""
토큰 생성/해싱 유틸
"""
import hashlib
import secrets
import string

_ALPHANUM = string.ascii_letters + string.digits


def generate_token(length: int) -> str:
    """대소문자+숫자 토큰 생성"""
    return "".join(secrets.choice(_ALPHANUM) for _ in range(length))


def hash_token(token: str) -> str:
    """토큰 해시 (SHA-256)"""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_preview(prefix: str, suffix: str) -> str:
    """마스킹된 표시용 문자열"""
    return f"{prefix}...{suffix}"
