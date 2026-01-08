import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { startGoogleLogin, startKakaoLogin } from '../../apis/auth';

// 아이콘 SVG 컴포넌트
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

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

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

  return (
    <div className={styles.container}>
      {/* 네비게이션 바 */}
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navLogo}>cukee</Link>
        <div className={styles.navLinks}>
          <Link to="/auth/login" className={`${styles.navLink} ${styles.navLinkActive}`}>로그인</Link>
          <Link to="/auth/signup" className={styles.navLink}>회원가입</Link>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className={styles.wrapper}>
        <div className={styles.mainContent}>
          <div className={`${styles.card} ${styles.cardLogin}`}>
            {/* 타이틀 */}
            <h2 className={styles.title}>로그인</h2>
            <p className={styles.subtitle}>cukee에 오신 것을 환영합니다</p>

            {/* 로그인 폼 */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>이메일</label>
                <div className={styles.inputWrapper}>
                  <MailIcon />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>비밀번호</label>
                <div className={styles.inputWrapper}>
                  <LockIcon />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* 비밀번호 찾기 링크 */}
              <div className={styles.forgotPassword}>
                <Link to="/auth/forgot-password" className={styles.forgotPasswordLink}>
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* 구분선 */}
            <div className={styles.divider}>
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerText}>또는</span>
              <div className={styles.dividerLine}></div>
            </div>

            {/* 소셜 로그인 버튼 */}
            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialButton} disabled={isLoading} onClick={startGoogleLogin}>
                <span className={styles.socialButtonText}>Google</span>
              </button>
              <button type="button" className={styles.socialButton} disabled={isLoading} onClick={startKakaoLogin}>
                <span className={styles.socialButtonText}>Kakao</span>
              </button>
            </div>

            {/* 푸터 링크 */}
            <div className={styles.signupPrompt}>
              계정이 없으신가요?
              <Link to="/auth/signup" className={styles.signupLink}>회원가입</Link>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footerCredit}>
        ♥ by playwith404
      </div>
    </div>
  );
};
