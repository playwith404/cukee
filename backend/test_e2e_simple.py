#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

def check_field(data, *fields):
    """여러 필드 중 하나라도 존재하면 True (snake_case와 camelCase 모두 체크)"""
    for field in fields:
        if field in data:
            return True
    return False

print("="*80)
print("E2E 테스트 시작")
print("="*80)

# 1. 회원가입
print("\n[1] 회원가입 테스트")
resp = requests.post(f"{BASE_URL}/api/v1/auth/signup", json={
    "email": "testuser999@example.com",
    "password": "password123",
    "nickname": "테스트999"
})
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")
session_cookie = resp.cookies.get('session')
print(f"Session Cookie: {session_cookie[:30] if session_cookie else 'None'}...")

# 2. 로그인
print("\n[2] 로그인 테스트")
resp = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
    "email": "testuser999@example.com",
    "password": "password123"
})
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")
session_cookie = resp.cookies.get('session')

# 3. 내 정보 조회
print("\n[3] 내 정보 조회 테스트")
resp = requests.get(f"{BASE_URL}/api/v1/users/me", cookies={'session': session_cookie})
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")

# 4. 내 정보 수정
print("\n[4] 내 정보 수정 테스트")
resp = requests.put(f"{BASE_URL}/api/v1/users/me", 
    json={"nickname": "수정된닉네임999"},
    cookies={'session': session_cookie}
)
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")

# 5. AI 생성
print("\n[5] AI 전시회 생성 테스트")
resp = requests.post(f"{BASE_URL}/api/v1/ai/generate",
    json={"prompt": "감성적인 영화 추천", "ticketId": 3},
    cookies={'session': session_cookie}
)
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")

# 6. 전시회 목록
print("\n[6] 전시회 목록 조회 테스트")
resp = requests.get(f"{BASE_URL}/api/v1/exhibitions?page=1&limit=5")
print(f"Status: {resp.status_code}")
data = resp.json()
print(f"총 {data.get('total')}개 중 {len(data.get('data', []))}개 조회")
if data.get('data'):
    print(f"첫 번째 항목: {json.dumps(data['data'][0], ensure_ascii=False, indent=2)}")

# 7. 전시회 상세
print("\n[7] 전시회 상세 조회 테스트")
resp = requests.get(f"{BASE_URL}/api/v1/exhibitions/1")
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")

# 8. 로그아웃
print("\n[8] 로그아웃 테스트")
resp = requests.post(f"{BASE_URL}/api/v1/auth/logout", cookies={'session': session_cookie})
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), ensure_ascii=False, indent=2)}")

# 9. DB 검증
print("\n[9] 데이터베이스 검증")
import sqlite3
conn = sqlite3.connect("/Users/doochul/Desktop/team/cukee/backend/cukee_dev.db")
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM users WHERE is_deleted = 0")
print(f"활성 사용자 수: {cursor.fetchone()[0]}")
cursor.execute("SELECT COUNT(*) FROM sessions")
print(f"총 세션 수: {cursor.fetchone()[0]}")
cursor.execute("SELECT id, email, nickname FROM users ORDER BY id DESC LIMIT 3")
print(f"최근 사용자:")
for row in cursor.fetchall():
    print(f"  - ID: {row[0]}, Email: {row[1]}, Nickname: {row[2]}")
conn.close()

print("\n" + "="*80)
print("테스트 완료!")
print("="*80)
