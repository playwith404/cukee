"""
세션 관리 서비스 (HttpOnly Cookie)
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from app.models import Session
from app.core.config import settings
import uuid


class SessionService:
    """세션 관리 서비스"""

    @staticmethod
    def create_session(
        db: DBSession,
        user_id: int,
        ip_address: str = None,
        user_agent: str = None
    ) -> Session:
        """세션 생성"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        db_session = Session(
            id=session_id,
            user_id=user_id,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        db.add(db_session)
        db.commit()
        db.refresh(db_session)

        return db_session

    @staticmethod
    def get_session(db: DBSession, session_id: str) -> Session:
        """세션 조회"""
        return db.query(Session).filter(
            Session.id == session_id,
            Session.is_revoked == False,
            Session.expires_at > datetime.utcnow()
        ).first()

    @staticmethod
    def revoke_session(db: DBSession, session_id: str) -> bool:
        """세션 무효화 (로그아웃)"""
        db_session = db.query(Session).filter(Session.id == session_id).first()
        if db_session:
            db_session.is_revoked = True
            db.commit()
            return True
        return False

    @staticmethod
    def delete_expired_sessions(db: DBSession) -> int:
        """만료된 세션 삭제"""
        result = db.query(Session).filter(
            Session.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        return result
