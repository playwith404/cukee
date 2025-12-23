// apps/web/app/exhibition/page.tsx
import { Suspense } from 'react';
import { ExhPageContainer } from '../components/ExhPageContainer';

// 주소창에 localhost:3000/exhibition 입력 시 이 컴포넌트가 렌더링됩니다.
export default function ExhibitionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExhPageContainer />
    </Suspense>
  );
}
