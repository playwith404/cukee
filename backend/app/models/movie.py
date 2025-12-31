"""
Movie 모델 (읽기 전용)
VM2 DB의 movies 테이블을 참조
"""
from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Movie(Base):
    """Movie 테이블 (읽기 전용) - 최소한의 컬럼만 정의"""
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title_ko = Column(String(255), nullable=True)
    overview_ko = Column(Text, nullable=True)
    poster_path = Column(String(255), nullable=True)
    
    @property
    def title(self):
        """title 속성으로 접근 가능하도록"""
        return self.title_ko
    
    @property
    def poster_url(self):
        """poster_url 속성으로 접근 가능하도록"""
        return self.poster_path
