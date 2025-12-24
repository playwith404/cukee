// apps/web/src/components/Providers.tsx

// 'use client'; ❌ Vite는 모든게 클라이언트이므로 삭제

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // ✅ Vite에서는 useState로 감싸지 않고 밖에서 const queryClient = ... 해도 되지만,
  // 기존 코드(useState)를 유지해도 전혀 문제 없습니다. 안전한 방식입니다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}