// src/App.tsx

import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { client } from './api/client';
import './index.css'

import Login from './pages/Login'
import { Dashboard } from './pages/Dashboard';
import { Usage } from './pages/Usage';
import { Billing } from './pages/Billing';
import { ApiKeys } from './pages/ApiKeys';
import { Alerts } from './pages/Alerts';

function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 로그인 성공 시 실행될 함수
  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    // 보안을 위해 로컬스토리지에 저장할 수도 있습니다.
    localStorage.setItem('kakao_token', token);
  };

  // 로그아웃 함수
  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('kakao_token');
  };
  
  return (
    <BrowserRouter>
      {!authToken ? (
        <Routes>
          {/* 로그인 안 됐을 땐 모든 경로가 Login 페이지를 보여줌 */}
          <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
      ) : (
        <div className="relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/apikeys" element={<ApiKeys />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          
          {/* 로그아웃 버튼 */}
          <button onClick={handleLogout} className="...">Logout</button>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;