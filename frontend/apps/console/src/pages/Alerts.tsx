import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsoleLayout } from '../components/ConsoleLayout';

export const Alerts = () => {
  const navigate = useNavigate();

  // 토글 상태 관리 예시
  const [settings, setSettings] = useState({
    billing: true,
    usage: false,
    error: true,
    security: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ConsoleLayout title="Alert Settings">
      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => navigate('/')}
        className="mb-8 border-2 border-black px-4 py-1 font-black uppercase hover:bg-black hover:text-white transition-all text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-3xl space-y-8">
        {/* 메인 안내 섹션 */}
        <div className="border-4 border-black bg-[#FFEB3B] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-black uppercase mb-2">Notification Channel</h3>
          <p className="font-bold text-sm">현재 <span className="underline decoration-2 text-red-600">admin@cukee.io</span> 메일로 모든 알림이 전송되도록 설정되어 있습니다.</p>
        </div>

        {/* 알림 설정 리스트 */}
        <div className="space-y-6">
          {[
            { id: 'billing', title: 'Billing Threshold', desc: '설정된 예산의 80% 초과 시 알림', color: 'bg-white' },
            { id: 'usage', title: 'Usage Quota', desc: 'API 할당량의 90% 도달 시 알림', color: 'bg-white' },
            { id: 'error', title: 'High Error Rate', desc: '5분 내 에러율 5% 초과 시 즉시 알림', color: 'bg-red-500 text-white' },
            { id: 'security', title: 'Security Alert', desc: '새로운 위치에서 API 키 로그인 발생 시', color: 'bg-white' },
          ].map((item) => (
            <div 
              key={item.id}
              className={`border-4 border-black p-6 flex justify-between items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${item.color}`}
            >
              <div>
                <h4 className="text-lg font-black uppercase italic">{item.title}</h4>
                <p className={`text-sm font-bold ${item.id === 'error' ? 'text-white/80' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
              
              {/* 브루탈리스트 스타일 토글 버튼 */}
              <button 
                onClick={() => toggle(item.id as keyof typeof settings)}
                className={`w-16 h-8 border-4 border-black transition-all relative ${settings[item.id as keyof typeof settings] ? 'bg-green-400' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0 w-6 h-full border-r-4 border-black bg-white transition-all ${settings[item.id as keyof typeof settings] ? 'right-0' : 'left-0'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* 설정 저장 버튼 */}
        <button className="w-full bg-black text-white py-5 font-black text-xl uppercase italic shadow-[8px_8px_0px_0px_rgba(255,87,34,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
          Save Settings
        </button>
      </div>
    </ConsoleLayout>
  );
};