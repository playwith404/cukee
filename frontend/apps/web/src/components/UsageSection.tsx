import { useEffect, useState } from 'react';
import './UsageSection.css';
import { fetchUsageSummary, type UsageSummary } from '../apis/console';

interface StatItem {
  label: string;
  value: string;
  color: string;
}

const UsageSection = () => {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const data = summary || {
    total_requests: 0,
    success_rate: 0,
    avg_latency_ms: 0,
    traffic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    top_endpoints: [],
  };

  const stats: StatItem[] = [
    { label: "Total Requests", value: data.total_requests.toLocaleString(), color: "#d1dbed" },
    { label: "Success Rate", value: `${data.success_rate.toFixed(2)}%`, color: "#f2d8d8" },
    { label: "Avg Latency", value: `${data.avg_latency_ms.toFixed(0)}ms`, color: "#e2e8b6" },
  ];

  const rawChartData = data.traffic?.length ? data.traffic : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const maxValue = Math.max(...rawChartData, 1);
  const chartData = rawChartData.map((value) => Math.round((value / maxValue) * 100));

  return (
    <div className="usage-section-container fade-in">
      <h2 className="section-title">API 사용량 분석</h2>
      {loading && <p>로딩 중...</p>}

      {/* 1. 통계 박스 그리드 */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card-wrapper">
            <div className="stat-card-shadow"></div>
            <div 
              className="stat-card-content" 
              style={{ backgroundColor: stat.color }}
            >
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. 트래픽 차트 영역 */}
      <div className="chart-outer-wrapper">
        <div className="chart-shadow"></div>
        <div className="chart-content">
          <p className="chart-title">Traffic (Last 24h)</p>
          <div className="bar-chart-container">
            {chartData.map((h, i) => (
              <div 
                key={i} 
                className="chart-bar"
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 최근 요청 로그 테이블 */}
      <div className="log-table-wrapper">
        <div className="log-table-shadow"></div>
        <div className="log-table-container">
          <table className="usage-log-table">
            <thead>
              <tr>
                <th className="th-method">Method</th>
                <th className="th-endpoint">Endpoint</th>
                <th className="th-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.top_endpoints || []).map((row, i) => (
                <tr key={`${row.endpoint}-${i}`}>
                  <td className="td-method">{row.method}</td>
                  <td className="td-endpoint">{row.endpoint}</td>
                  <td className="td-status text-center">
                    <span className="status-tag">{row.status}</span>
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
