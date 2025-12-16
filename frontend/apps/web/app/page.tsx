// apps/web/app/page.tsx

import { HomePageContainer } from './components/HomePageContainer';

// 이 파일은 기본적으로 서버 컴포넌트입니다.
export default function HomePage() {
  // 클라이언트 컴포넌트를 import하여 렌더링만 합니다.
  return <HomePageContainer />;
}