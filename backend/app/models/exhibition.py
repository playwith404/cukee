"""
전시회 관련 데이터베이스 모델
"""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Numeric, CheckConstraint
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Exhibition(Base):
    """전시회 테이블"""
    __tablename__ = "exhibitions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    is_public = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    design = relationship("ExhibitionDesign", back_populates="exhibition", uselist=False, cascade="all, delete-orphan")
    movies = relationship("ExhibitionMovie", back_populates="exhibition", cascade="all, delete-orphan")
    keywords = relationship("ExhibitionKeyword", back_populates="exhibition", cascade="all, delete-orphan")


class ExhibitionDesign(Base):
    """전시회 디자인 테이블"""
    __tablename__ = "exhibition_designs"

    id = Column(Integer, primary_key=True, index=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    font = Column(String(50), nullable=True)
    color_scheme = Column(String(50), nullable=True)
    layout_type = Column(String(50), nullable=True)
    frame_style = Column(String(20), nullable=True)
    background = Column(String(100), nullable=True)
    background_image = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    exhibition = relationship("Exhibition", back_populates="design")

    __table_args__ = (
        CheckConstraint("frame_style IN ('none', 'frame') OR frame_style IS NULL", name="exhibition_designs_frame_style_check"),
    )


class ExhibitionMovie(Base):
    """전시회-영화 매핑 테이블"""
    __tablename__ = "exhibition_movies"

    id = Column(Integer, primary_key=True, index=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    display_order = Column(Integer, default=0)
    curator_comment = Column(Text, nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_removed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    exhibition = relationship("Exhibition", back_populates="movies")


class ExhibitionKeyword(Base):
    """전시회 키워드 테이블"""
    __tablename__ = "exhibition_keywords"

    id = Column(Integer, primary_key=True, index=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, index=True)
    keyword = Column(String(100), nullable=False, index=True)
    weight = Column(Numeric, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    exhibition = relationship("Exhibition", back_populates="keywords")


class UserSavedExhibition(Base):
    """사용자 저장 전시회 테이블"""
    __tablename__ = "user_saved_exhibitions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserPinnedExhibition(Base):
    """사용자 고정 전시회 테이블"""
    __tablename__ = "user_pinned_exhibitions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exhibition_id = Column(Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
