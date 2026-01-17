import { useState } from 'react';
import './ApiKeySection.css';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  date: string;
}

const ApiKeySection = () => {
  // 샘플 데이터
  const [keys] = useState<ApiKey[]>([
    { id: 1, name: 'Production Key', key: 'ck_live_51Pz...8x92', date: '2026.01.17' },
    { id: 2, name: 'Development Key', key: 'ck_test_92a...3v11', date: '2026.01.10' },
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('API 키가 복사되었습니다.');
  };

  return (
    <div className="api-section-container fade-in">
      {/* 1. 상단 헤더 및 키 생성 버튼 */}
      <div className="api-header">
        <div>
          <h2 className="api-title">API 키 관리</h2>
          <p className="api-subtitle">서비스 연동을 위한 인증 키를 관리하세요.</p>
        </div>
        <div className="create-button-wrapper">
          <div className="button-shadow"></div>
          <button className="create-button">
            + 새 키 생성
          </button>
        </div>
      </div>

      {/* 2. API 키 리스트 */}
      <div className="api-list">
        {keys.map((item) => (
          <div key={item.id} className="key-card-wrapper">
            <div className="key-card-shadow"></div>
            <div className="key-card-content">
              <div className="key-info">
                <div className="key-name-row">
                  <span className="key-name">{item.name}</span>
                  <span className="status-badge">Active</span>
                </div>
                <div className="key-value-row">
                  <code className="key-code">{item.key}</code>
                  <button 
                    onClick={() => copyToClipboard(item.key)}
                    className="copy-text-btn"
                  >
                    COPY
                  </button>
                </div>
                <p className="key-date">Created at: {item.date}</p>
              </div>

              <button className="delete-btn">
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 주의사항 박스 */}
      <div className="warning-box-wrapper">
        <div className="warning-box-shadow"></div>
        <div className="warning-box-content">
          <h4 className="warning-title">⚠️ 보안 주의사항</h4>
          <ul className="warning-list">
            <li>API 키는 외부로 노출되지 않도록 주의하십시오.</li>
            <li>키가 노출된 경우 즉시 삭제하고 새 키를 발급받으세요.</li>
            <li>클라이언트 사이드(JS) 코드에 직접 키를 포함하지 마십시오.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySection;