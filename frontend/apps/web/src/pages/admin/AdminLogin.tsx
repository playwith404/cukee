import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import { adminLogin } from '../../apis/admin';

const AdminLogin = () => {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (token.length !== 32) {
      alert('32자리 관리자 토큰을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminLogin(token);
      navigate('/admin/dashboard');
    } catch (error) {
      alert('관리자 토큰이 유효하지 않습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo">Cukee Admin</div>
        <button type="button" className="nav-button" onClick={() => navigate('/console/login')}>
          콘솔로 이동
        </button>
      </header>

      <main className="login-content">
        <h1 className="title">Admin</h1>
        <p className="subtitle">관리자 전용 토큰으로 인증하세요</p>

        <div className="login-card">
          <h2 className="card-title">관리자 토큰 입력</h2>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              className="token-input"
              placeholder="32자리 토큰"
              value={token}
              onChange={handleInputChange}
            />
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
