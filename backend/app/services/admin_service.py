"""관리자 토큰 서비스"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings
from app.models.admin import AdminToken
from app.services.email_service import EmailService
from app.utils.token_utils import generate_token, hash_token


class AdminTokenService:
    """관리자 토큰 관리"""

    @staticmethod
    def _get_record(db: DBSession) -> AdminToken | None:
        return db.query(AdminToken).first()

    @staticmethod
    def get_record(db: DBSession) -> AdminToken | None:
        return AdminTokenService._get_record(db)

    @staticmethod
    def ensure_token(db: DBSession) -> AdminToken:
        """토큰이 없거나 만료되었으면 새로 발급"""
        record = AdminTokenService._get_record(db)
        now = datetime.utcnow()
        if not record or record.expires_at <= now:
            AdminTokenService.rotate_token(db)
            record = AdminTokenService._get_record(db)
        return record

    @staticmethod
    def rotate_token(db: DBSession) -> str:
        """관리자 토큰 갱신 및 이메일 발송"""
        raw_token = generate_token(settings.ADMIN_TOKEN_LENGTH)
        token_hash = hash_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(hours=settings.ADMIN_TOKEN_TTL_HOURS)

        record = AdminTokenService._get_record(db)
        if record:
            record.admin_token = token_hash
            record.expires_at = expires_at
        else:
            record = AdminToken(
                admin_id="admin",
                admin_token=token_hash,
                expires_at=expires_at,
            )
            db.add(record)

        db.commit()
        EmailService.send_admin_token_email(settings.ADMIN_EMAIL, raw_token, expires_at)
        return raw_token

    @staticmethod
    def verify_token(db: DBSession, raw_token: str) -> bool:
        """관리자 토큰 검증"""
        record = AdminTokenService._get_record(db)
        now = datetime.utcnow()
        if not record:
            return False
        if record.expires_at <= now:
            return False
        stored = record.admin_token or ""
        if len(stored) == 64:
            return hash_token(raw_token) == stored
        return raw_token == stored

    @staticmethod
    def mark_login(db: DBSession) -> None:
        record = AdminTokenService._get_record(db)
        if record:
            record.last_login_at = datetime.utcnow()
            db.commit()
