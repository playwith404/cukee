
### 프로젝트 구조

```
cukee/
├── frontend/                # 프론트엔드 모노레포
│   ├── apps/
│   │   ├── web/            # Next.js 메인 애플리케이션
│   │   └── extension/      # 브라우저 확장 프로그램
│   └── packages/
│       ├── ui/             # 공유 UI 컴포넌트
│       ├── eslint-config/  # ESLint 설정
│       └── typescript-config/ # TypeScript 설정
├── backend/                # FastAPI 백엔드
├── database/               # 데이터베이스 설정
├── nginx/                  # Nginx 설정
├── certbot/                # SSL 인증서 관리
└── docker-compose.yml      # Docker 오케스트레이션
```

## 🐛 에러 해결 과정

### 1. TypeScript 타입 에러 (HomePageContainer.tsx)

**문제**
- `Ticket` 타입 import 오류
- `fetchTickets` API 함수 미정의

**해결**
- `src/apis/tickets.ts` 파일에서 `Ticket` 인터페이스와 `fetchTickets` 함수 정의
- API 응답 타입 명확하게 정의

```typescript
export interface Ticket {
  id: number;
  curatorName: string;
  characterImageUrl: string;
  curatorMessage: string;
}

export const fetchTickets = async (): Promise<{ data: Ticket[] }> => {
  const response = await axios.get(`${API_BASE_URL}/tickets`);
  return response.data;
};
```

### 2. TypeScript 타입 에러 (ExhPageContainer.tsx)

**문제**
- `AIExhibitionResponse`, `ExhibitionDetailResponse`, `Frame` 타입 import 경로 오류
- 상대 경로 불일치

**해결**
- 정확한 import 경로 수정
- `src/apis/ai.ts`와 `src/apis/exhibition.ts`에서 타입 정의

```typescript
// 수정된 import
import { AIExhibitionResponse } from "../../src/apis/ai";
import { ExhibitionDetailResponse } from '../../src/apis/exhibition';
import { Frame } from './exhibition/Gallery';
```

### 3. Next.js Suspense Boundary 에러

**문제**
- `useSearchParams()` 사용 시 Suspense boundary 필요
- 에러: `useSearchParams() should be wrapped in a suspense boundary`

**해결**
- `app/exhibition/page.tsx`를 Suspense boundary로 래핑
- 서버 컴포넌트와 클라이언트 컴포넌트 분리

```tsx
// app/exhibition/page.tsx
import { Suspense } from 'react';
import { ExhPageContainer } from '../components/ExhPageContainer';

export default function ExhibitionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExhPageContainer />
    </Suspense>
  );
}
```

### 4. next.config.js 환경 변수 참조 오류

**문제**
- `INTERNAL_API_URL` 변수가 정의되지 않음
- Rewrite 설정에서 참조 실패

**해결**
- 환경 변수를 프로세스 환경에서 가져오도록 수정
- 기본값 설정으로 안정성 향상

```javascript
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://backend:8000';

async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${INTERNAL_API_URL}/api/:path`,
    },
  ];
}
```

### 5. 이미지 로딩 설정 (개발/배포 환경 대응)

**문제**
- Next.js Image 컴포넌트에서 외부 이미지 로딩 시 보안 제한
- 개발 환경(localhost)과 배포 환경(cloudkakao.store) 모두에서 이미지 접근 필요

**해결**
- `next.config.js`의 `remotePatterns`에 두 환경 모두 추가
- 개발 환경: HTTP + localhost:8000
- 배포 환경: HTTPS + cloudkakao.store

```javascript
images: {
  remotePatterns: [
    // 개발 환경: localhost
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '8000',
      pathname: '/**',
    },
    // 배포 환경: production domain
    {
      protocol: 'https',
      hostname: 'cloudkakao.store',
      pathname: '/**',
    },
  ],
}
```

**효과**
- Next.js Image 컴포넌트로 안전하게 외부 이미지 로딩
- 환경 자동 감지로 별도 설정 불필요

## 🔧 주요 수정 사항

### 1. Docker 설정 최적화

**frontend/Dockerfile**
- Node.js 20으로 업그레이드
- Multi-stage build 최적화 (base, builder, installer, runner)
- Turborepo를 활용한 모노레포 빌드 전략
- Standalone 모드로 최소 런타임 이미지 생성
- 빌드 타임 환경 변수 주입 (ARG/ENV)

**docker-compose.yml**
- 4개 서비스 구성: frontend, backend, nginx, certbot
- 서비스 간 의존성 관리 (depends_on)
- 환경 변수를 통한 API URL 주입
- SSL 인증서 자동 갱신 설정

### 2. API 통합 개선

**새로 생성된 파일**
- `frontend/apps/web/src/apis/tickets.ts` - 티켓 API
- `frontend/apps/web/src/apis/ai.ts` - AI 전시회 생성 API
- `frontend/apps/web/src/apis/exhibition.ts` - 전시회 관리 API

**특징**
- Axios 기반 HTTP 클라이언트
- TypeScript 타입 안전성 보장
- 환경 변수를 통한 API 엔드포인트 관리

### 3. 컴포넌트 구조 개선

**HomePageContainer.tsx**
- 티켓 목록 API 연동
- 로딩/에러 상태 관리
- 캐러셀을 통한 티켓 네비게이션
- URL 기반 라우팅 (/exhibition?ticket=ID)

**ExhPageContainer.tsx**
- URL 파라미터에서 티켓 ID 추출
- AI 생성 전시회 데이터 반영
- 갤러리 3D 뷰 구현
- 큐레이터 정보 동적 로딩

## 🚀 배포 및 실행

### 로컬 개발 환경

```bash
# 프론트엔드 개발 서버
cd frontend
pnpm install
pnpm dev

# 백엔드 개발 서버
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker 기반 배포

```bash
# 전체 서비스 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 환경 변수 설정

**frontend/.env.production**
```
NEXT_PUBLIC_API_URL=https://cloudkakao.store/api
```

**backend/.env**
```
DATABASE_URL=postgresql://user:password@database:5432/cukee
SECRET_KEY=your-secret-key
```


## 🔍 트러블슈팅 가이드

### 빌드 실패 시

1. Node.js 버전 확인 (20+ 필요)
2. 의존성 재설치: `pnpm install --frozen-lockfile`
3. 캐시 삭제 후 재빌드: `docker-compose build --no-cache`

### API 통신 오류 시

1. 환경 변수 확인 (`NEXT_PUBLIC_API_URL`)
2. 백엔드 서비스 상태 확인: `docker-compose ps`
3. Nginx 로그 확인: `docker-compose logs nginx`
