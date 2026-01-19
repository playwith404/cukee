import './BillingSection.css';

interface BillingItem {
  date: string;
  amount: string;
  status: string;
  color: string;
}

const BillingSection = () => {
  const billingHistory: BillingItem[] = [
    { date: '2026-01-01', amount: '₩ 154,000', status: 'Paid', color: '#e2e8b6' },
    { date: '2025-12-01', amount: '₩ 142,000', status: 'Paid', color: '#e2e8b6' },
    { date: '2025-11-01', amount: '₩ 168,000', status: 'Refund', color: '#f2d8d8' },
  ];

  return (
    <div className="billing-section-container fade-in">
      <h2 className="section-title">Billing & Plans</h2>

      {/* 1. 상단 카드 그리드 */}
      <div className="billing-grid">
        {/* 플랜 정보 */}
        <div className="billing-card-wrapper">
          <div className="card-shadow"></div>
          <div className="billing-card-content white">
            <div className="card-info">
              <p className="card-label">Current Plan</p>
              <h3 className="plan-name">Enterprise</h3>
            </div>
            <button className="upgrade-btn">PLAN UPGRADE</button>
          </div>
        </div>

        {/* 결제 예정 금액 */}
        <div className="billing-card-wrapper">
          <div className="card-shadow"></div>
          <div className="billing-card-content yellow">
            <div className="card-info">
              <p className="card-label dark">Estimated Total</p>
              <h3 className="estimated-amount">₩ 452,100</h3>
            </div>
            <p className="next-billing-date">
              Next billing date: Feb 01, 2026
            </p>
          </div>
        </div>
      </div>

      {/* 2. 결제 내역 테이블 */}
      <div className="table-wrapper">
        <div className="table-shadow"></div>
        <div className="table-container">
          <div className="table-header-banner">
            Payment History
          </div>
          <table className="billing-table">
            <thead>
              <tr>
                <th className="th-date">Date</th>
                <th className="th-amount">Amount</th>
                <th className="th-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((item, i) => (
                <tr key={i}>
                  <td className="td-date">{item.date}</td>
                  <td className="td-amount">{item.amount}</td>
                  <td className="td-status">
                    <span 
                      className="status-pill"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 하단 안내문 */}
      <footer className="billing-footer">
        모든 결제 금액은 부가세(VAT) 포함 가격입니다. <br/>
        상세 영수증이 필요하시면 고객센터로 문의해 주세요.
      </footer>
    </div>
  );
};

export default BillingSection;