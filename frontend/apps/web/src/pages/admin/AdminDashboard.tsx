import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import {
  checkAdminAuth,
  fetchConsoleTokens,
  createConsoleToken,
  revokeConsoleToken,
  fetchApiKeys,
  createApiKey,
  revokeApiKey,
  type AdminConsoleToken,
  type AdminApiKey,
} from '../../apis/admin';

const AdminDashboard = () => {
  const [authReady, setAuthReady] = useState(false);
  const [consoleTokens, setConsoleTokens] = useState<AdminConsoleToken[]>([]);
  const [apiKeys, setApiKeys] = useState<AdminApiKey[]>([]);
  const [newConsoleName, setNewConsoleName] = useState('');
  const [newApiName, setNewApiName] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState<number | ''>('');
  const navigate = useNavigate();

  const loadData = async () => {
    const [tokens, keys] = await Promise.all([
      fetchConsoleTokens(),
      fetchApiKeys(),
    ]);
    setConsoleTokens(tokens);
    setApiKeys(keys);
  };

  useEffect(() => {
    checkAdminAuth()
      .then(() => setAuthReady(true))
      .catch(() => navigate('/admin'));
  }, [navigate]);

  useEffect(() => {
    if (authReady) {
      loadData().catch(console.error);
    }
  }, [authReady]);

  const handleCreateConsoleToken = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await createConsoleToken(newConsoleName || undefined);
      alert(`콘솔 토큰: ${result.token}\nAPI 키: ${result.api_key}`);
      setNewConsoleName('');
      await loadData();
    } catch (error) {
      alert('콘솔 토큰 생성에 실패했습니다.');
    }
  };

  const handleCreateApiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTokenId) {
      alert('연결할 콘솔 토큰을 선택해주세요.');
      return;
    }
    try {
      const result = await createApiKey(Number(selectedTokenId), newApiName || undefined);
      alert(`API 키가 생성되었습니다: ${result.key}`);
      setNewApiName('');
      await loadData();
    } catch (error) {
      alert('API 키 생성에 실패했습니다.');
    }
  };

  const handleRevokeConsoleToken = async (tokenId: number) => {
    if (!confirm('콘솔 토큰을 비활성화할까요?')) return;
    await revokeConsoleToken(tokenId);
    await loadData();
  };

  const handleRevokeApiKey = async (keyId: number) => {
    if (!confirm('API 키를 비활성화할까요?')) return;
    await revokeApiKey(keyId);
    await loadData();
  };

  if (!authReady) {
    return <div className="admin-container">인증 확인 중...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h1>Admin Console</h1>
          <p>콘솔 토큰과 API 키를 발급/관리합니다.</p>
        </div>
        <button className="link-button" onClick={() => navigate('/console/login')}>
          콘솔 로그인으로 이동
        </button>
      </header>

      <section className="admin-section">
        <h2>콘솔 토큰 발급</h2>
        <form className="admin-form" onSubmit={handleCreateConsoleToken}>
          <input
            type="text"
            placeholder="토큰 이름 (선택)"
            value={newConsoleName}
            onChange={(e) => setNewConsoleName(e.target.value)}
          />
          <button type="submit">토큰 생성</button>
        </form>
        <div className="admin-list">
          {consoleTokens.map((token) => (
            <div key={token.id} className="admin-card">
              <div>
                <div className="admin-title">{token.name || 'Untitled Token'}</div>
                <div className="admin-sub">{token.token_preview}</div>
                <div className="admin-meta">Created: {token.created_at}</div>
              </div>
              <button className="danger" onClick={() => handleRevokeConsoleToken(token.id)}>
                비활성화
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>API 키 발급</h2>
        <form className="admin-form" onSubmit={handleCreateApiKey}>
          <input
            type="text"
            placeholder="키 이름 (선택)"
            value={newApiName}
            onChange={(e) => setNewApiName(e.target.value)}
          />
          <select
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">콘솔 토큰 선택</option>
            {consoleTokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name || `Token #${token.id}`} ({token.token_preview})
              </option>
            ))}
          </select>
          <button type="submit">API 키 생성</button>
        </form>
        <div className="admin-list">
          {apiKeys.map((key) => (
            <div key={key.id} className="admin-card">
              <div>
                <div className="admin-title">{key.name || 'Untitled Key'}</div>
                <div className="admin-sub">{key.key_preview}</div>
                <div className="admin-meta">Owner Token ID: {key.owner_token_id}</div>
                <div className="admin-meta">Created: {key.created_at}</div>
              </div>
              <button className="danger" onClick={() => handleRevokeApiKey(key.id)}>
                비활성화
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
