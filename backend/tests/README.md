# Cukee Backend Tests

## HttpOnly Cookie 인증 테스트

### 테스트 실행

```bash
# pytest 사용
pytest tests/test_auth_httponly_cookie.py -v

# 직접 실행
PYTHONPATH=/Users/doochul/Desktop/team/cukee/backend python tests/test_auth_httponly_cookie.py
```

### 테스트 내용

1. **회원가입/로그인 시 HttpOnly 쿠키 발급**
   - Set-Cookie 헤더 확인
   - HttpOnly, SameSite, Path, Max-Age 속성 검증
   - Response Body에 토큰 미포함 확인

2. **쿠키를 통한 인증 요청**
   - withCredentials: true와 동일한 동작 검증

3. **401 Unauthorized 처리**
   - 쿠키 없이 요청 시 401 반환
   - Silent Refresh 동작 확인
   - Refresh 실패 시 401 반환

4. **로그아웃**
   - 쿠키 만료 처리 (Max-Age=0)
   - 세션 무효화 확인

### 테스트 결과

- **7개 테스트 모두 통과**
- API 주소 및 요청 관리 전략 (v2.0) 완벽 준수
- JSON 스키마 (v1.6) 준수

### 관련 문서

- [CUK-38 HttpOnly Cookie 인증 테스트 완료 보고서](../../End-to-End_테스트/CUK-38_HttpOnly_Cookie_인증_테스트_완료보고서.md)
- [API 명세서 (v1.6)](../../API_명세서_(v1.6)_-_httponly_cookie.pdf)
- [API 주소 및 요청 관리 전략 (v2.0)](../../API_주소_및_요청_관리_전략_(v2.0).pdf)
