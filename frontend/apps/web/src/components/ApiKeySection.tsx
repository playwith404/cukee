import { useState } from 'react';

const ApiKeySection = () => {
  // 샘플 데이터 (나중에 DB 연동)
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production Key', key: 'ck_live_51Pz...8x92', date: '2026.01.17' },
    { id: 2, name: 'Development Key', key: 'ck_test_92a...3v11', date: '2026.01.10' },
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('API 키가 복사되었습니다.');
  };

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-12 py-10 animate-in fade-in duration-500">
      {/* 1. 상단 헤더 및 키 생성 버튼 */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-black mb-1">API 키 관리</h2>
          <p className="text-sm font-bold text-gray-400">서비스 연동을 위한 인증 키를 관리하세요.</p>
        </div>
        <button className="relative group">
          <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black border-[3px] border-black"></div>
          <div className="relative bg-[#ffee58] border-[3px] border-black px-4 py-2 font-black text-sm hover:-translate-y-0.5 transition-transform">
            + 새 키 생성
          </div>
        </button>
      </div>

      {/* 2. API 키 리스트 */}
      <div className="space-y-8">
        {keys.map((item) => (
          <div key={item.id} className="relative group">
            {/* 그림자 박스 */}
            <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
            
            {/* 메인 콘텐츠 박스 */}
            <div className="relative bg-white border-[3px] border-black p-6 flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black">{item.name}</span>
                  <span className="bg-gray-100 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-50 border-[2px] border-black px-3 py-1 font-mono text-xs font-bold">
                    {item.key}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(item.key)}
                    className="text-[10px] font-black underline hover:text-blue-600"
                  >
                    COPY
                  </button>
                </div>
                <p className="text-[10px] font-bold text-gray-400 italic">Created at: {item.date}</p>
              </div>

              {/* 삭제 버튼 */}
              <button className="bg-[#f2d8d8] border-[3px] border-black p-2 hover:bg-red-200 transition-colors">
                <span className="text-xs font-black">DELETE</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 주의사항 박스 */}
      <div className="relative">
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black border-[3px] border-black opacity-10"></div>
        <div className="relative border-[3px] border-black border-dashed p-6 bg-gray-50">
          <h4 className="font-black text-sm mb-2 text-red-600">⚠️ 보안 주의사항</h4>
          <ul className="text-xs font-bold text-gray-500 space-y-1 list-disc list-inside">
            <li>API 키는 외부로 노출되지 않도록 주의하십시오.</li>
            <li>키가 노출된 경우 즉시 삭제하고 새 키를 발급받으세요.</li>
            <li>클라이언트 사이드(JS) 코드에 직접 키를 포함하지 마십시오.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySection;