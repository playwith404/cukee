import { useState } from 'react';

import UsageSection from '../../components/UsageSection'; 
import ApiKeySection from '../../components/ApiKeySection';
import BillingSection from '../../components/BillingSection';
import AlertSection from '../../components/AlertSection';

const ConsoleDashboard = () => {
  const [activeTab, setActiveTab] = useState<'main' | 'usage' | 'billing' | 'keys' | 'alerts'>('main');

  const menuItems = [
    { id: 'usage', title: "Usage", desc: "실시간 API 호출 통계 및 트렌드 분석을 제공합니다.", icon: "📊" },
    { id: 'billing', title: "Billing", desc: "사용량 기반 비용 확인 및 청구서 관리를 지원합니다.", icon: "💳" },
    { id: 'keys', title: "API Keys", desc: "환경별 API 키 생성 및 보안 관리를 수행합니다.", icon: "🔑" },
    { id: 'alerts', title: "Alerts", desc: "사용량, 에러율, 빌링 알림을 커스터마이징 하세요.", icon: "🔔" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black font-sans px-6 py-40 flex flex-col items-center">
      
      {activeTab === 'main' ? (
        <div className="w-full max-w-[650px] animate-in fade-in duration-700">
          
          {/* 헤더 섹션: 아래 카드와의 간격을 mb-32로 대폭 확장 */}
          <header className="mb-32 border-l-[10px] border-black pl-10 py-4">
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-6">Console</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] leading-loose">
              Enterprise API Management System
            </p>
          </header>
          
          {/* 카드 리스트: space-y-20을 적용하여 카드끼리 절대 겹치지 않게 설정 */}
          <div className="flex flex-col space-y-20">
            {menuItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  window.scrollTo(0, 0);
                }}
                className="group relative bg-white border-[4px] border-black p-12 cursor-pointer shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all"
              >
                <div className="flex items-start gap-12">
                  <span className="text-5xl shrink-0">{item.icon}</span>
                  <div className="flex flex-col">
                    {/* 제목과 설명 사이 mb-4 추가 및 줄 간격(leading-relaxed) 확보 */}
                    <h3 className="text-2xl font-black uppercase mb-4 tracking-tight group-hover:underline decoration-4">
                      {item.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-[350px]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 상세 페이지: 상단 내비게이션과 콘텐츠 간격 mb-40 */
        <div className="w-full max-w-[1000px] animate-in fade-in duration-500">
          <nav className="mb-40 flex justify-between items-end border-b-8 border-black pb-8">
            <button 
              onClick={() => setActiveTab('main')}
              className="text-xl font-black uppercase tracking-tighter hover:italic transition-all"
            >
              ← {activeTab} Overview
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page ID: 00{activeTab.length}</span>
          </nav>

          {/* 내부 섹션 간 여백 확보를 위해 mb-40 적용 */}
          <div className="mb-40">
             {activeTab === 'usage' && <UsageSection />}
             {activeTab === 'billing' && <BillingSection />}
             {activeTab === 'keys' && <ApiKeySection />}
             {activeTab === 'alerts' && <AlertSection />}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleDashboard;