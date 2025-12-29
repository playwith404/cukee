# 이메일 인증 기능 구현 작업 요약

## 1. 백엔드 구현

### 1.1 패키지 추가
**파일:** `backend/requirements.txt`
```
redis==5.0.1
aiosmtplib==3.0.1
jinja2==3.1.2
```

### 1.2 환경 변수 설정
**파일:** `backend/.env`, `backend/.env.example`
```env
# Redis
REDIS_URL=redis://localhost:6379/0

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Cukee

# Verification Code
VERIFICATION_CODE_EXPIRE_MINUTES=5
```

### 1.3 Config 설정 추가
**파일:** `backend/app/core/config.py`
- Redis URL 설정
- SMTP 관련 설정 (호스트, 포트, 사용자, 비밀번호)
- 인증번호 만료 시간 설정

### 1.4 Redis 연결 모듈
**파일:** `backend/app/core/redis.py`
```python
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
```

### 1.5 이메일 서비스
**파일:** `backend/app/services/email_service.py`
- Gmail SMTP를 통한 인증번호 이메일 발송
- HTML/텍스트 형식 이메일 템플릿

### 1.6 인증번호 서비스
**파일:** `backend/app/services/verification_service.py`
- 6자리 인증번호 생성
- Redis에 인증번호 저장 (5분 TTL)
- Rate limiting (1분에 1회 발송 제한)
- 인증번호 검증 및 인증 완료 플래그 설정

### 1.7 API 스키마
**파일:** `backend/app/schemas/user.py`
- `SendVerificationRequest` - 인증번호 발송 요청
- `SendVerificationResponse` - 인증번호 발송 응답
- `VerifyCodeRequest` - 인증번호 검증 요청
- `VerifyCodeResponse` - 인증번호 검증 응답

### 1.8 API 엔드포인트
**파일:** `backend/app/api/auth.py`

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/auth/email/send` | POST | 인증번호 발송 |
| `/api/v1/auth/email/verify` | POST | 인증번호 검증 |
| `/api/v1/auth/signup` | POST | 회원가입 (이메일 인증 필수) |

---

## 2. 프론트엔드 구현

### 2.1 API 함수
**파일:** `frontend/apps/web/src/apis/auth.ts`
```typescript
sendVerificationCode(email)  // 인증번호 발송
verifyEmailCode(email, code) // 인증번호 검증
signup(email, password, nickname) // 회원가입
login(email, password) // 로그인
logout() // 로그아웃
```

### 2.2 페이지 수정

#### Login.tsx
- Mock 데이터 제거
- 실제 `login()` API 연동
- 로그인 성공 시 `/home` (티켓 선택 페이지)로 이동

#### Signup.tsx
- Mock 데이터 제거
- 회원가입 폼 제출 시 `sendVerificationCode()` 호출
- 인증번호 페이지로 이동 (회원가입 정보를 state로 전달)

#### EmailVerifyPage.tsx
- 인증번호 검증 후 `signup()` API 호출
- 인증번호 재발송 기능 (60초 쿨다운)
- 회원가입 완료 시 `/home`으로 이동

### 2.3 라우터 설정
**파일:** `frontend/apps/web/src/App.tsx`
```typescript
<Route path="/" element={<Navigate to="/auth/login" replace />} />
<Route path="/home" element={<Home />} />
<Route path="/auth/login" element={<Login />} />
<Route path="/auth/signup" element={<Signup />} />
<Route path="/auth/email/verify" element={<EmailVerifyPage />} />
```

---

## 3. Redis Docker 설정

**파일:** `redis/Dockerfile`
```dockerfile
FROM redis:7.2-alpine
EXPOSE 6379
CMD ["redis-server", "--appendonly", "yes"]
```

---

## 4. 페이지 플로우

```
/ (루트)
  │
  └─ 리다이렉트 → /auth/login (로그인 페이지)
                      │
      ┌───────────────┴───────────────┐
      │                               │
  로그인 성공                    "회원가입" 클릭
      │                               │
      ▼                               ▼
  /home                      /auth/signup (회원가입)
  (티켓 선택)                         │
                                      ▼ 정보 입력 후 제출
                                      │
                              /auth/email/verify (인증번호)
                                      │
                                      ▼ 인증 성공 + 회원가입 완료
                                      │
                                  /home
                                (티켓 선택)
```

---

## 5. DB 저장 데이터

회원가입 완료 시 `users` 테이블에 저장되는 데이터:

| 컬럼 | 값 |
|------|-----|
| email | 사용자 입력 이메일 |
| nickname | 사용자 입력 닉네임 |
| hashed_password | bcrypt 해싱된 비밀번호 |
| social_provider | "email" |
| agree_service | true |
| agree_privacy | true |
| email_verified | false (기본값) |
