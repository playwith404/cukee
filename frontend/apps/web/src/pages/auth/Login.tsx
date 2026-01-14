import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { startGoogleLogin, startKakaoLogin } from '../../apis/auth';
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

// --- 아이콘 컴포넌트들 (생략 - 기존과 동일) ---
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

export const Login = () => {
  const navigate = useNavigate();
  // 1. 애니메이션 상태 관리
  const [isExiting, setIsExiting] = useState(false); 
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ✅ [추가] 비밀번호 가시성 상태 관리
  const [showPassword, setShowPassword] = useState(false);

  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 정규식 및 검사 로직
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (pwd: string) => {
    return pwd.length >= 6; 
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, ''); 
    setEmail(val);
    if (val.length === 0) setIsEmailValid(null);
    else setIsEmailValid(validateEmail(val));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, '');
    setPassword(val);
    if (val.length === 0) setIsPasswordValid(null);
    else setIsPasswordValid(validatePassword(val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const isFormValid = isEmailValid === true && isPasswordValid === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) return;

    setIsLoading(true);

    try {
      await login(email, password);
      
      // ✅ [수정 포인트 1] 로그인 성공 시 애니메이션 시작 후 이동
      setIsExiting(true);
      setTimeout(() => {
        navigate('/home');
      }, 600); // CSS transition 시간과 동일하게 설정

    } catch (err: any) {
      // 백엔드 에러 응답 구조: { detail: { error: { message: "..." } } }
      const errorMessage =
        err.response?.data?.detail?.error?.message ||
        err.response?.data?.detail?.message ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        '로그인에 실패했습니다';
      setError(typeof errorMessage === 'string' ? errorMessage : '로그인에 실패했습니다');
      setIsLoading(false); // 실패 시에는 로딩만 해제
    } 
  };

  return (
    // ✅ [수정 포인트 2] isExiting 상태에 따라 클래스 추가
    <div className={`${styles.container} ${isExiting ? styles.fadeOut : ''}`}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navLogo}>cukee</Link>
      </nav>

      <div className={styles.wrapper}>
        <div className={styles.mainContent}>
          <div className={`${styles.card} ${styles.cardLogin}`}>
            <h2 className={styles.title}>로그인</h2>
            <p className={styles.subtitle}>cukee에 오신 것을 환영합니다</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* 이메일 입력창 */}
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
                  {email.length > 0 && (
                    isEmailValid ? <CheckIcon /> : <XIcon />
                  )}
                </div>
              </div>

              {/* 비밀번호 입력창 */}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>비밀번호</label>
                <div className={styles.inputWrapper}>
                  <LockIcon />
                  <input
                    id="password"
                    // ✅ [수정] showPassword 상태에 따라 type 변경
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="비밀번호를 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  {/* ✅ [추가] 비밀번호 토글 버튼 */}
                  {password.length > 0 && (
                    <button
                      type="button"
                      className={styles.passwordToggleButton}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1} // 탭 키 이동에서 제외 (선택 사항)
                    >
                      {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  )}
                  {password.length > 0 && (
                    isPasswordValid ? <CheckIcon /> : <XIcon />
                  )}
                </div>
              </div>

              <div className={styles.forgotPassword}>
                <Link to="/auth/forgot-password" className={styles.forgotPasswordLink}>
                  비밀번호를 잊으셨나요?
                </Link>
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

            <div className={styles.divider}>
              <div className={styles.dividerLine}></div>
              <span className={styles.dividerText}>또는</span>
              <div className={styles.dividerLine}></div>
            </div>

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialButton} disabled={isLoading} onClick={startGoogleLogin}>
                <span className={styles.socialButtonText}>Google</span>
              </button>
              <button type="button" className={styles.socialButton} disabled={isLoading} onClick={startKakaoLogin}>
                <span className={styles.socialButtonText}>Kakao</span>
              </button>
            </div>

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