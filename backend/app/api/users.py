"""
사용자 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.schemas.user import UserResponse, UpdateUserRequest
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("/me", response_model=UserResponse, response_model_by_alias=False, status_code=status.HTTP_200_OK)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    현재 로그인한 사용자 정보 조회
    - HttpOnly Cookie 필요
    """
    return UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        nickname=current_user.nickname,
        created_at=current_user.created_at
    )


@router.put("/me", response_model=UserResponse, response_model_by_alias=False, status_code=status.HTTP_200_OK)
def update_user_info(
    update_data: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    사용자 정보 수정 (닉네임)
    - HttpOnly Cookie 필요
    """
    updated_user = AuthService.update_user_nickname(
        db,
        user_id=current_user.id,
        nickname=update_data.nickname
    )

    return UserResponse(
        user_id=updated_user.id,
        email=updated_user.email,
        nickname=updated_user.nickname,
        created_at=updated_user.created_at
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    회원 탈퇴 (Soft Delete)
    - HttpOnly Cookie 필요
    """
    current_user.is_deleted = True
    from datetime import datetime
    current_user.deleted_at = datetime.utcnow()
    db.commit()

    return None
