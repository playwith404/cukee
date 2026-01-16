// src/pages/Usage.tsx
import React, { useEffect, useState } from 'react';
import { client } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { ConsoleLayout } from '../components/ConsoleLayout';

// 서버에서 내려올 데이터 타입 정의
interface MetricData {
  labels: string[];
  requests: number[];
  latency: number[];
}

export const Usage = () => {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // 실제 백엔드 엔드포인트 (Prometheus 쿼리 결과를 가공해서 주는 곳)
        const response = await client.get('/api/monitoring/usage-stats');
        setData(response.data);
      } catch (error) {
        console.error("데이터를 불러오지 못했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <ConsoleLayout title="Usage">
      {loading ? (
        <div className="text-2xl font-black animate-pulse uppercase">Fetching Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* API Requests 카드 */}
          <div className="p-8 border-2 border-black bg-white rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black text-gray-400 uppercase mb-4 tracking-widest">API Requests (24h)</h3>
            <div className="flex items-end gap-2 h-40">
              {data?.requests.map((val, i) => (
                <div 
                  key={i} 
                  style={{ height: `${(val / Math.max(...data.requests)) * 100}%` }}
                  className="flex-1 bg-black rounded-t-lg hover:bg-[#FF5722] transition-all cursor-help"
                  title={`${val} reqs`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-black text-gray-400">
              <span>{data?.labels[0]}</span>
              <span>{data?.labels[data.labels.length - 1]}</span>
            </div>
          </div>

          {/* Latency 카드 */}
          <div className="p-8 border-2 border-black bg-[#FFEB3B] rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black text-black/40 uppercase mb-4 tracking-widest">Avg Latency</h3>
            <div className="text-6xl font-black italic italic uppercase tracking-tighter">
              {data?.latency[data.latency.length - 1]}ms
            </div>
            <p className="mt-4 font-bold text-sm uppercase">Stable Connection ✅</p>
          </div>
        </div>
      )}
    </ConsoleLayout>
  );
};