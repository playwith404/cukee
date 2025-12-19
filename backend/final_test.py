#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

print("="*80)
print("최종 스키마 검증 테스트")
print("="*80)

# 회원가입 테스트
print("\n[1] 회원가입 - camelCase 검증")
resp = requests.post(f"{BASE_URL}/api/v1/auth/signup", json={
    "email": "final_test@example.com",
    "password": "password123",
    "nickname": "최종테스트"
})
data = resp.json()
print(f"Status: {resp.status_code}")
print(f"Response Keys: {list(data.keys())}")
print(f"✅ userId 존재: {'userId' in data}")
print(f"❌ user_id 존재: {'user_id' in data}")
session = resp.cookies.get('session')

# 내 정보 조회 테스트
print("\n[2] 내 정보 조회 - camelCase 검증")
resp = requests.get(f"{BASE_URL}/api/v1/users/me", cookies={'session': session})
data = resp.json()
print(f"Status: {resp.status_code}")
print(f"Response Keys: {list(data.keys())}")
print(f"✅ userId 존재: {'userId' in data}")
print(f"✅ createdAt 존재: {'createdAt' in data}")
print(f"❌ user_id 존재: {'user_id' in data}")
print(f"❌ created_at 존재: {'created_at' in data}")

# 최종 검증
print("\n" + "="*80)
if 'userId' in data and 'createdAt' in data and 'user_id' not in data:
    print("✅ 모든 스키마 검증 통과! camelCase 정상 적용됨")
    print("\n🎉 Step 2 작업이 완료되었습니다. 깃 푸시를 진행해주세요.")
else:
    print("❌ 스키마 검증 실패")
print("="*80)
