// apps/web-new/src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// ❌ 제거: import { QueryClient, QueryClientProvider } ... 
import App from './App.tsx'
import Providers from './components/Providers.tsx' // ✅ 추가: 만든 파일 임포트
import './styles/globals.css'

// ❌ 제거: const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 👇 여기서 Providers로 감싸줍니다 */}
    <Providers>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>,
)