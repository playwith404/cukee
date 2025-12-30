"""
Movie 모델 (읽기 전용)
VM2 DB의 movies 테이블을 참조
"""
from sqlalchemy import Column, Integer, String, Text, Date, Float, ARRAY
from app.core.database import Base


class Movie(Base):
    """Movie 테이블 (읽기 전용)"""
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title_ko = Column(String(255), nullable=True)  # 한국어 제목만 존재
    overview_ko = Column(Text, nullable=True)
    poster_path = Column(String(255), nullable=True)  # poster_url이 아닌 poster_path
    backdrop_path = Column(String(255), nullable=True)
    release_date = Column(Date, nullable=True)
    vote_average = Column(Float, nullable=True)
    vote_count = Column(Integer, nullable=True)
    popularity = Column(Float, nullable=True)
    runtime = Column(Integer, nullable=True)
    director = Column(String(255), nullable=True)
    genre_ids = Column(ARRAY(Integer), nullable=True)
    
    @property
    def title(self):
        """title 속성으로 접근 가능하도록"""
        return self.title_ko
    
    @property
    def poster_url(self):
        """poster_url 속성으로 접근 가능하도록"""
        return self.poster_path
