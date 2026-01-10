"""
티켓 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from typing import Optional
from sqlalchemy import func, exists, case, and_, Integer

from app.core.database import get_db
from app.models.ticket import TicketGroup, UserTicketLike
from app.schemas.ticket import TicketResponse, TicketListResponse, TicketDetailResponse
from app.utils.dependencies import get_current_user_optional, get_current_user
from app.models import User

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

def ticket_to_response_dict(ticket_row) -> dict:
    """DB Row(TicketGroup + like info)를 TicketResponse Dict로 변환"""
    # ticket_row가 (TicketGroup, like_count, is_liked) 튜플 형태라고 가정
    ticket = ticket_row[0]
    like_count = ticket_row[1]
    is_liked = ticket_row[2] if len(ticket_row) > 2 else False

    return {
        "id": ticket.id,
        "title": ticket.name,
        "curatorName": ticket.curator_name,
        "tags": ticket.tags if ticket.tags else [],
        "ticketImageUrl": ticket.image_url if ticket.image_url else "",
        "characterImageUrl": ticket.curator_image_url if ticket.curator_image_url else "",
        "width": ticket.width if ticket.width else 295,
        "height": ticket.height if ticket.height else 638,
        "ticketCode": ticket.ticket_code,
        "curatorMessage": ticket.curator_message,
        "color": ticket.color,
        "description": ticket.description,
        "likeCount": like_count,
        "isLiked": bool(is_liked)
    }


@router.get("", response_model=TicketListResponse, status_code=status.HTTP_200_OK)
def get_tickets(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    티켓 목록 조회
    - 인증 선택적
    - UserTicketLike와 조인하여 좋아요 개수 및 내 좋아요 여부 포함
    """
    user_id = current_user.id if current_user else None

    # Subquery for counting likes
    # (ticket_id, count)
    likes_sub = db.query(
        UserTicketLike.ticket_group_id,
        func.count(UserTicketLike.id).label("like_count")
    ).group_by(UserTicketLike.ticket_group_id).subquery()

    # Query
    q = db.query(
        TicketGroup,
        func.coalesce(likes_sub.c.like_count, 0).label("like_count"),
        case(
            (exists().where(
                and_(
                    UserTicketLike.ticket_group_id == TicketGroup.id,
                    UserTicketLike.user_id == user_id
                )
            ), 1),
            else_=0
        ).label("is_liked") if user_id else func.cast(0, Integer).label("is_liked") # type hinting issue workaround for False
    ).outerjoin(likes_sub, TicketGroup.id == likes_sub.c.ticket_group_id)

    results = q.all()

    # 응답 형식으로 변환
    ticket_responses = [TicketResponse(**ticket_to_response_dict(row)) for row in results]

    return TicketListResponse(
        data=ticket_responses,
        total=len(ticket_responses)
    )


@router.get("/{ticket_code}", response_model=TicketDetailResponse, status_code=status.HTTP_200_OK)
def get_ticket_detail(
    ticket_code: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    티켓 상세 조회
    """
    user_id = current_user.id if current_user else None

    # Subquery for counting likes
    likes_sub = db.query(
        UserTicketLike.ticket_group_id,
        func.count(UserTicketLike.id).label("like_count")
    ).group_by(UserTicketLike.ticket_group_id).subquery()

    row = db.query(
        TicketGroup,
        func.coalesce(likes_sub.c.like_count, 0).label("like_count"),
         case(
            (exists().where(
                and_(
                    UserTicketLike.ticket_group_id == TicketGroup.id,
                    UserTicketLike.user_id == user_id
                )
            ), 1),
            else_=0
        ).label("is_liked") if user_id else func.cast(0, Integer).label("is_liked")
    ).outerjoin(
        likes_sub, TicketGroup.id == likes_sub.c.ticket_group_id
    ).filter(TicketGroup.ticket_code == ticket_code).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"티켓을 찾을 수 없습니다: {ticket_code}"
        )

    return TicketDetailResponse(**ticket_to_response_dict(row))


@router.post("/{ticket_id}/like", status_code=status.HTTP_200_OK)
def toggle_ticket_like(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    티켓 좋아요 토글
    - 로그인 필수
    """
    # 티켓 존재 확인
    ticket = db.query(TicketGroup).filter(TicketGroup.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # 좋아요 존재 확인
    existing_like = db.query(UserTicketLike).filter(
        UserTicketLike.ticket_group_id == ticket_id,
        UserTicketLike.user_id == current_user.id
    ).first()

    if existing_like:
        # 삭제 (Unlike)
        db.delete(existing_like)
        db.commit()
        liked = False
    else:
        # 생성 (Like)
        new_like = UserTicketLike(
            user_id=current_user.id,
            ticket_group_id=ticket_id
        )
        db.add(new_like)
        db.commit()
        liked = True

    # 최신 좋아요 수 조회
    like_count = db.query(func.count(UserTicketLike.id)).filter(
        UserTicketLike.ticket_group_id == ticket_id
    ).scalar()

    return {
        "success": True,
        "isLiked": liked,
        "likeCount": like_count
    }
