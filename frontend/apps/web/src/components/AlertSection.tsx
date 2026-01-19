import { useState } from 'react';
import './AlertSection.css';

interface AlertSetting {
  id: number;
  title: string;
  desc: string;
  active: boolean;
  color: string;
}

const AlertSection = () => {
  const [settings, setSettings] = useState<AlertSetting[]>([
    { id: 1, title: '사용량 80ß% 도달 알림', desc: '월간 API 할당량의 80%를 소모하면 메일을 보냅니다.', active: true, color: '#d1dbed' },
    { id: 2, title: '에러율 급증 경고', desc: '최근 5분간 에러율이 5%를 초과할 경우 알림을 보냅니다.', active: false, color: '#f2d8d8' },
    { id: 3, title: '결제 실패 알림', desc: '등록된 카드의 결제가 실패할 경우 즉시 통보합니다.', active: true, color: '#e2e8b6' },
  ]);

  const toggleAlert = (id: number) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="alert-section-container fade-in">
      <h2 className="section-title">Notification Settings</h2>

      {/* 1. 수신처 설정 카드 */}
      <div className="alert-card-wrapper">
        <div className="card-bg-offset"></div>
        <div className="alert-card-content main-settings">
          <h3 className="channel-title">알림 수신 채널</h3>
          <div className="input-group">
            <div className="field">
              <label className="field-label">Primary Email</label>
              <input 
                type="email" 
                placeholder="admin@cukee.world"
                className="neobrutal-input"
              />
            </div>
            <div className="field">
              <label className="field-label">Slack Webhook URL</label>
              <input 
                type="text" 
                placeholder="https://hooks.slack.com/services/..."
                className="neobrutal-input mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 개별 알림 항목 리스트 */}
      <div className="alert-list">
        {settings.map((item) => (
          <div key={item.id} className="alert-card-wrapper small">
            <div className="card-bg-offset"></div>
            <div className="alert-card-content list-item">
              <div className="item-info">
                <div 
                  className="item-icon-box" 
                  style={{ backgroundColor: item.color }}
                >
                  🔔
                </div>
                <div className="text-box">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-desc">{item.desc}</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => toggleAlert(item.id)}
                className={`neobrutal-toggle ${item.active ? 'active' : ''}`}
              >
                <div className="toggle-handle"></div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 저장 버튼 */}
      <div className="save-button-wrapper">
        <div className="button-bg-offset"></div>
        <button className="neobrutal-save-button">
          SAVE SETTINGS
        </button>
      </div>
    </div>
  );
};

export default AlertSection;