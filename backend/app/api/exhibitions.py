"""
전시회 관련 API 엔드포인트 (Mock)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session as DBSession
from typing import Optional

from app.core.database import get_db
from app.schemas.exhibition import ExhibitionListResponse, ExhibitionListItem, ExhibitionDetailResponse
from app.utils.dependencies import get_current_user_optional
from app.models import User

router = APIRouter(prefix="/api/v1/exhibitions", tags=["Exhibitions"])


@router.get("", response_model=ExhibitionListResponse, status_code=status.HTTP_200_OK)
def get_exhibitions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    전시회(티켓) 목록 조회 (Mock)
    - 인증 선택적
    - 페이지네이션 지원
    """
    # Mock 데이터 - 11개 티켓
    mock_tickets = [
        {
            "id": 1,
            "ticketId": 1,
            "title": "숏폼 러버 MZ",
            "curator": "트렌디 큐레이터 MZ",
            "curatorMsg": "빠르게 즐기는 MZ세대 맞춤 영화",
            "likes": 150,
            "imageUrl": "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
            "tags": ["트렌디", "숏폼", "MZ"],
            "color": "#FF6B6B",
            "width": 300,
            "height": 450
        },
        {
            "id": 2,
            "ticketId": 2,
            "title": "영화덕후의 최애 마이너영화",
            "curator": "인디 마니아 큐레이터",
            "curatorMsg": "숨은 명작을 찾는 당신을 위한 선택",
            "likes": 230,
            "imageUrl": "https://images.unsplash.com/photo-1574267432644-f02b0047f30d",
            "tags": ["인디", "마이너", "숨은명작"],
            "color": "#4ECDC4",
            "width": 300,
            "height": 450
        },
        {
            "id": 3,
            "ticketId": 3,
            "title": "편안하고 잔잔한 감성",
            "curator": "힐링 큐레이터",
            "curatorMsg": "마음이 편안해지는 잔잔한 영화",
            "likes": 189,
            "imageUrl": "https://images.unsplash.com/photo-1560109947-543149eceb16",
            "tags": ["힐링", "감성", "잔잔함"],
            "color": "#95E1D3",
            "width": 300,
            "height": 450
        },
        {
            "id": 4,
            "ticketId": 4,
            "title": "찝찝한 여운의 우울한 명작",
            "curator": "다크 큐레이터",
            "curatorMsg": "깊은 여운을 남기는 다크한 영화",
            "likes": 312,
            "imageUrl": "https://images.unsplash.com/photo-1542204165-65bf26472b9b",
            "tags": ["다크", "우울", "여운"],
            "color": "#2C3E50",
            "width": 300,
            "height": 450
        },
        {
            "id": 5,
            "ticketId": 5,
            "title": "뇌 빼고도 볼 수 있는 레전드 코미디",
            "curator": "코미디 큐레이터",
            "curatorMsg": "웃음이 필요할 때 보는 코미디",
            "likes": 456,
            "imageUrl": "https://images.unsplash.com/photo-1534447677768-be436bb09401",
            "tags": ["코미디", "웃음", "유쾌"],
            "color": "#F9CA24",
            "width": 300,
            "height": 450
        },
        {
            "id": 6,
            "ticketId": 6,
            "title": "심장 터질 것 같은 액션 범죄",
            "curator": "액션 큐레이터",
            "curatorMsg": "손에 땀을 쥐게 하는 액션 영화",
            "likes": 378,
            "imageUrl": "https://images.unsplash.com/photo-1478720568477-152d9b164e26",
            "tags": ["액션", "범죄", "스릴"],
            "color": "#E74C3C",
            "width": 300,
            "height": 450
        },
        {
            "id": 7,
            "ticketId": 7,
            "title": "세계관 과몰입 SF러버",
            "curator": "SF 큐레이터",
            "curatorMsg": "상상력을 자극하는 SF 영화",
            "likes": 267,
            "imageUrl": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
            "tags": ["SF", "판타지", "상상력"],
            "color": "#3498DB",
            "width": 300,
            "height": 450
        },
        {
            "id": 8,
            "ticketId": 8,
            "title": "이거 실화야? 실화야.",
            "curator": "논픽션 큐레이터",
            "curatorMsg": "실화를 바탕으로 한 감동의 이야기",
            "likes": 198,
            "imageUrl": "https://images.unsplash.com/photo-1512070679279-8988d32161be",
            "tags": ["실화", "논픽션", "감동"],
            "color": "#16A085",
            "width": 300,
            "height": 450
        },
        {
            "id": 9,
            "ticketId": 9,
            "title": "여름에 찰떡인 역대급 호러",
            "curator": "호러 큐레이터",
            "curatorMsg": "등골이 오싹해지는 공포 영화",
            "likes": 289,
            "imageUrl": "https://images.unsplash.com/photo-1509248961158-e54f6934749c",
            "tags": ["호러", "공포", "오싹"],
            "color": "#8E44AD",
            "width": 300,
            "height": 450
        },
        {
            "id": 10,
            "ticketId": 10,
            "title": "설레고 싶은 날의 로맨스",
            "curator": "로맨스 큐레이터",
            "curatorMsg": "가슴 설레는 로맨스 영화",
            "likes": 421,
            "imageUrl": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9",
            "tags": ["로맨스", "설렘", "사랑"],
            "color": "#FF69B4",
            "width": 300,
            "height": 450
        },
        {
            "id": 11,
            "ticketId": 11,
            "title": "3D 보단 2D",
            "curator": "애니메이션 큐레이터",
            "curatorMsg": "감성 가득한 2D 애니메이션",
            "likes": 334,
            "imageUrl": "https://images.unsplash.com/photo-1606603696914-854400fccb1a",
            "tags": ["애니메이션", "2D", "감성"],
            "color": "#FFA07A",
            "width": 300,
            "height": 450
        }
    ]

    # 페이지네이션
    start = (page - 1) * limit
    end = start + limit
    paginated_data = mock_tickets[start:end]

    return ExhibitionListResponse(
        data=[ExhibitionListItem(**item) for item in paginated_data],
        total=len(mock_tickets),
        page=page,
        limit=limit
    )


@router.get("/{id}", response_model=ExhibitionDetailResponse, status_code=status.HTTP_200_OK)
def get_exhibition_detail(
    id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    전시회 상세 조회 (Mock)
    - 인증 선택적
    """
    # Mock 상세 데이터
    from datetime import datetime

    if id > 11:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="전시회를 찾을 수 없습니다."
        )

    mock_detail = {
        "id": id,
        "userId": 1,
        "title": f"전시회 {id} 타이틀",
        "isPublic": True,
        "design": {
            "font": "Pretendard",
            "colorScheme": "dark",
            "layoutType": "grid",
            "frameStyle": "modern",
            "background": "#1a1a1a",
            "backgroundImage": "https://images.unsplash.com/photo-1478720568477-152d9b164e26"
        },
        "movies": [
            {
                "id": 1,
                "movieId": 101,
                "title": "영화 제목 1",
                "posterUrl": "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
                "displayOrder": 1,
                "isPinned": True,
                "curatorComment": "정말 감동적인 영화입니다."
            },
            {
                "id": 2,
                "movieId": 102,
                "title": "영화 제목 2",
                "posterUrl": "https://images.unsplash.com/photo-1574267432644-f02b0047f30d",
                "displayOrder": 2,
                "isPinned": False,
                "curatorComment": "시각적으로 아름다운 작품입니다."
            }
        ],
        "keywords": [
            {"keyword": "감성", "weight": 0.9},
            {"keyword": "힐링", "weight": 0.8},
            {"keyword": "추천", "weight": 0.7}
        ],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    return ExhibitionDetailResponse(**mock_detail)
