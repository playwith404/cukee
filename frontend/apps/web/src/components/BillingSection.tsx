const BillingSection = () => {
  const billingHistory = [
    { date: '2026-01-01', amount: '₩ 154,000', status: 'Paid', color: 'bg-[#e2e8b6]' },
    { date: '2025-12-01', amount: '₩ 142,000', status: 'Paid', color: 'bg-[#e2e8b6]' },
    { date: '2025-11-01', amount: '₩ 168,000', status: 'Refund', color: 'bg-[#f2d8d8]' },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-12 py-10 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-center mb-10 uppercase tracking-tight">Billing & Plans</h2>

      {/* 1. 현재 플랜 및 결제 예정 금액 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 플랜 정보 */}
        <div className="relative group">
          <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
          <div className="relative p-8 bg-white border-[3px] border-black h-full flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Current Plan</p>
              <h3 className="text-3xl font-black text-blue-600 italic">Enterprise</h3>
            </div>
            <button className="mt-6 w-full py-2 bg-black text-white font-black text-xs hover:bg-gray-800 transition-colors">
              PLAN UPGRADE
            </button>
          </div>
        </div>

        {/* 결제 예정 금액 */}
        <div className="relative group">
          <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
          <div className="relative p-8 bg-[#ffee58] border-[3px] border-black h-full flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-700 mb-2">Estimated Total</p>
              <h3 className="text-3xl font-black">₩ 452,100</h3>
            </div>
            <p className="mt-6 text-[10px] font-bold text-gray-600 uppercase italic leading-tight">
              Next billing date: Feb 01, 2026
            </p>
          </div>
        </div>
      </div>

      {/* 2. 결제 내역 테이블 */}
      <div className="relative">
        <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black border-[3px] border-black"></div>
        <div className="relative bg-white border-[3px] border-black overflow-hidden">
          <div className="bg-black text-white p-4 font-black text-sm text-center uppercase tracking-widest">
            Payment History
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-[3px] border-black bg-gray-50">
                <th className="p-4 text-xs font-black border-r-[3px] border-black uppercase">Date</th>
                <th className="p-4 text-xs font-black border-r-[3px] border-black uppercase">Amount</th>
                <th className="p-4 text-xs font-black text-center uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {billingHistory.map((item, i) => (
                <tr key={i} className="border-b-[3px] border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 border-r-[3px] border-black font-mono">{item.date}</td>
                  <td className="p-4 border-r-[3px] border-black">{item.amount}</td>
                  <td className="p-4 text-center">
                    <span className={`${item.color} border-2 border-black px-3 py-1 text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 영수증 다운로드 안내 */}
      <p className="text-center text-[10px] font-bold text-gray-400">
        모든 결제 금액은 부가세(VAT) 포함 가격입니다. <br/>
        상세 영수증이 필요하시면 고객센터로 문의해 주세요.
      </p>
    </div>
  );
};

export default BillingSection;