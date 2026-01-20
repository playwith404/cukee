"""
API key management service.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session as DBSession

from app.models.api_usage import CukApiKey
from app.services.console_service import ConsoleTokenService


class ApiKeyService:
    @staticmethod
    def get_by_api_key(db: DBSession, api_key: str) -> Optional[CukApiKey]:
        return db.query(CukApiKey).filter(CukApiKey.api_key == api_key).first()

    @staticmethod
    def list_by_console_token(db: DBSession, console_token_id: int) -> list[CukApiKey]:
        return (
            db.query(CukApiKey)
            .filter(CukApiKey.console_token_id == console_token_id)
            .order_by(CukApiKey.created_at.desc())
            .all()
        )

    @staticmethod
    def create_api_key(
        db: DBSession,
        console_token_id: int,
        name: Optional[str] = None,
        api_key_value: Optional[str] = None,
    ) -> tuple[CukApiKey, str]:
        raw_key = api_key_value or ConsoleTokenService.generate_api_key()
        record = CukApiKey(
            console_token_id=console_token_id,
            api_key=raw_key,
            token_name=name.strip() if name and name.strip() else None,
            status="active",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record, raw_key

    @staticmethod
    def revoke_api_key(db: DBSession, key_id: int) -> Optional[CukApiKey]:
        record = db.query(CukApiKey).filter(CukApiKey.id == key_id).first()
        if not record:
            return None
        record.status = "revoked"
        record.revoked_at = datetime.utcnow()
        db.commit()
        db.refresh(record)
        return record
