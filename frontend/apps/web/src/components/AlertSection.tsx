import { useState } from 'react';

const AlertSection = () => {
  const [settings, setSettings] = useState([
    { id: 1, title: '사용량 80% 도달 알림', desc: '월간 API 할당량의 80%를 소모하면 메일을 보냅니다.', active: true, color: 'bg-[#d1dbed]' },
    { id: 2, title: '에러율 급증 경고', desc: '최근 5분간 에러율이 5%를 초과할 경우 알림을 보냅니다.', active: false, color: 'bg-[#f2d8d8]' },
    { id: 3, title: '결제 실패 알림', desc: '등록된 카드의 결제가 실패할 경우 즉시 통보합니다.', active: true, color: 'bg-[#e2e8b6]' },
  ]);

  const toggleAlert = (id: number) => {
    setSettings(settings.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-12 py-10 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-center mb-10 uppercase">Notification Settings</h2>

      {/* 1. 이메일/슬랙 수신처 설정 */}
      <div className="relative group">
        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
        <div className="relative bg-white border-[3px] border-black p-8">
          <h3 className="text-lg font-black mb-6 italic underline decoration-[#ffee58] decoration-4 underline-offset-2">알림 수신 채널</h3>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase mb-2">Primary Email</p>
              <input 
                type="email" 
                placeholder="admin@cukee.world"
                className="w-full border-[3px] border-black p-3 font-bold text-sm outline-none focus:bg-yellow-50 transition-colors"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase mb-2">Slack Webhook URL</p>
              <input 
                type="text" 
                placeholder="https://hooks.slack.com/services/..."
                className="w-full border-[3px] border-black p-3 font-bold text-sm outline-none focus:bg-yellow-50 transition-colors font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 개별 알림 항목 리스트 */}
      <div className="space-y-6">
        {settings.map((item) => (
          <div key={item.id} className="relative group">
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black border-[3px] border-black"></div>
            <div className="relative bg-white border-[3px] border-black p-6 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 ${item.color} border-[3px] border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  🔔
                </div>
                <div>
                  <h4 className="text-md font-black">{item.title}</h4>
                  <p className="text-xs font-bold text-gray-500">{item.desc}</p>
                </div>
              </div>
              
              {/* 커스텀 토글 스위치 */}
              <button 
                onClick={() => toggleAlert(item.id)}
                className={`w-16 h-8 border-[3px] border-black relative transition-colors duration-200 ${item.active ? 'bg-[#ffee58]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 bottom-0.5 w-6 border-[2px] border-black bg-white transition-all duration-200 ${item.active ? 'left-8 shadow-[-2px_0px_0px_0px_rgba(0,0,0,1)]' : 'left-0.5 shadow-[2px_0px_0px_0px_rgba(0,0,0,1)]'}`}></div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 저장 버튼 */}
      <div className="flex justify-center pt-6">
        <button className="relative group">
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black border-[3px] border-black"></div>
          <button className="relative bg-black text-white border-[3px] border-black px-12 py-3 font-black text-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform">
            SAVE SETTINGS
          </button>
        </button>
      </div>
    </div>
  );
};

export default AlertSection;