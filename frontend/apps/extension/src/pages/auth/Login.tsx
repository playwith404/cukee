import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../../components/Loading';
import styles from './Auth.module.css';

// 아이콘 컴포넌트
const MailIcon = () => (
  <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6L12 13L2 6" />
  </svg>
);

const LockIcon = () => (
  <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg className={`${styles.validationIcon} ${styles.valid}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg className={`${styles.validationIcon} ${styles.invalid}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// 웹 URL (환경변수 또는 고정값)
const WEB_URL = 'https://cukee.world';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // 이미 로그인된 상태면 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/home');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pwd: string) => pwd.length >= 6;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, '');
    setEmail(val);
    setIsEmailValid(val.length === 0 ? null : validateEmail(val));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, '');
    setPassword(val);
    setIsPasswordValid(val.length === 0 ? null : validatePassword(val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') e.preventDefault();
  };

  const isFormValid = isEmailValid === true && isPasswordValid === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || '로그인에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 웹으로 새 탭 열기
  const openWebPage = (path: string) => {
    const url = `${WEB_URL}${path}`;
    // Chrome Extension API 사용 가능하면 사용, 아니면 window.open
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  // 인증 상태 확인 중이면 로딩 표시
  if (authLoading) {
    return <Loading text="로그인 확인 중" />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>로그인</h2>
        <p className={styles.subtitle}>cukee에 오신 것을 환영합니다</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 이메일 */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>이메일</label>
            <div className={styles.inputWrapper}>
              <MailIcon />
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyDown}
                placeholder="이메일을 입력하세요"
                className={styles.input}
                disabled={isLoading}
                autoComplete="email"
              />
              {email.length > 0 && (isEmailValid ? <CheckIcon /> : <XIcon />)}
            </div>
          </div>

          {/* 비밀번호 */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>비밀번호</label>
            <div className={styles.inputWrapper}>
              <LockIcon />
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyDown}
                placeholder="비밀번호를 입력하세요"
                className={styles.input}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {password.length > 0 && (isPasswordValid ? <CheckIcon /> : <XIcon />)}
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => openWebPage('/auth/forgot-password')}
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={styles.submitButton}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className={styles.signupPrompt}>
          계정이 없으신가요?
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => openWebPage('/auth/signup')}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
