# Cukee Backend API

큐키 프로젝트의 백엔드 API 서버입니다. (FastAPI + HttpOnly Cookie 인증)

## 기술 스택

- **Framework**: FastAPI 0.115.0
- **Database**: SQLAlchemy 2.0.36 + SQLite (개발) / PostgreSQL (배포)
- **Authentication**: HttpOnly Cookie (Session-based)
- **Validation**: Pydantic 2.10.3
- **Security**: passlib, python-jose

## 프로젝트 구조

```
backend/
├── app/
│   ├── api/              # API 엔드포인트
│   │   ├── auth.py       # 인증 (signup, login, logout, refresh)
│   │   ├── users.py      # 사용자 (GET/PUT/DELETE /users/me)
│   │   ├── ai.py         # AI 전시회 생성 (Mock)
│   │   └── exhibitions.py # 전시회 목록/상세 (Mock)
│   ├── core/             # 핵심 설정
│   │   ├── config.py     # 환경 변수 설정
│   │   ├── database.py   # DB 연결
│   │   └── security.py   # JWT, 비밀번호 해싱
│   ├── models/           # SQLAlchemy 모델
│   │   ├── user.py       # User 테이블
│   │   └── session.py    # Session 테이블
│   ├── schemas/          # Pydantic 스키마
│   │   ├── user.py       # 사용자 Request/Response
│   │   ├── ai.py         # AI Request/Response
│   │   ├── exhibition.py # 전시회 Response
│   │   └── common.py     # 공통 Response
│   ├── services/         # 비즈니스 로직
│   │   ├── auth_service.py    # 인증 서비스
│   │   └── session_service.py # 세션 서비스
│   ├── utils/            # 유틸리티
│   │   └── dependencies.py # FastAPI 의존성
│   └── main.py           # FastAPI 앱 진입점
├── requirements.txt      # Python 패키지
├── .env                  # 환경 변수 (개발용)
├── .env.example          # 환경 변수 예시
└── README.md             # 이 파일
```

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다. (개발용 SQLite 사용)

배포 시에는 PostgreSQL URL로 변경하세요:
```
DATABASE_URL=postgresql://user:password@localhost:5432/cukee_db
```

### 4. 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API 문서: http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health

## API 엔드포인트

### 인증 (Authentication)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/api/v1/auth/signup` | 회원가입 | ❌ |
| POST | `/api/v1/auth/login` | 로그인 | ❌ |
| POST | `/api/v1/auth/logout` | 로그아웃 | ✅ |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 | ✅ |

### 사용자 (Users)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/api/v1/users/me` | 내 정보 조회 | ✅ |
| PUT | `/api/v1/users/me` | 닉네임 수정 | ✅ |
| DELETE | `/api/v1/users/me` | 회원 탈퇴 | ✅ |

### AI (AI 전시회 생성 - Mock)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/api/v1/ai/generate` | AI 전시회 생성 | ✅ |

### 전시회 (Exhibitions - Mock)

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/api/v1/exhibitions` | 전시회 목록 조회 (11개 티켓) | ❌ (선택) |
| GET | `/api/v1/exhibitions/{id}` | 전시회 상세 조회 | ❌ (선택) |

## HttpOnly Cookie 인증 방식

### 특징
- ✅ XSS 공격 방지 (JavaScript로 쿠키 접근 불가)
- ✅ 자동 세션 관리 (브라우저가 쿠키를 자동으로 전송)
- ✅ CSRF 방어 가능 (SameSite 설정)

### 환경별 Cookie 설정

**개발 환경 (HTTP)**
```
Set-Cookie: session=<uuid>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

**배포 환경 (HTTPS)**
```
Set-Cookie: session=<uuid>; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800
```

### 프론트엔드 설정 필수

```typescript
// Axios
axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // 필수!
});

// Fetch
fetch(url, {
  credentials: 'include',  // 필수!
});
```

## CORS 설정

`ALLOWED_ORIGINS` 환경 변수에 허용할 출처를 쉼표로 구분하여 입력하세요:

```
ALLOWED_ORIGINS=http://localhost:3000,https://cukee.com,chrome-extension://<extension-id>
```

⚠️ **중요**: `withCredentials: true` 사용 시 `*` 와일드카드 사용 불가! 반드시 명시적인 출처를 지정해야 합니다.

## 데이터베이스

### 개발 환경
- SQLite (`cukee_dev.db`) 사용
- 서버 실행 시 자동으로 테이블 생성

### 배포 환경
- PostgreSQL 사용 권장
- `DATABASE_URL` 환경 변수를 PostgreSQL URL로 변경

### 테이블 구조

**users** - 사용자 정보
- id, email, nickname, hashed_password
- social_provider, social_id
- agree_service, agree_privacy
- is_deleted, deleted_at
- created_at, updated_at

**sessions** - 세션 관리 (HttpOnly Cookie)
- id (UUID), user_id
- created_at, expires_at
- ip_address, user_agent
- is_revoked

## 개발 시 참고사항

### Mock API
- AI 전시회 생성 (`/api/v1/ai/generate`)
- 전시회 목록/상세 (`/api/v1/exhibitions`)

위 엔드포인트는 실제 데이터베이스 없이 Mock 데이터를 반환합니다.
실제 구현 시 데이터베이스 모델과 서비스를 추가해야 합니다.

### 네이밍 컨벤션
- **API Response**: camelCase (userId, createdAt)
- **Database**: snake_case (user_id, created_at)
- **변환**: Pydantic `alias` 자동 처리

### 보안
- 비밀번호는 bcrypt로 해싱
- 세션 ID는 UUID v4 사용
- 세션 만료 시간: 7일 (설정 가능)

## 배포 시 변경사항

1. `.env` 파일 수정:
   - `DATABASE_URL`: PostgreSQL URL로 변경
   - `SECRET_KEY`: 안전한 랜덤 키로 변경
   - `ENVIRONMENT`: `production`으로 변경
   - `ALLOWED_ORIGINS`: 실제 도메인 추가

2. HTTPS 필수 (Secure Cookie 사용)

3. API 문서 비활성화 (자동으로 처리됨)