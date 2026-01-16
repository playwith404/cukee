"""
전시회 관련 비즈니스 로직
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status

from app.models.exhibition import (
    Exhibition, ExhibitionDesign, ExhibitionMovie, ExhibitionKeyword,
    UserSavedExhibition, UserPinnedExhibition
)
from app.schemas.exhibition import ExhibitionCreate, ExhibitionUpdate


def create_exhibition(
    db: Session,
    user_id: int,
    exhibition_data: ExhibitionCreate
) -> Exhibition:
    """전시회 생성"""

    # 전시회 생성
    exhibition = Exhibition(
        user_id=user_id,
        ticket_group_id=exhibition_data.ticketId,  # 티켓 그룹 ID 저장
        title=exhibition_data.title,
        is_public=exhibition_data.isPublic
    )
    db.add(exhibition)
    db.flush()  # ID 생성을 위해 flush

    # 디자인 생성
    if exhibition_data.design:
        design = ExhibitionDesign(
            exhibition_id=exhibition.id,
            user_id=user_id,
            font=exhibition_data.design.font,
            color_scheme=exhibition_data.design.colorScheme,
            cukee_style=exhibition_data.design.cukeeStyle,
            frame_style=exhibition_data.design.frameStyle,
            background=exhibition_data.design.background,
            background_image=exhibition_data.design.backgroundImage
        )
        db.add(design)

    # 영화 추가
    if exhibition_data.movies:
        for movie_data in exhibition_data.movies:
            movie = ExhibitionMovie(
                exhibition_id=exhibition.id,
                movie_id=movie_data.movieId,
                display_order=movie_data.displayOrder,
                curator_comment=movie_data.curatorComment,
                is_pinned=movie_data.isPinned
            )
            db.add(movie)

    # 키워드 추가
    if exhibition_data.keywords:
        for keyword_data in exhibition_data.keywords:
            keyword = ExhibitionKeyword(
                exhibition_id=exhibition.id,
                keyword=keyword_data.keyword,
                weight=keyword_data.weight
            )
            db.add(keyword)

    db.commit()
    db.refresh(exhibition)

    return exhibition


def get_exhibitions(
    db: Session,
    user_id: Optional[int] = None,
    is_public: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
) -> tuple[List[Exhibition], int]:
    """전시회 목록 조회"""

    query = db.query(Exhibition)

    # 필터 적용
    if user_id is not None:
        query = query.filter(Exhibition.user_id == user_id)

    if is_public is not None:
        query = query.filter(Exhibition.is_public == is_public)

    # 총 개수
    total = query.count()

    # 페이지네이션
    exhibitions = query.order_by(Exhibition.created_at.desc()).offset(skip).limit(limit).all()

    return exhibitions, total


def get_exhibition_by_id(db: Session, exhibition_id: int) -> Optional[Exhibition]:
    """전시회 상세 조회"""
    return db.query(Exhibition).filter(Exhibition.id == exhibition_id).first()


def update_exhibition(
    db: Session,
    exhibition_id: int,
    user_id: int,
    exhibition_data: ExhibitionUpdate
) -> Exhibition:
    """전시회 수정"""

    # 전시회 조회
    exhibition = get_exhibition_by_id(db, exhibition_id)
    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="전시회를 찾을 수 없습니다."
        )

    # 권한 확인
    if exhibition.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="전시회를 수정할 권한이 없습니다."
        )

    # 기본 정보 수정
    if exhibition_data.title is not None:
        exhibition.title = exhibition_data.title

    if exhibition_data.isPublic is not None:
        exhibition.is_public = exhibition_data.isPublic

    # 디자인 수정
    if exhibition_data.design is not None:
        design = db.query(ExhibitionDesign).filter(
            ExhibitionDesign.exhibition_id == exhibition_id
        ).first()

        if design:
            # 기존 디자인 업데이트
            if exhibition_data.design.font is not None:
                design.font = exhibition_data.design.font
            if exhibition_data.design.colorScheme is not None:
                design.color_scheme = exhibition_data.design.colorScheme
            if exhibition_data.design.cukeeStyle is not None:
                design.cukee_style = exhibition_data.design.cukeeStyle
            if exhibition_data.design.frameStyle is not None:
                design.frame_style = exhibition_data.design.frameStyle
            if exhibition_data.design.background is not None:
                design.background = exhibition_data.design.background
            if exhibition_data.design.backgroundImage is not None:
                design.background_image = exhibition_data.design.backgroundImage
        else:
            # 새 디자인 생성
            design = ExhibitionDesign(
                exhibition_id=exhibition.id,
                user_id=user_id,
                font=exhibition_data.design.font,
                color_scheme=exhibition_data.design.colorScheme,
                cukee_style=exhibition_data.design.cukeeStyle,
                frame_style=exhibition_data.design.frameStyle,
                background=exhibition_data.design.background,
                background_image=exhibition_data.design.backgroundImage
            )
            db.add(design)

    # 영화 목록 수정
    if exhibition_data.movies is not None:
        # 기존 영화 목록 삭제
        db.query(ExhibitionMovie).filter(
            ExhibitionMovie.exhibition_id == exhibition.id
        ).delete()

        # 새 영화 목록 추가
        for movie_data in exhibition_data.movies:
            movie = ExhibitionMovie(
                exhibition_id=exhibition.id,
                movie_id=movie_data.movieId,
                display_order=movie_data.displayOrder,
                curator_comment=movie_data.curatorComment,
                is_pinned=movie_data.isPinned
            )
            db.add(movie)

    db.commit()
    db.refresh(exhibition)

    return exhibition


def delete_exhibition(db: Session, exhibition_id: int, user_id: int) -> None:
    """전시회 삭제"""

    # 전시회 조회
    exhibition = get_exhibition_by_id(db, exhibition_id)
    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="전시회를 찾을 수 없습니다."
        )

    # 권한 확인
    if exhibition.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="전시회를 삭제할 권한이 없습니다."
        )

    db.delete(exhibition)
    db.commit()


def save_exhibition(db: Session, exhibition_id: int, user_id: int) -> UserSavedExhibition:
    """전시회 저장"""

    # 전시회 존재 확인
    exhibition = get_exhibition_by_id(db, exhibition_id)
    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="전시회를 찾을 수 없습니다."
        )

    # 이미 저장되어 있는지 확인
    existing = db.query(UserSavedExhibition).filter(
        UserSavedExhibition.user_id == user_id,
        UserSavedExhibition.exhibition_id == exhibition_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 저장된 전시회입니다."
        )

    # 저장
    saved = UserSavedExhibition(
        user_id=user_id,
        exhibition_id=exhibition_id
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)

    return saved


def unsave_exhibition(db: Session, exhibition_id: int, user_id: int) -> None:
    """전시회 저장 취소"""

    saved = db.query(UserSavedExhibition).filter(
        UserSavedExhibition.user_id == user_id,
        UserSavedExhibition.exhibition_id == exhibition_id
    ).first()

    if not saved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="저장된 전시회를 찾을 수 없습니다."
        )

    db.delete(saved)
    db.commit()


def pin_exhibition(db: Session, exhibition_id: int, user_id: int) -> UserPinnedExhibition:
    """전시회 고정"""

    # 전시회 존재 확인
    exhibition = get_exhibition_by_id(db, exhibition_id)
    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="전시회를 찾을 수 없습니다."
        )

    # 이미 고정되어 있는지 확인
    existing = db.query(UserPinnedExhibition).filter(
        UserPinnedExhibition.user_id == user_id,
        UserPinnedExhibition.exhibition_id == exhibition_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 고정된 전시회입니다."
        )

    # 고정
    pinned = UserPinnedExhibition(
        user_id=user_id,
        exhibition_id=exhibition_id
    )
    db.add(pinned)
    db.commit()
    db.refresh(pinned)

    return pinned


def unpin_exhibition(db: Session, exhibition_id: int, user_id: int) -> None:
    """전시회 고정 취소"""

    pinned = db.query(UserPinnedExhibition).filter(
        UserPinnedExhibition.user_id == user_id,
        UserPinnedExhibition.exhibition_id == exhibition_id
    ).first()

    if not pinned:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고정된 전시회를 찾을 수 없습니다."
        )

    db.delete(pinned)
    db.commit()
