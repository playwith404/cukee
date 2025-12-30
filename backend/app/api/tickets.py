"""
티켓 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from typing import Optional

from app.core.database import get_db
from app.models.ticket import TicketGroup
from app.schemas.ticket import TicketResponse, TicketListResponse, TicketDetailResponse
from app.utils.dependencies import get_current_user_optional
from app.models import User

router = APIRouter(prefix="/api/v1/tickets", tags=["Tickets"])

def ticket_to_response(ticket: TicketGroup) -> dict:
    """TicketGroup 모델을 TicketResponse 형식으로 변환"""
    return {
        "id": ticket.id,
        "title": ticket.name,  # DB의 name → 프론트엔드의 title
        "curatorName": ticket.curator_name,
        "tags": ticket.tags if ticket.tags else [],
        "ticketImageUrl": ticket.image_url if ticket.image_url else "",
        "characterImageUrl": ticket.curator_image_url if ticket.curator_image_url else "",
        "width": ticket.width if ticket.width else 295,
        "height": ticket.height if ticket.height else 638,
        "ticketCode": ticket.ticket_code,
        "curatorMessage": ticket.curator_message,
        "color": ticket.color,
        "description": ticket.description
    }


@router.get("", response_model=TicketListResponse, status_code=status.HTTP_200_OK)
def get_tickets(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: DBSession = Depends(get_db)
):
    """
    티켓 목록 조회
    - 인증 선택적
    - PostgreSQL ticket_groups 테이블에서 조회
    """
    # DB에서 모든 티켓 조회
    tickets = db.query(TicketGroup).all()

    # 응답 형식으로 변환
    ticket_responses = [TicketResponse(**ticket_to_response(ticket)) for ticket in tickets]

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
    - 인증 선택적
    - ticket_code로 조회
    """
    # DB에서 티켓 조회
    ticket = db.query(TicketGroup).filter(TicketGroup.ticket_code == ticket_code).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"티켓을 찾을 수 없습니다: {ticket_code}"
        )

    # 응답 형식으로 변환
    return TicketDetailResponse(**ticket_to_response(ticket))
