"""
티켓 그룹 관련 데이터베이스 모델
"""
from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey
from app.core.database import Base


class TicketGroupMovie(Base):
    """티켓 그룹-영화 매핑 테이블"""
    __tablename__ = "ticket_group_movies"

    id = Column(Integer, primary_key=True, index=True)
    ticket_group_id = Column(Integer, ForeignKey("ticket_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)


class TicketGroup(Base):
    """티켓 그룹 테이블"""
    __tablename__ = "ticket_groups"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    curator_name = Column(String(50), nullable=False)
    curator_message = Column(Text, nullable=True)
    curator_image_url = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    color = Column(String(20), nullable=True)
    tags = Column(JSON, nullable=True)  # PostgreSQL에서는 JSONB로 자동 매핑
    description = Column(Text, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
