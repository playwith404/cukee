// useState는 값(함수)이고, FormEvent와 ChangeEvent는 타입입니다.
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConsoleLogin.css';

const ConsoleLogin = () => {
  const [token, setToken] = useState<string>('');
  const navigate = useNavigate();

  // e: FormEvent 타입을 사용하여 폼 제출 처리
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (token.length > 5) {
      navigate('/console/dashboard');
    } else {
      alert("유효한 토큰을 입력해주세요.");
    }
  };

  // e: ChangeEvent 타입을 사용하여 입력값 변경 처리
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo">playwith404</div>
        <button type="button" className="nav-button">
          서비스 바로가기
        </button>
      </header>
      
      <main className="login-content">
        <h1 className="title">Console</h1>
        <p className="subtitle">엔터프라이즈 고객을 위한 API 관리 콘솔</p>
        
        <div className="login-card">
          <h2 className="card-title">액세스 토큰 입력</h2>
          <form onSubmit={handleLogin} className="login-form">
            <input 
              type="text"
              className="token-input" 
              placeholder="ck_xxxx..." 
              value={token}
              onChange={handleInputChange}
            />
            <button type="submit" className="submit-button">
              로그인
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ConsoleLogin;