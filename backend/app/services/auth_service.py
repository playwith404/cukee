"""
인증 관련 서비스
"""
from sqlalchemy.orm import Session as DBSession
from app.models import User
from app.core.security import verify_password, get_password_hash
from app.schemas.user import SignupRequest, LoginRequest
from fastapi import HTTPException, status


class AuthService:
    """인증 서비스"""

    @staticmethod
    def create_user(db: DBSession, signup_data: SignupRequest) -> User:
        """사용자 생성 (회원가입)"""
        # 이메일 중복 체크
        existing_user = db.query(User).filter(User.email == signup_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 등록된 이메일입니다."
            )

        # 비밀번호 해싱
        hashed_password = get_password_hash(signup_data.password)

        # 사용자 생성
        db_user = User(
            email=signup_data.email,
            nickname=signup_data.nickname,
            hashed_password=hashed_password,
            social_provider="email",
            agree_service=True,
            agree_privacy=True,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    @staticmethod
    def authenticate_user(db: DBSession, login_data: LoginRequest) -> User:
        """사용자 인증 (로그인)"""
        # 사용자 조회
        user = db.query(User).filter(
            User.email == login_data.email,
            User.is_deleted == False
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )

        # 비밀번호 검증
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )

        return user

    @staticmethod
    def get_user_by_id(db: DBSession, user_id: int) -> User:
        """사용자 ID로 조회"""
        user = db.query(User).filter(
            User.id == user_id,
            User.is_deleted == False
        ).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다."
            )

        return user

    @staticmethod
    def update_user_nickname(db: DBSession, user_id: int, nickname: str) -> User:
        """닉네임 수정"""
        user = AuthService.get_user_by_id(db, user_id)
        user.nickname = nickname
        db.commit()
        db.refresh(user)
        return user
