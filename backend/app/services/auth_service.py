"""
인증 관련 서비스
"""
import secrets
from sqlalchemy.orm import Session as DBSession
from app.models import User
from app.models.user import SocialProviderEnum
from app.core.security import verify_password, get_password_hash
from app.schemas.user import SignupRequest, LoginRequest
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    NotFoundException
)


class AuthService:
    """인증 서비스"""

    @staticmethod
    def create_user(db: DBSession, signup_data: SignupRequest) -> User:
        """사용자 생성 (회원가입)"""
        # 이메일 중복 체크
        existing_user = db.query(User).filter(User.email == signup_data.email).first()
        if existing_user:
            # 탈퇴한 유저인 경우 -> 재활성화 (Reactivation)
            if existing_user.is_deleted:
                hashed_password = get_password_hash(signup_data.password)
                
                existing_user.is_deleted = False
                existing_user.deleted_at = None
                existing_user.nickname = signup_data.nickname
                existing_user.hashed_password = hashed_password
                
                db.commit()
                db.refresh(existing_user)
                return existing_user

            raise ConflictException(
                message="이미 등록된 이메일입니다.",
                details=f"이메일 '{signup_data.email}'은(는) 이미 사용 중입니다."
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
            raise UnauthorizedException(
                message="이메일 또는 비밀번호가 올바르지 않습니다.",
                details="인증 정보를 확인해주세요."
            )

        # 비밀번호 검증
        if not verify_password(login_data.password, user.hashed_password):
            raise UnauthorizedException(
                message="이메일 또는 비밀번호가 올바르지 않습니다.",
                details="인증 정보를 확인해주세요."
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
            raise NotFoundException(
                message="사용자를 찾을 수 없습니다.",
                details=f"사용자 ID '{user_id}'가 존재하지 않습니다."
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

    @staticmethod
    def reset_password(db: DBSession, email: str, new_password: str) -> User:
        """비밀번호 재설정"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise NotFoundException(
                message="사용자를 찾을 수 없습니다.",
                details=f"이메일 '{email}'에 해당하는 사용자가 없습니다."
            )

        user.hashed_password = get_password_hash(new_password)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_or_create_google_user(db: DBSession, google_user_info: dict) -> User:
        """Google 사용자 조회 또는 생성"""
        google_id = google_user_info.get("id")
        email = google_user_info.get("email")
        name = google_user_info.get("name", "")

        # 1. Google ID로 기존 사용자 조회
        user = db.query(User).filter(
            User.social_provider == SocialProviderEnum.google,
            User.social_id == google_id,
            User.is_deleted == False
        ).first()

        if user:
            return user

        # 2. 이메일로 기존 사용자 조회 (이메일 계정으로 가입한 경우)
        existing_user = db.query(User).filter(
            User.email == email,
            User.is_deleted == False
        ).first()

        if existing_user:
            # 기존 이메일 계정에 Google 연동
            existing_user.social_provider = SocialProviderEnum.google
            existing_user.social_id = google_id
            db.commit()
            db.refresh(existing_user)
            return existing_user

        # 3. 탈퇴한 유저 중 같은 이메일이 있는지 확인 (재가입)
        deleted_user = db.query(User).filter(
            User.email == email,
            User.is_deleted == True
        ).first()

        if deleted_user:
            # 재활성화
            deleted_user.is_deleted = False
            deleted_user.deleted_at = None
            deleted_user.nickname = name[:20] if name else f"user_{google_id[:8]}"
            deleted_user.social_provider = SocialProviderEnum.google
            deleted_user.social_id = google_id
            deleted_user.hashed_password = get_password_hash(secrets.token_urlsafe(32))
            db.commit()
            db.refresh(deleted_user)
            return deleted_user

        # 4. 새 사용자 생성
        nickname = name[:20] if name else f"user_{google_id[:8]}"

        # 닉네임 중복 시 랜덤 숫자 추가
        base_nickname = nickname
        counter = 1
        while db.query(User).filter(User.nickname == nickname).first():
            nickname = f"{base_nickname[:17]}_{counter}"
            counter += 1

        new_user = User(
            email=email,
            nickname=nickname,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            social_provider=SocialProviderEnum.google,
            social_id=google_id,
            email_verified=True,
            agree_service=True,
            agree_privacy=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
