#!/usr/bin/env python3
"""
E2E 테스트 스크립트
프론트엔드-백엔드 API 통신 검증
"""

import requests
import json
from typing import Dict, Any
from datetime import datetime

BASE_URL = "http://localhost:8000"
session_cookie = None


def print_section(title: str):
    """섹션 제목 출력"""
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80)


def print_result(name: str, response: requests.Response, expected_status: int = 200):
    """API 호출 결과 출력"""
    success = response.status_code == expected_status
    status_icon = "✅" if success else "❌"

    print(f"\n{status_icon} {name}")
    print(f"   Status Code: {response.status_code} (expected: {expected_status})")
    print(f"   URL: {response.url}")

    try:
        data = response.json()
        print(f"   Response: {json.dumps(data, ensure_ascii=False, indent=2)}")
    except:
        print(f"   Response: {response.text}")

    # 쿠키 확인
    if 'set-cookie' in response.headers:
        print(f"   Set-Cookie: {response.headers['set-cookie']}")

    return success, response


def test_health_check():
    """헬스체크 테스트"""
    print_section("1. 헬스체크 테스트")

    response = requests.get(f"{BASE_URL}/health")
    success, _ = print_result("헬스체크", response, 200)

    return success


def test_signup():
    """회원가입 테스트"""
    print_section("2. 회원가입 테스트 (POST /api/auth/signup)")

    global session_cookie

    # 타임스탬프를 사용하여 고유한 이메일 생성
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    data = {
        "email": f"test{timestamp}@example.com",
        "password": "password123",
        "nickname": "테스트유저"
    }

    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json=data
    )

    success, resp = print_result("회원가입", response, 201)

    if success:
        # 쿠키 저장
        if 'session' in response.cookies:
            session_cookie = response.cookies['session']
            print(f"   ✅ Session Cookie 발급됨: {session_cookie[:20]}...")
        else:
            print(f"   ❌ Session Cookie가 발급되지 않음")
            success = False

        # 응답 검증
        json_data = response.json()
        if 'userId' in json_data and 'email' in json_data and 'nickname' in json_data:
            print(f"   ✅ 응답 스키마 검증 통과")
        else:
            print(f"   ❌ 응답 스키마 불일치")
            success = False

    return success, data


def test_login(email: str, password: str):
    """로그인 테스트"""
    print_section("3. 로그인 테스트 (POST /api/auth/login)")

    global session_cookie

    data = {
        "email": email,
        "password": password
    }

    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=data
    )

    success, _ = print_result("로그인", response, 200)

    if success:
        # 쿠키 업데이트
        if 'session' in response.cookies:
            session_cookie = response.cookies['session']
            print(f"   ✅ Session Cookie 갱신됨: {session_cookie[:20]}...")

        # 응답 검증
        json_data = response.json()
        if 'userId' in json_data and 'email' in json_data and 'nickname' in json_data:
            print(f"   ✅ 응답 스키마 검증 통과")
        else:
            print(f"   ❌ 응답 스키마 불일치")
            success = False

    return success


def test_get_user_info():
    """내 정보 조회 테스트"""
    print_section("4. 내 정보 조회 테스트 (GET /api/users/me)")

    global session_cookie

    if not session_cookie:
        print("   ❌ 세션 쿠키가 없습니다.")
        return False

    cookies = {'session': session_cookie}

    response = requests.get(
        f"{BASE_URL}/api/users/me",
        cookies=cookies
    )

    success, _ = print_result("내 정보 조회", response, 200)

    if success:
        json_data = response.json()
        has_user_id = 'userId' in json_data or 'user_id' in json_data
        has_email = 'email' in json_data
        has_nickname = 'nickname' in json_data
        has_created = 'createdAt' in json_data or 'created_at' in json_data

        if has_user_id and has_email and has_nickname and has_created:
            print(f"   ✅ 응답 스키마 검증 통과")
        else:
            print(f"   ❌ 응답 스키마 불일치")
            success = False

    return success


def test_update_user_info():
    """내 정보 수정 테스트"""
    print_section("5. 내 정보 수정 테스트 (PUT /api/users/me)")

    global session_cookie

    if not session_cookie:
        print("   ❌ 세션 쿠키가 없습니다.")
        return False

    cookies = {'session': session_cookie}

    data = {
        "nickname": "수정된닉네임"
    }

    response = requests.put(
        f"{BASE_URL}/api/users/me",
        json=data,
        cookies=cookies
    )

    success, _ = print_result("내 정보 수정", response, 200)

    if success:
        json_data = response.json()
        if json_data.get('nickname') == "수정된닉네임":
            print(f"   ✅ 닉네임 수정 확인됨")
        else:
            print(f"   ❌ 닉네임이 수정되지 않음")
            success = False

    return success


def test_ai_generate():
    """AI 생성 테스트"""
    print_section("6. AI 전시회 생성 테스트 (POST /api/ai/generate)")

    global session_cookie

    if not session_cookie:
        print("   ❌ 세션 쿠키가 없습니다.")
        return False

    cookies = {'session': session_cookie}

    data = {
        "prompt": "감성적인 영화를 추천해주세요",
        "ticketId": 3
    }

    response = requests.post(
        f"{BASE_URL}/api/ai/generate",
        json=data,
        cookies=cookies
    )

    success, _ = print_result("AI 전시회 생성", response, 200)

    if success:
        json_data = response.json()
        if 'resultJson' in json_data:
            result = json_data['resultJson']
            checks = []
            checks.append(('title', 'title' in result))
            checks.append(('design', 'design' in result))
            checks.append(('movies', 'movies' in result and isinstance(result['movies'], list)))
            checks.append(('keywords', 'keywords' in result and isinstance(result['keywords'], list)))

            all_ok = all(check[1] for check in checks)

            for name, ok in checks:
                icon = "✅" if ok else "❌"
                print(f"   {icon} {name} 필드 존재: {ok}")

            success = all_ok
        else:
            print(f"   ❌ resultJson 필드가 없음")
            success = False

    return success


def test_exhibitions_list():
    """전시회 목록 조회 테스트"""
    print_section("7. 전시회 목록 조회 테스트 (GET /api/exhibitions)")

    # 인증 불필요 (선택)
    params = {
        "page": 1,
        "limit": 20
    }

    response = requests.get(
        f"{BASE_URL}/api/exhibitions",
        params=params
    )

    success, _ = print_result("전시회 목록 조회", response, 200)

    if success:
        json_data = response.json()
        if 'data' in json_data and 'total' in json_data and 'page' in json_data and 'limit' in json_data:
            print(f"   ✅ 응답 스키마 검증 통과")
            print(f"   📊 총 {json_data['total']}개의 전시회, {len(json_data['data'])}개 조회됨")

            if json_data['data']:
                first_item = json_data['data'][0]
                required_fields = ['id', 'ticketId', 'title', 'curator', 'curatorMsg', 'likes', 'imageUrl']
                all_ok = all(field in first_item for field in required_fields)

                if all_ok:
                    print(f"   ✅ 전시회 데이터 스키마 검증 통과")
                else:
                    print(f"   ❌ 전시회 데이터 스키마 불일치")
                    success = False
        else:
            print(f"   ❌ 응답 스키마 불일치")
            success = False

    return success


def test_exhibition_detail():
    """전시회 상세 조회 테스트"""
    print_section("8. 전시회 상세 조회 테스트 (GET /api/exhibitions/{id})")

    exhibition_id = 1

    response = requests.get(
        f"{BASE_URL}/api/exhibitions/{exhibition_id}"
    )

    success, _ = print_result(f"전시회 상세 조회 (ID: {exhibition_id})", response, 200)

    if success:
        json_data = response.json()
        required_fields = ['id', 'ticketId', 'title', 'curator', 'curatorMsg', 'likes', 'imageUrl']
        all_ok = all(field in json_data for field in required_fields)

        if all_ok:
            print(f"   ✅ 응답 스키마 검증 통과")
        else:
            print(f"   ❌ 응답 스키마 불일치")
            success = False

    return success


def test_logout():
    """로그아웃 테스트"""
    print_section("9. 로그아웃 테스트 (POST /api/auth/logout)")

    global session_cookie

    if not session_cookie:
        print("   ❌ 세션 쿠키가 없습니다.")
        return False

    cookies = {'session': session_cookie}

    response = requests.post(
        f"{BASE_URL}/api/auth/logout",
        cookies=cookies
    )

    success, _ = print_result("로그아웃", response, 200)

    if success:
        json_data = response.json()
        if 'message' in json_data:
            print(f"   ✅ 로그아웃 메시지 확인: {json_data['message']}")

        # 세션 쿠키 제거 확인
        session_cookie = None

    return success


def test_database():
    """데이터베이스 검증"""
    print_section("10. 데이터베이스 검증")

    import sqlite3
    import os

    db_path = "/Users/doochul/Desktop/team/cukee/backend/cukee_dev.db"

    if not os.path.exists(db_path):
        print(f"   ❌ 데이터베이스 파일이 존재하지 않습니다: {db_path}")
        return False

    print(f"   ✅ 데이터베이스 파일 존재: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Users 테이블 확인
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_deleted = 0")
    user_count = cursor.fetchone()[0]
    print(f"   📊 활성 사용자 수: {user_count}")

    # Sessions 테이블 확인
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE is_revoked = 0")
    session_count = cursor.fetchone()[0]
    print(f"   📊 활성 세션 수: {session_count}")

    # 최근 생성된 사용자 확인
    cursor.execute("SELECT id, email, nickname, created_at FROM users ORDER BY created_at DESC LIMIT 3")
    recent_users = cursor.fetchall()

    print(f"\n   최근 생성된 사용자:")
    for user in recent_users:
        print(f"     - ID: {user[0]}, Email: {user[1]}, Nickname: {user[2]}, Created: {user[3]}")

    conn.close()

    return True


def main():
    """메인 테스트 실행"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "프론트엔드-백엔드 E2E 테스트" + " "*20 + "║")
    print("║" + " "*25 + "API 명세서 v1.6 기준" + " "*25 + "║")
    print("╚" + "="*78 + "╝")

    results = []

    # 1. 헬스체크
    results.append(("헬스체크", test_health_check()))

    # 2. 회원가입
    signup_success, user_data = test_signup()
    results.append(("회원가입", signup_success))

    if not signup_success:
        print("\n❌ 회원가입 실패로 테스트 중단")
        return

    # 3. 로그인
    results.append(("로그인", test_login(user_data['email'], user_data['password'])))

    # 4. 내 정보 조회
    results.append(("내 정보 조회", test_get_user_info()))

    # 5. 내 정보 수정
    results.append(("내 정보 수정", test_update_user_info()))

    # 6. AI 생성
    results.append(("AI 전시회 생성", test_ai_generate()))

    # 7. 전시회 목록
    results.append(("전시회 목록 조회", test_exhibitions_list()))

    # 8. 전시회 상세
    results.append(("전시회 상세 조회", test_exhibition_detail()))

    # 9. 로그아웃
    results.append(("로그아웃", test_logout()))

    # 10. DB 검증
    results.append(("데이터베이스 검증", test_database()))

    # 결과 요약
    print_section("테스트 결과 요약")

    total = len(results)
    passed = sum(1 for _, success in results if success)
    failed = total - passed

    print(f"\n총 테스트: {total}")
    print(f"✅ 통과: {passed}")
    print(f"❌ 실패: {failed}")
    print(f"\n성공률: {passed/total*100:.1f}%")

    print("\n상세 결과:")
    for name, success in results:
        icon = "✅" if success else "❌"
        print(f"  {icon} {name}")

    print("\n" + "="*80)

    if failed == 0:
        print("\n🎉 모든 테스트가 통과했습니다!")
        print("\n✅ Step 2 작업이 완료되었습니다. 깃 푸시를 진행해주세요.")
    else:
        print(f"\n⚠️  {failed}개의 테스트가 실패했습니다. 문제를 확인해주세요.")

    print("\n")


if __name__ == "__main__":
    main()
