import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ConsoleLogin = () => {
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length > 5) { // 토큰 검증 로직 가상 적용
      // 우리 사이트의 콘솔 대시보드로 이동
      navigate('/console/dashboard');
    } else {
      alert("유효한 토큰을 입력해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-[#d1dbed] font-sans">
      <header className="bg-black text-white p-4 flex justify-between items-center px-10">
        <div className="font-black italic text-xl">playwith404</div>
        <button className="bg-[#f2d8d8] text-black px-4 py-1 rounded font-bold text-sm">서비스 바로가기</button>
      </header>
      
      <main className="flex flex-col items-center pt-20">
        <h1 className="text-8xl font-black mb-4">Console</h1>
        <p className="font-bold mb-12">엔터프라이즈 고객을 위한 API 관리 콘솔</p>
        
        <div className="bg-white border-4 border-black p-10 w-[450px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-center font-black text-xl mb-8">액세스 토큰 입력</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              className="w-full border-4 border-black p-3 outline-none" 
              placeholder="ck_xxxx..." 
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button className="w-full bg-[#ffee58] border-4 border-black py-3 font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              로그인
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ConsoleLogin;