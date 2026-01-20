import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import {
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
  const [consoleTokens, setConsoleTokens] = useState<AdminConsoleToken[]>([]);
  const [apiKeys, setApiKeys] = useState<AdminApiKey[]>([]);
  const [newConsoleName, setNewConsoleName] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalRows, setModalRows] = useState<Array<{ label: string; value: string }>>([]);
  const [modalHint, setModalHint] = useState<string | null>(null);
  const navigate = useNavigate();
  const tokenNameById = new Map(
    consoleTokens.map((token) => [token.id, token.name || `Token #${token.id}`])
  );

  const openModal = (title: string, rows: Array<{ label: string; value: string }>, hint?: string) => {
    setModalTitle(title);
    setModalRows(rows);
    setModalHint(hint ?? null);
    setModalOpen(true);
  };

  const loadData = async () => {
    const [tokens, keys] = await Promise.all([
      fetchConsoleTokens(),
      fetchApiKeys(),
    ]);
    setConsoleTokens(tokens);
    setApiKeys(keys);
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const handleCreateConsoleToken = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await createConsoleToken(newConsoleName || undefined);
      openModal(
        '콘솔 토큰 발급 완료',
        [
          { label: '콘솔 토큰', value: result.token },
          { label: 'API 키', value: result.api_key },
        ],
        '보안상 다시 표시되지 않으니 안전하게 보관하세요.'
      );
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
      const result = await createApiKey(Number(selectedTokenId));
      openModal(
        'API 키 발급 완료',
        [{ label: 'API 키', value: result.key }],
        '보안상 다시 표시되지 않으니 안전하게 보관하세요.'
      );
      await loadData();
    } catch (error) {
      alert('API 키 생성에 실패했습니다.');
    }
  };

  const handleRevokeConsoleToken = async (tokenId: number) => {
    if (!confirm('콘솔 토큰을 삭제할까요? 삭제하면 복구할 수 없습니다.')) return;
    await revokeConsoleToken(tokenId);
    await loadData();
  };

  const handleRevokeApiKey = async (keyId: number) => {
    if (!confirm('API 키를 삭제할까요? 삭제하면 복구할 수 없습니다.')) return;
    await revokeApiKey(keyId);
    await loadData();
  };

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
                삭제
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>API 키 발급</h2>
        <form className="admin-form admin-form--compact" onSubmit={handleCreateApiKey}>
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
                <div className="admin-title">
                  {tokenNameById.get(key.owner_token_id) || `Token #${key.owner_token_id}`} Key
                </div>
                <div className="admin-sub">{key.key_preview}</div>
                <div className="admin-meta">Owner Token ID: {key.owner_token_id}</div>
                <div className="admin-meta">Created: {key.created_at}</div>
              </div>
              <button className="danger" onClick={() => handleRevokeApiKey(key.id)}>
                삭제
              </button>
            </div>
          ))}
        </div>
      </section>

      {modalOpen && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{modalTitle}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setModalOpen(false)}
              >
                닫기
              </button>
            </div>
            <div className="admin-modal-body">
              {modalRows.map((row) => (
                <div key={row.label} className="admin-modal-row">
                  <div className="admin-modal-label">{row.label}</div>
                  <div className="admin-modal-value">{row.value}</div>
                </div>
              ))}
              {modalHint && <div className="admin-modal-hint">{modalHint}</div>}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-primary" onClick={() => setModalOpen(false)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
