"""
영화 모델 (최소 정의 - DB 테이블은 AI 서버에 의해 관리됨)
"""
from sqlalchemy import Column, Integer, String, Text, Float, Date
from app.core.database import Base


class Movie(Base):
    """영화 테이블 (읽기 전용)"""
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title_ko = Column(String(500))
    title_en = Column(String(500))
    overview_ko = Column(Text)
    overview_en = Column(Text)
    poster_path = Column(String(500))
    backdrop_path = Column(String(500))
    release_date = Column(Date)
    vote_average = Column(Float)
    vote_count = Column(Integer)
    popularity = Column(Float)
    runtime = Column(Integer)
    director = Column(String(200))
    genre_ids = Column(String(100))
