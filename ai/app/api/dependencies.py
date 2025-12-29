"""API Dependencies"""
from contextlib import contextmanager
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

@contextmanager
def get_db_session() -> Session:
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
