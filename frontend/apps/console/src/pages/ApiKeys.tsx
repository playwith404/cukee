// src/pages/ApiKeys.tsx

import { useNavigate } from 'react-router-dom';
import { ConsoleLayout } from '../components/ConsoleLayout';

export const ApiKeys = () => {
  // Hook 규칙: 함수 몸체 안에서 호출
  const navigate = useNavigate();

  return (
    <ConsoleLayout title="API Key Management">
      {/* 뒤로가기 버튼 */}
      <button 
        onClick={() => navigate('/')}
        className="mb-8 border-2 border-black px-4 py-1 font-black uppercase hover:bg-black hover:text-white transition-all text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
      >
        ← Back to Dashboard
      </button>

      <div className="space-y-6">
        {/* 새 키 생성 버튼 */}
        <button className="bg-[#FFEB3B] border-4 border-black px-6 py-4 font-black text-lg uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-yellow-400">
          + Create New Key
        </button>

        {/* API 키 테이블 */}
        <div className="border-4 border-black bg-white overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black text-white uppercase text-xs tracking-widest font-black">
              <tr>
                <th className="p-5 border-r-2 border-white/20">Key Name</th>
                <th className="p-5 border-r-2 border-white/20">Key ID</th>
                <th className="p-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="font-bold text-sm">
              <tr className="border-b-4 border-black hover:bg-slate-50 transition-colors">
                <td className="p-5 border-r-4 border-black italic">PROD_KEY_01</td>
                <td className="p-5 border-r-4 border-black font-mono text-gray-600">ck_live_****a92j</td>
                <td className="p-5 text-center">
                  <button className="text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 border-2 border-transparent hover:border-black transition-all uppercase font-black italic">
                    Revoke
                  </button>
                </td>
              </tr>
              {/* 추가 데이터가 들어올 자리 */}
              <tr className="border-b-4 border-black hover:bg-slate-50 transition-colors">
                <td className="p-5 border-r-4 border-black italic">TEST_SANDBOX_KEY</td>
                <td className="p-5 border-r-4 border-black font-mono text-gray-600">ck_test_****8f32</td>
                <td className="p-5 text-center">
                  <button className="text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 border-2 border-transparent hover:border-black transition-all uppercase font-black italic">
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 보안 안내문 */}
        <div className="mt-10 p-6 border-4 border-black bg-[#D1DDF3] font-bold">
          <p className="text-sm">
            ⚠️ <span className="underline decoration-2">Security Warning</span>: 
            API 키가 유출되지 않도록 주의하세요. Secret Key는 최초 생성 시에만 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </ConsoleLayout>
  );
};