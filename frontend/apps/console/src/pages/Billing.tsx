// src/pages/Billing.tsx

import { useNavigate } from 'react-router-dom';
import { ConsoleLayout } from '../components/ConsoleLayout';

export const Billing = () => {
  const navigate = useNavigate();

  return (
    <ConsoleLayout title="Billing & Cost">
      {/* 뒤로가기 버튼 - 디자인 통일성을 위해 추가 */}
      <button 
        onClick={() => navigate('/')}
        className="mb-8 border-2 border-black px-4 py-1 font-black uppercase hover:bg-black hover:text-white transition-all text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
      >
        ← Back to Dashboard
      </button>

      <div className="border-4 border-black p-8 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <p className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-1">Estimated Total</p>
            <div className="text-5xl md:text-6xl font-black italic tracking-tighter">₩142,800</div>
          </div>
          <button className="w-full md:w-auto bg-black text-white px-8 py-4 font-black uppercase hover:bg-[#FF5722] hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
            Pay Now
          </button>
        </div>

        <div className="space-y-6">
          <h4 className="font-black border-b-4 border-black pb-2 uppercase text-sm italic">Service Breakdown</h4>
          
          <div className="flex justify-between items-center py-2 border-b-2 border-black/5">
            <span className="font-bold text-lg uppercase">Object Storage</span>
            <span className="font-black text-xl">₩42,000</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b-2 border-black/5">
            <span className="font-bold text-lg uppercase">Compute Instances</span>
            <span className="font-black text-xl">₩100,800</span>
          </div>

          <div className="mt-8 p-4 bg-[#D1DDF3] border-2 border-black font-bold text-sm">
            💡 다음 결제 예정일은 <span className="underline">2026년 2월 1일</span>입니다.
          </div>
        </div>
      </div>
    </ConsoleLayout>
  );
};