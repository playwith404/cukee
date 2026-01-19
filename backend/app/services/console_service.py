"""콘솔 토큰/API 키 서비스 (기존 테이블 사용)"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings
from app.models.console import ApiAccessToken
from app.utils.token_utils import generate_token


class ConsoleTokenService:
    """콘솔 액세스 토큰 관리"""

    @staticmethod
    def create_access_token(
        db: DBSession,
        name: str | None = None,
        expires_in_days: int | None = None,
    ) -> tuple[ApiAccessToken, str, str]:
        raw_access_token = generate_token(settings.CONSOLE_TOKEN_LENGTH)
        raw_api_key = ConsoleTokenService.generate_api_key()
        token_name = name.strip() if name and name.strip() else "Bearer"
        expires_at = None
        if expires_in_days and expires_in_days > 0:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        record = ApiAccessToken(
            api_key=raw_api_key,
            access_token=raw_access_token,
            token_type=token_name,
            expires_at=expires_at,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record, raw_access_token, raw_api_key

    @staticmethod
    def generate_api_key() -> str:
        return f"ck_{generate_token(settings.API_KEY_LENGTH - 3)}"

    @staticmethod
    def get_by_access_token(db: DBSession, raw_token: str) -> ApiAccessToken | None:
        return db.query(ApiAccessToken).filter(
            ApiAccessToken.access_token == raw_token
        ).first()

    @staticmethod
    def get_by_api_key(db: DBSession, api_key: str) -> ApiAccessToken | None:
        return db.query(ApiAccessToken).filter(
            ApiAccessToken.api_key == api_key
        ).first()

    @staticmethod
    def mark_used(db: DBSession, token_id: int) -> None:
        record = db.query(ApiAccessToken).filter(ApiAccessToken.id == token_id).first()
        if record:
            record.updated_at = datetime.utcnow()
            db.commit()
