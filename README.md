# tool name: 모노레포 (Turborepo + pnpm)

이 저장소는 웹 애플리케이션과 브라우저 익스텐션을 효율적으로 관리하기 위해 Turborepo & pnpm을 사용하여 구성된 모노레포입니다.

### 시작하기

프로젝트를 로컬 환경에 설치하고 실행하는 방법

### 1. 의존성 설치

루트 폴더에서 다음 명령어를 실행하여 모든 패키지의 의존성을 설치합니다.

pnpm install

### 2. 개발 서버 실행

모든 앱(웹 + 익스텐션)을 동시에 개발 모드로 실행합니다.

pnpm dev

### 3. 특정 앱 개발 모드 실행 (필터링)

특정 애플리케이션만 실행하여 자원을 절약할수 있습니다.

웹 앱 (web) 실행:

Bash
pnpm run dev --filter=web 
http://localhost:3000 에서 실행됩니다.

익스텐션 앱 (extension) 실행:

Bash
pnpm run dev --filter=extension
이 명령은 익스텐션의 빌드를 감시(watch)하고 코드가 변경될 때마다 자동 빌드합니다.
(익스텐션을 브라우저에 로드하는 방법은 브라우저 확장 로드 섹션 참고)

## Apps 및 Packages 구조 📂
이 모노레포에는 다음과 같은 주요 구성 요소가 포함되어 있습니다.

앱 (Applications)

apps/web	
메인 웹 애플리케이션입니다.	
기술스택: Next.js, React, TypeScript

apps/extension	
브라우저 익스텐션 애플리케이션입니다.	
기술스택: Vite, React, TypeScript
패키지 (Packages/Shared Libraries)

폴더 & 설명
@repo/ui	웹 앱과 익스텐션에서 공유하는 공통 React 컴포넌트 라이브러리
@repo/eslint-config	모노레포 전반에 사용되는 공통 ESLint 설정
@repo/typescript-config	모노레포 전반에 사용되는 공통 TypeScript 설정


특정 앱만 빌드하려면 필터를 사용합니다. (예: 익스텐션만 빌드)

Bash
pnpm run build --filter=extension
# 빌드 결과는 apps/extension/dist 폴더에 생성됩니다.
브라우저 확장 로드
apps/extension 폴더를 개발자 모드로 브라우저에 로드하는 방법입니다.

Chrome/Edge:

주소창에 chrome://extensions 또는 edge://extensions 입력.
개발자 모드에서, 압축 해제된 확장 로드를 클릭합니다.

apps/extension/dist 폴더를 선택합니다. (개발 모드 실행 중에는 apps/extension 폴더를 직접 선택할 수도 있습니다.)

## 유틸리티 및 도구 🛠️ 
이 프로젝트에는 다음 도구가 미리 설정되어 있습니다.

TypeScript (정적 타입 검사)

ESLint (코드 린팅)

Prettier (코드 포맷팅)

Vite (익스텐션 번들링)

