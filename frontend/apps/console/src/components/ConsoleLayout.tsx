// src/components/ConsoleLayout.tsx

import { useNavigate, useLocation } from 'react-router-dom';

interface ConsoleLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const ConsoleLayout = ({ title, children }: ConsoleLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation(); // 현재 URL 경로를 가져옴

  // 메뉴 리스트 정의
  const menus = [
    { name: "Dashboard", path: "/" },
    { name: "Usage", path: "/usage" },
    { name: "Billing", path: "/billing" },
    { name: "API Keys", path: "/apikeys" },
    { name: "Alerts", path: "/alerts" },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* 사이드바 */}
      <aside className="w-64 border-r-4 border-black p-6 hidden md:block sticky top-0 h-screen">
        <div 
          onClick={() => navigate('/')} 
          className="text-4xl font-black italic mb-12 cursor-pointer hover:text-[#FF5722]"
        >
          CUKEE
        </div>
        
        <nav className="space-y-4">
          {menus.map((menu) => {
            // 현재 경로와 메뉴의 경로가 일치하는지 확인
            const isActive = location.pathname === menu.path;
            
            return (
              <div 
                key={menu.name} 
                onClick={() => navigate(menu.path)}
                className={`
                  p-3 border-4 border-black font-black cursor-pointer uppercase transition-all
                  ${isActive 
                    ? 'bg-[#FFEB3B] translate-x-1 translate-y-1 shadow-none' // 활성화 상태
                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#D1DDF3]' // 비활성 상태
                  }
                `}
              >
                {menu.name}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <header className="border-b-4 border-black p-8 bg-[#D1DDF3]">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">{title}</h1>
        </header>
        <div className="p-10">{children}</div>
      </main>
    </div>
  );
};