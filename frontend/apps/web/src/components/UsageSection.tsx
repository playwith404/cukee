import './UsageSection.css';

interface StatItem {
  label: string;
  value: string;
  color: string;
}

const UsageSection = () => {
  const stats: StatItem[] = [
    { label: "Total Requests", value: "1,240,842", color: "#d1dbed" },
    { label: "Success Rate", value: "99.98%", color: "#f2d8d8" },
    { label: "Avg Latency", value: "24ms", color: "#e2e8b6" },
  ];

  const chartData = [30, 60, 40, 80, 50, 90, 70, 40, 100, 60, 40, 85];

  return (
    <div className="usage-section-container fade-in">
      <h2 className="section-title">API 사용량 분석</h2>

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
              {[1, 2, 3].map((v) => (
                <tr key={v}>
                  <td className="td-method">POST</td>
                  <td className="td-endpoint">/v1/generate</td>
                  <td className="td-status text-center">
                    <span className="status-tag">200 OK</span>
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