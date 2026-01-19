const UsageSection = () => {
  const stats = [
    { label: "Total Requests", value: "1,240,842", color: "bg-[#d1dbed]" },
    { label: "Success Rate", value: "99.98%", color: "bg-[#f2d8d8]" },
    { label: "Avg Latency", value: "24ms", color: "bg-[#e2e8b6]" },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-12 py-10">
      {/* 1. 상단 타이틀: 중앙 정렬 */}
      <h2 className="text-2xl font-black text-center mb-10">API 사용량 분석</h2>

      {/* 2. 통계 박스: 메인 메뉴와 동일한 더블 박스 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="relative group">
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black border-[3px] border-black"></div>
            <div className={`relative p-6 ${stat.color} border-[3px] border-black text-center`}>
              <p className="text-xs font-black uppercase mb-2">{stat.label}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 차트 영역: 각진 테두리와 단순한 막대 */}
      <div className="relative">
        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
        <div className="relative p-8 bg-white border-[3px] border-black">
          <p className="text-sm font-black mb-8 italic">Traffic (Last 24h)</p>
          <div className="flex items-end justify-between h-48 gap-2">
            {[30, 60, 40, 80, 50, 90, 70, 40, 100, 60, 40, 85].map((h, i) => (
              <div 
                key={i} 
                style={{ height: `${h}%` }} 
                className="flex-1 bg-black border-[1px] border-black"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 로그 테이블: 선 중심의 깔끔한 디자인 */}
      <div className="relative">
        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
        <div className="relative bg-white border-[3px] border-black overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-[3px] border-black bg-gray-50">
                <th className="p-3 text-sm font-black text-left border-r-[3px] border-black">Method</th>
                <th className="p-3 text-sm font-black text-left border-r-[3px] border-black">Endpoint</th>
                <th className="p-3 text-sm font-black text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {[1, 2, 3].map((v) => (
                <tr key={v} className="border-b-[3px] border-black last:border-b-0">
                  <td className="p-3 border-r-[3px] border-black italic">POST</td>
                  <td className="p-3 border-r-[3px] border-black font-mono">/v1/generate</td>
                  <td className="p-3 text-center">
                    <span className="bg-[#e2e8b6] border-2 border-black px-2 py-0.5 text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      200 OK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsageSection;