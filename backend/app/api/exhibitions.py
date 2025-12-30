"""
전시회 관련 API 엔드포인트 (실제 DB 연동)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session as DBSession
from typing import Optional, List

from app.core.database import get_db
from app.models.user import User
from app.models.exhibition import Exhibition
from app.schemas.exhibition import (
    ExhibitionCreate, ExhibitionUpdate, ExhibitionResponse,
    ExhibitionListResponse, ExhibitionListItem
)
from app.utils.dependencies import get_current_user_optional, get_current_user
from app.services import exhibition_service

router = APIRouter(prefix="/api/v1/exhibitions", tags=["Exhibitions"])


@router.post("", response_model=ExhibitionResponse, status_code=status.HTTP_201_CREATED)
def create_exhibition(
    exhibition_data: ExhibitionCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 생성
    - 인증 필수
    """
    exhibition = exhibition_service.create_exhibition(
        db=db,
        user_id=current_user.id,
        exhibition_data=exhibition_data
    )

    return ExhibitionResponse(
        id=exhibition.id,
        userId=exhibition.user_id,
        title=exhibition.title,
        isPublic=exhibition.is_public,
        createdAt=exhibition.created_at,
        updatedAt=exhibition.updated_at
    )


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def get_exhibitions(
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 개수"),
    user_id: Optional[int] = Query(None, description="사용자 ID로 필터"),
    is_public: Optional[bool] = Query(None, description="공개 여부로 필터"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    전시회 목록 조회
    - 인증 선택적
    - 페이지네이션 지원
    """
    skip = (page - 1) * limit

    exhibitions, total = exhibition_service.get_exhibitions(
        db=db,
        user_id=user_id,
        is_public=is_public,
        skip=skip,
        limit=limit
    )

    # 간단한 응답 형식으로 변환
    data = [
        {
            "id": ex.id,
            "userId": ex.user_id,
            "title": ex.title,
            "isPublic": ex.is_public,
            "createdAt": ex.created_at,
            "updatedAt": ex.updated_at
        }
        for ex in exhibitions
    ]

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{exhibition_id}", response_model=dict, status_code=status.HTTP_200_OK)
def get_exhibition_detail(
    exhibition_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    전시회 상세 조회
    - 인증 선택적
    """
    exhibition = exhibition_service.get_exhibition_by_id(db, exhibition_id)

    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="전시회를 찾을 수 없습니다."
        )

    # 권한 확인 (비공개 전시회는 작성자만 조회 가능)
    if not exhibition.is_public:
        if not current_user or current_user.id != exhibition.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비공개 전시회는 작성자만 조회할 수 있습니다."
            )

    # 응답 구성
    response = {
        "id": exhibition.id,
        "userId": exhibition.user_id,
        "title": exhibition.title,
        "isPublic": exhibition.is_public,
        "createdAt": exhibition.created_at,
        "updatedAt": exhibition.updated_at
    }

    # 디자인 정보 추가
    if exhibition.design:
        response["design"] = {
            "font": exhibition.design.font,
            "colorScheme": exhibition.design.color_scheme,
            "layoutType": exhibition.design.layout_type,
            "frameStyle": exhibition.design.frame_style,
            "background": exhibition.design.background,
            "backgroundImage": exhibition.design.background_image
        }

    # 키워드 정보 추가
    response["keywords"] = [
        {"keyword": kw.keyword, "weight": float(kw.weight)}
        for kw in exhibition.keywords
    ]

    # 영화 정보 추가 (현재는 빈 배열, 영화 데이터가 있을 때 사용)
    response["movies"] = []

    return response


@router.put("/{exhibition_id}", response_model=ExhibitionResponse, status_code=status.HTTP_200_OK)
def update_exhibition(
    exhibition_id: int,
    exhibition_data: ExhibitionUpdate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 수정
    - 인증 필수
    """
    exhibition = exhibition_service.update_exhibition(
        db=db,
        exhibition_id=exhibition_id,
        user_id=current_user.id,
        exhibition_data=exhibition_data
    )

    return ExhibitionResponse(
        id=exhibition.id,
        userId=exhibition.user_id,
        title=exhibition.title,
        isPublic=exhibition.is_public,
        createdAt=exhibition.created_at,
        updatedAt=exhibition.updated_at
    )


@router.delete("/{exhibition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exhibition(
    exhibition_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 삭제
    - 인증 필수
    """
    exhibition_service.delete_exhibition(
        db=db,
        exhibition_id=exhibition_id,
        user_id=current_user.id
    )
    return None


@router.post("/{exhibition_id}/save", status_code=status.HTTP_201_CREATED)
def save_exhibition(
    exhibition_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 저장
    - 인증 필수
    """
    saved = exhibition_service.save_exhibition(
        db=db,
        exhibition_id=exhibition_id,
        user_id=current_user.id
    )

    return {
        "message": "전시회가 저장되었습니다.",
        "exhibitionId": saved.exhibition_id
    }


@router.delete("/{exhibition_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_exhibition(
    exhibition_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 저장 취소
    - 인증 필수
    """
    exhibition_service.unsave_exhibition(
        db=db,
        exhibition_id=exhibition_id,
        user_id=current_user.id
    )
    return None


@router.post("/{exhibition_id}/pin", status_code=status.HTTP_201_CREATED)
def pin_exhibition(
    exhibition_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 고정
    - 인증 필수
    """
    pinned = exhibition_service.pin_exhibition(
        db=db,
        exhibition_id=exhibition_id,
        user_id=current_user.id
    )

    return {
        "message": "전시회가 고정되었습니다.",
        "exhibitionId": pinned.exhibition_id
    }


@router.delete("/{exhibition_id}/pin", status_code=status.HTTP_204_NO_CONTENT)
def unpin_exhibition(
    exhibition_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    전시회 고정 취소
    - 인증 필수
    """
    exhibition_service.unpin_exhibition(
        db=db,
        exhibition_id=exhibition_id,
        user_id=current_user.id
    )
    return None
