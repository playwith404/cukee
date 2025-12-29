"""
이메일 인증번호 서비스
"""
import random
import string
from app.core.redis import get_redis
from app.core.config import settings
from app.services.email_service import EmailService


class VerificationService:
    """인증번호 서비스"""

    VERIFICATION_PREFIX = "verify:email:"
    RATE_LIMIT_PREFIX = "rate:email:"

    @staticmethod
    def generate_code(length: int = 6) -> str:
        """6자리 숫자 인증번호 생성"""
        return "".join(random.choices(string.digits, k=length))

    @staticmethod
    def send_verification_code(email: str) -> dict:
        """
        인증번호 생성 및 이메일 발송
        - Rate limiting: 1분에 1회만 발송 가능
        - TTL: 5분 후 자동 만료
        """
        redis = get_redis()
        rate_key = f"{VerificationService.RATE_LIMIT_PREFIX}{email}"
        verify_key = f"{VerificationService.VERIFICATION_PREFIX}{email}"

        # Rate limiting 체크 (1분에 1회)
        if redis.exists(rate_key):
            ttl = redis.ttl(rate_key)
            return {
                "success": False,
                "message": f"{ttl}초 후에 다시 시도해주세요.",
                "retry_after": ttl
            }

        # 인증번호 생성
        code = VerificationService.generate_code()

        # Redis에 인증번호 저장 (5분 TTL)
        expire_seconds = settings.VERIFICATION_CODE_EXPIRE_MINUTES * 60
        redis.setex(verify_key, expire_seconds, code)

        # Rate limiting 설정 (60초)
        redis.setex(rate_key, 60, "1")

        # 이메일 발송
        try:
            EmailService.send_verification_email(email, code)
            return {
                "success": True,
                "message": "인증번호가 발송되었습니다.",
                "expires_in": expire_seconds
            }
        except Exception as e:
            # 발송 실패 시 Redis에서 삭제
            redis.delete(verify_key)
            redis.delete(rate_key)
            raise

    @staticmethod
    def verify_code(email: str, code: str) -> dict:
        """
        인증번호 검증
        - 성공 시 인증번호 삭제
        - 실패 시 에러 반환
        """
        redis = get_redis()
        verify_key = f"{VerificationService.VERIFICATION_PREFIX}{email}"

        # 저장된 인증번호 조회
        stored_code = redis.get(verify_key)

        if not stored_code:
            return {
                "success": False,
                "message": "인증번호가 만료되었거나 존재하지 않습니다.",
                "error_code": "EXPIRED"
            }

        if stored_code != code:
            return {
                "success": False,
                "message": "인증번호가 일치하지 않습니다.",
                "error_code": "INVALID"
            }

        # 인증 성공 시 인증번호 삭제
        redis.delete(verify_key)

        # 인증 완료 플래그 설정 (10분간 유효 - 회원가입 완료까지)
        verified_key = f"verified:email:{email}"
        redis.setex(verified_key, 600, "1")

        return {
            "success": True,
            "message": "이메일 인증이 완료되었습니다."
        }

    @staticmethod
    def is_email_verified(email: str) -> bool:
        """이메일 인증 완료 여부 확인"""
        redis = get_redis()
        verified_key = f"verified:email:{email}"
        return redis.exists(verified_key) == 1

    @staticmethod
    def clear_verified_flag(email: str) -> None:
        """인증 완료 플래그 삭제 (회원가입 완료 후)"""
        redis = get_redis()
        verified_key = f"verified:email:{email}"
        redis.delete(verified_key)
