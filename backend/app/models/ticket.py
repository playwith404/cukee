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


class UserTicketLike(Base):
    """유저-티켓 좋아요 매핑 테이블"""
    __tablename__ = "user_ticket_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # DB 컬럼이 ticket_group_id라도 모델 필드명은 ticket_group_id를 그대로 씁니다.
    ticket_group_id = Column(Integer, ForeignKey("ticket_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(Text, default="now()") # DB가 created_at을 어떻게 쓰고 있는지에 따라 다르지만 일단 Text/String으로 두거나 DateTime으로 합니다. (기존 코드 스타일 따름)
