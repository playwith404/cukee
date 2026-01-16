// src/pages/Login.tsx
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Access Token을 입력해주세요.");
    
    // 나중에 로직 다시 설정 
    setIsLoading(true);
    // 임시로 0.8초 뒤 통과
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(token); 
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <section className="bg-[#D1DDF3] border-b-2 border-black py-20 text-center">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter mb-4">CUKEE</h1>
        <p className="text-xs font-black tracking-[0.3em] uppercase text-black/50">엔터프라이즈 고객을 위한 API 관리 콘솔</p>
      </section>

      <section className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="p-10 border-2 border-black bg-white rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black mb-8 uppercase italic tracking-tight">액세스 토큰 입력</h3>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">액세스 토큰</label>
                <input 
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ck_xxxx..."
                  className="w-full border-2 border-black p-5 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-[#FFEB3B]/30 focus:border-[#FFEB3B] transition-all bg-gray-50/50"
                />
              </div>
              
              <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl uppercase italic hover:bg-[#FF5722] transition-all shadow-[0px_6px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none">
                {isLoading ? 'Verifying...' : 'Connect to Project →'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}