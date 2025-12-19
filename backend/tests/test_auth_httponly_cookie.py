"""
HttpOnly Cookie 인증 로직 테스트
API 주소 및 요청 관리 전략 (v2.0) 검증

테스트 목표:
1. 로그인 성공 시 'Set-Cookie' 헤더로 세션 쿠키 정상 발급 확인
2. 클라이언트가 withCredentials: true로 쿠키 자동 전송 확인
3. 401 Unauthorized 시 Silent Refresh 동작 확인
4. 로그아웃 시 쿠키 만료 처리 확인
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models import User
from app.services.auth_service import AuthService

# 테스트용 인메모리 SQLite 데이터베이스
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 테이블 생성
Base.metadata.create_all(bind=engine)


def override_get_db():
    """테스트용 DB 의존성 오버라이드"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def cleanup_database():
    """각 테스트 전후로 데이터베이스 초기화"""
    # 테스트 전: 테이블 초기화
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # 테스트 후: 테이블 초기화
    Base.metadata.drop_all(bind=engine)


class TestHttpOnlyCookieAuth:
    """HttpOnly Cookie 인증 테스트"""

    def test_signup_sets_httponly_cookie(self):
        """
        Step 1: 회원가입 시 Set-Cookie 헤더로 HttpOnly 세션 쿠키 발급 확인
        - Response에 Set-Cookie 헤더 존재
        - HttpOnly 속성 포함
        - JavaScript 접근 불가
        """
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "test@example.com",
                "password": "TestPass123!",
                "nickname": "테스터"
            }
        )

        print("\n=== Step 1: 회원가입 Set-Cookie 테스트 ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        print(f"Set-Cookie Header: {response.headers.get('set-cookie')}")

        # 상태 코드 확인
        assert response.status_code == 201

        # Response Body 확인
        data = response.json()
        assert "userId" in data
        assert data["email"] == "test@example.com"
        assert data["nickname"] == "테스터"

        # Set-Cookie 헤더 확인
        set_cookie = response.headers.get("set-cookie")
        assert set_cookie is not None, "Set-Cookie 헤더가 없습니다"
        assert "session=" in set_cookie, "세션 쿠키가 설정되지 않았습니다"
        assert "HttpOnly" in set_cookie, "HttpOnly 속성이 없습니다"
        assert "Path=/" in set_cookie, "Path가 설정되지 않았습니다"

        print("✅ Step 1 통과: Set-Cookie 헤더로 HttpOnly 세션 쿠키 정상 발급")

    def test_login_sets_httponly_cookie(self):
        """
        Step 1-2: 로그인 시 Set-Cookie 헤더로 HttpOnly 세션 쿠키 발급 확인
        """
        # 사용자 생성
        client.post(
            "/api/v1/auth/signup",
            json={
                "email": "login@example.com",
                "password": "TestPass123!",
                "nickname": "로그인테스터"
            }
        )

        # 로그인
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "login@example.com",
                "password": "TestPass123!"
            }
        )

        print("\n=== Step 1-2: 로그인 Set-Cookie 테스트 ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        print(f"Set-Cookie Header: {response.headers.get('set-cookie')}")

        # 상태 코드 확인
        assert response.status_code == 200

        # Response Body 확인 (토큰이 Body에 없어야 함!)
        data = response.json()
        assert "userId" in data
        assert "email" in data
        assert "nickname" in data
        assert "token" not in data, "⚠️ Response Body에 토큰이 포함되어 있습니다!"
        assert "access_token" not in data, "⚠️ Response Body에 access_token이 포함되어 있습니다!"

        # Set-Cookie 헤더 확인
        set_cookie = response.headers.get("set-cookie")
        assert set_cookie is not None
        assert "session=" in set_cookie
        assert "HttpOnly" in set_cookie

        print("✅ Step 1-2 통과: 로그인 시 HttpOnly 세션 쿠키 정상 발급")
        print("✅ Response Body에 토큰 미포함 확인 (보안 요구사항 충족)")

    def test_authenticated_request_with_cookie(self):
        """
        Step 2: 클라이언트가 쿠키를 자동 전송하여 인증 요청 성공 확인
        - withCredentials: true 옵션과 동일한 동작
        """
        # 회원가입 및 쿠키 획득
        signup_response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "cookie@example.com",
                "password": "TestPass123!",
                "nickname": "쿠키테스터"
            }
        )

        # 쿠키 추출
        cookies = signup_response.cookies

        print("\n=== Step 2: 쿠키 자동 전송 테스트 ===")
        print(f"Cookies: {cookies}")

        # 인증이 필요한 엔드포인트 호출 (/users/me)
        response = client.get("/api/v1/users/me", cookies=cookies)

        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")

        # 상태 코드 확인
        assert response.status_code == 200

        # 사용자 정보 확인
        data = response.json()
        assert data["email"] == "cookie@example.com"
        assert data["nickname"] == "쿠키테스터"

        print("✅ Step 2 통과: 쿠키를 통한 인증 요청 성공")

    def test_unauthorized_without_cookie(self):
        """
        Step 3-1: 쿠키 없이 인증 요청 시 401 Unauthorized 확인
        """
        print("\n=== Step 3-1: 쿠키 없이 인증 요청 테스트 ===")

        # 새로운 TestClient 인스턴스 생성 (쿠키 격리)
        new_client = TestClient(app)

        # 쿠키 없이 /users/me 호출
        response = new_client.get("/api/v1/users/me")

        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")

        # 401 확인
        assert response.status_code == 401

        # 에러 메시지 확인
        data = response.json()
        assert "error" in data

        print("✅ Step 3-1 통과: 쿠키 없이 요청 시 401 Unauthorized 정상 반환")

    def test_silent_refresh_success(self):
        """
        Step 3-2: Silent Refresh (/auth/refresh) 성공 확인
        - 기존 세션으로 새 세션 발급
        - 기존 세션 무효화
        """
        # 회원가입 및 쿠키 획득
        signup_response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "refresh@example.com",
                "password": "TestPass123!",
                "nickname": "리프레시테스터"
            }
        )

        old_cookies = signup_response.cookies
        old_session = old_cookies.get("session")

        print("\n=== Step 3-2: Silent Refresh 테스트 ===")
        print(f"Old Session: {old_session}")

        # /auth/refresh 호출
        response = client.post("/api/v1/auth/refresh", cookies=old_cookies)

        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        print(f"New Set-Cookie Header: {response.headers.get('set-cookie')}")

        # 상태 코드 확인
        assert response.status_code == 200

        # 새 쿠키 확인
        new_cookies = response.cookies
        new_session = new_cookies.get("session")

        print(f"New Session: {new_session}")

        assert new_session is not None
        assert new_session != old_session, "새 세션이 발급되지 않았습니다"

        # 새 쿠키로 인증 요청 성공 확인
        auth_response = client.get("/api/v1/users/me", cookies=new_cookies)
        assert auth_response.status_code == 200

        print("✅ Step 3-2 통과: Silent Refresh로 새 세션 발급 성공")

        # 기존 세션으로 요청 시 실패 확인 (무효화 확인)
        old_auth_response = client.get("/api/v1/users/me", cookies=old_cookies)
        assert old_auth_response.status_code == 401

        print("✅ 기존 세션 무효화 확인")

    def test_refresh_without_cookie_fails(self):
        """
        Step 3-3: 쿠키 없이 /auth/refresh 호출 시 401 반환 확인
        """
        print("\n=== Step 3-3: 쿠키 없이 Refresh 호출 테스트 ===")

        response = client.post("/api/v1/auth/refresh")

        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")

        assert response.status_code == 401

        print("✅ Step 3-3 통과: 쿠키 없이 Refresh 호출 시 401 반환")

    def test_logout_expires_cookie(self):
        """
        Step 4: 로그아웃 시 쿠키 만료 처리 확인
        - delete_cookie로 Max-Age=0 설정
        """
        # 회원가입 및 쿠키 획득
        signup_response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "logout@example.com",
                "password": "TestPass123!",
                "nickname": "로그아웃테스터"
            }
        )

        cookies = signup_response.cookies

        print("\n=== Step 4: 로그아웃 쿠키 만료 테스트 ===")
        print(f"Before Logout - Session: {cookies.get('session')}")

        # 로그아웃
        response = client.post("/api/v1/auth/logout", cookies=cookies)

        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        print(f"Set-Cookie Header: {response.headers.get('set-cookie')}")

        # 상태 코드 확인
        assert response.status_code == 200

        # 쿠키 삭제 확인
        # FastAPI의 delete_cookie는 max-age=0으로 설정
        set_cookie = response.headers.get("set-cookie")

        # TestClient는 쿠키를 자동으로 처리하므로 직접 헤더 확인
        # delete_cookie 시 빈 값 또는 만료된 값으로 설정됨
        after_logout_cookies = response.cookies

        print(f"After Logout - Cookies: {after_logout_cookies}")

        # 로그아웃 후 인증 요청 실패 확인
        auth_response = client.get("/api/v1/users/me", cookies=cookies)
        assert auth_response.status_code == 401

        print("✅ Step 4 통과: 로그아웃 시 세션 무효화 및 인증 실패 확인")


def run_all_tests():
    """모든 테스트 실행"""
    print("\n" + "="*60)
    print("HttpOnly Cookie 인증 로직 테스트 시작")
    print("="*60)

    # DB 초기화
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    test = TestHttpOnlyCookieAuth()
    tests = [
        ("Step 1: 회원가입 Set-Cookie", test.test_signup_sets_httponly_cookie),
        ("Step 1-2: 로그인 Set-Cookie", test.test_login_sets_httponly_cookie),
        ("Step 2: 쿠키 자동 전송", test.test_authenticated_request_with_cookie),
        ("Step 3-1: 쿠키 없이 요청", test.test_unauthorized_without_cookie),
        ("Step 3-2: Silent Refresh", test.test_silent_refresh_success),
        ("Step 3-3: Refresh without cookie", test.test_refresh_without_cookie_fails),
        ("Step 4: 로그아웃", test.test_logout_expires_cookie),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        # 각 테스트 전 DB 초기화
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        try:
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"\n❌ {name} 실패: {e}")
            failed += 1
        except Exception as e:
            print(f"\n❌ {name} 예외: {e}")
            failed += 1

    print("\n" + "="*60)
    print(f"테스트 결과: {passed}개 통과, {failed}개 실패")
    if failed == 0:
        print("✅ 모든 테스트 통과!")
    print("="*60)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
