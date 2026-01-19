import { useEffect, useState } from 'react';
import './BillingSection.css';
import { fetchBillingSummary, type BillingSummary } from '../apis/console';

interface BillingItem {
  date: string;
  amount: string;
  status: string;
  color: string;
}

const BillingSection = () => {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (value: number) => `₩ ${value.toLocaleString()}`;

  const data = summary || {
    total_30d: 0,
    history: [],
    next_billing_date: '-',
  };

  const billingHistory: BillingItem[] = (data.history || []).map((item) => ({
    date: item.date,
    amount: formatCurrency(item.amount),
    status: item.status,
    color: item.status === 'Refund' ? '#f2d8d8' : '#e2e8b6',
  }));

  return (
    <div className="billing-section-container fade-in">
      <h2 className="section-title">Billing & Plans</h2>
      {loading && <p>로딩 중...</p>}

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
              <h3 className="estimated-amount">{formatCurrency(data.total_30d)}</h3>
            </div>
            <p className="next-billing-date">
              Next billing date: {data.next_billing_date}
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
