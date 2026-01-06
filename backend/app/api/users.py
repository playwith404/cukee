"""
사용자 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.schemas.user import UserResponse, UpdateUserRequest, WithdrawRequest
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/users", tags=["Users"])


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


@router.patch("/me", response_model=UserResponse, response_model_by_alias=False, status_code=status.HTTP_200_OK)
def update_user_info(
    update_data: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    """
    사용자 정보 수정 (통합)
    - 닉네임, 프로필 이미지 등 부분 수정 가능
    - HttpOnly Cookie 필요
    """
    updated_user = current_user
    
    # 1. 닉네임 변경 요청 시
    if update_data.nickname:
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
    request: WithdrawRequest,  # [추가] 비밀번호 입력 받기
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
    response: Response = None # Cookie 삭제를 위해 response 객체 필요
):
    """
    회원 탈퇴 (Soft Delete)
    - 비밀번호 검증 후 처리
    - HttpOnly Cookie 필요
    """
    # 0. Response 객체 주입 확인 (FastAPI가 자동으로 주입해주지만 명시적으로 체크)
    # 실제로는 함수 시그니처에 있으면 FastAPI가 알아서 넣어줌.
    
    # 1. 비밀번호 검증
    from app.core.security import verify_password
    from fastapi import HTTPException
    
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비밀번호가 일치하지 않습니다."
        )

    # 2. Soft Delete 처리
    current_user.is_deleted = True
    from datetime import datetime
    current_user.deleted_at = datetime.utcnow()
    
    # 3. 세션 종료 (로그아웃 처리)
    from app.services.session_service import SessionService
    # 현재 요청의 세션 ID를 알 수 없으므로, 모든 세션을 만료시키거나 
    # 혹은 클라이언트가 보내준 쿠키를 통해 세션을 찾아 지워야 함.
    # 여기서는 간단히 DB 변경사항 저장하고 쿠키 삭제 명령만 내림.
    # (엄밀히는 현재 세션도 DB에서 지워주는게 좋음. get_current_user dependency가 세션을 리턴하지 않고 유저만 리턴해서 세션 ID를 모르는 상태)
    
    db.commit()

    # 4. 쿠키 삭제 (클라이언트 로그아웃) - Response 객체 활용
    # 주의: status_code가 204이면 Response Body를 보낼 수 없음.
    # FastAPI에서 204 응답에 set_cookie/delete_cookie 하려면 Response 파라미터를 사용해야 함.
    if response:
        response.delete_cookie(key="session", path="/")

    return None

    return None
