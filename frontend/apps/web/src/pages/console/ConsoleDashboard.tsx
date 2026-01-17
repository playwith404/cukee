import { useState, type ReactNode } from 'react';
import UsageSection from '../../components/UsageSection'; 
import ApiKeySection from '../../components/ApiKeySection';
import BillingSection from '../../components/BillingSection';
import AlertSection from '../../components/AlertSection';
import './ConsoleDashboard.css';

// 탭 타입 정의
type TabType = 'main' | 'usage' | 'billing' | 'keys' | 'alerts';

interface MenuItem {
  id: TabType;
  title: string;
  desc: string;
  icon: string;
}

const ConsoleDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('main');

  const menuItems: MenuItem[] = [
    { id: 'usage', title: "Usage", desc: "실시간 API 호출 통계 및 트렌드 분석을 제공합니다.", icon: "📊" },
    { id: 'billing', title: "Billing", desc: "사용량 기반 비용 확인 및 청구서 관리를 지원합니다.", icon: "💳" },
    { id: 'keys', title: "API Keys", desc: "환경별 API 키 생성 및 보안 관리를 수행합니다.", icon: "🔑" },
    { id: 'alerts', title: "Alerts", desc: "사용량, 에러율, 빌링 알림을 커스터마이징 하세요.", icon: "🔔" },
  ];

  const renderSection = (): ReactNode => {
    switch (activeTab) {
      case 'usage': return <UsageSection />;
      case 'billing': return <BillingSection />;
      case 'keys': return <ApiKeySection />;
      case 'alerts': return <AlertSection />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-container">
      {activeTab === 'main' ? (
        <div className="main-view fade-in">
          <header className="dashboard-header">
            <h1 className="dashboard-title">Console</h1>
            <p className="dashboard-subtitle">Enterprise API Management System</p>
          </header>
          
          <div className="menu-list">
            {menuItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo(0, 0);
                }}
                className="menu-card"
              >
                <div className="card-content">
                  <span className="card-icon">{item.icon}</span>
                  <div className="card-text">
                    <h3 className="card-heading">{item.title}</h3>
                    <p className="card-desc">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="detail-view fade-in">
          <nav className="detail-nav">
            <button 
              onClick={() => setActiveTab('main')}
              className="back-button"
            >
              ← {activeTab} Overview
            </button>
            <span className="page-id">Page ID: 00{activeTab.length}</span>
          </nav>

          <div className="section-content">
             {renderSection()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleDashboard;