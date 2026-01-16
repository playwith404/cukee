// src/pages/Dashboard.tsx
import { useNavigate } from 'react-router-dom';
const features = [
  { title: "API 사용량 분석", desc: "실시간 API 호출 통계 및 트렌드 분석", icon: "📊", path: "/usage" },
  { title: "빌링 관리", desc: "사용량 기반 비용 확인 및 청구서 관리", icon: "💳", path: "/billing" },
  { title: "API 키 관리", desc: "환경별 API 키 생성 및 관리", icon: "🔑", path: "/apikeys" },
  { title: "알림 설정", desc: "사용량, 에러율, 빌링 알림 커스터마이징", icon: "🔔", path: "/alerts" },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h2 className="text-3xl font-black mb-12 text-center">Console 기능</h2>
      <div className="space-y-6">
        {features.map((item, idx) => (
          <div 
            onClick={() => navigate(item.path)}
            key={idx}
            className="bg-white border-[3px] border-black p-6 flex items-center gap-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform cursor-pointer"
          >
            <div className="w-20 h-20 border-[3px] border-black flex items-center justify-center text-4xl bg-blue-50">
              {item.icon}
            </div>
            <div>
              <h3 className="text-2xl font-black mb-1">{item.title}</h3>
              <p className="text-gray-500 font-bold text-lg">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};