import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // next/navigation, next/link 대체
import styles from './Auth.module.css'; 

export const Login = () => {
  const navigate = useNavigate(); // router.push -> navigate
  
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
      // -------------------------------------------------------------
      // 🚧 [Mocking Mode] 백엔드 없이 디자인 작업을 위한 가짜 로직
      // -------------------------------------------------------------
      console.log('로그인 시도:', { email, password });
      
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert('로그인 성공! (Mocking)');
      navigate('/'); // router.push('/') -> navigate('/')
      // -------------------------------------------------------------

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '로그인에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        {/* 로고 */}
        <h1 className={styles.logo}>
          cu<span className={styles.boldText}>kee </span>
          {/* Next Image -> Standard img tag */}
          <img
            src="/cukee-logo.svg"
            alt="큐키"
            width="36"
            height="36"
            className={styles.logoImage}
          />
          : <span className={styles.boldText} style={{ marginLeft: '5px' }}>큐</span>레이터{' '}
          <span className={styles.boldText} style={{ marginLeft: '5px' }}>키</span>우기
        </h1>
      </div>

      <div className={styles.wrapper}>
        {/* 로그인 폼 */}
        <h2 className={styles.title}>로그인</h2>
        
        <div className={styles.signupPrompt}>
          계정이 없으신가요?{' '}
          {/* Next Link -> React Router Link */}
          <Link to="/auth/signup" className={styles.signupLink}>
            회원가입
          </Link>
        </div>

        <div className={styles.mainContent}>
          <div className={`${styles.card} ${styles.cardLogin}`}>
            <form id="loginForm" onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  이메일_
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={styles.input}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  비밀번호_
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className={styles.input}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <div className={styles.forgotPassword}>
                <Link to="/auth/forgot-password" className={styles.forgotPasswordLink}>
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {error && <div className={styles.error}>{error}</div>}
            </form>

            <div className={styles.divider}>
              <div className={styles.dividerLine}>
                <div className={styles.dividerBorder}></div>
              </div>
              <div className={styles.dividerText}>
                <span className={styles.dividerTextInner}>또는</span>
              </div>
            </div>

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialButton} disabled>
                <span className={styles.socialButtonText}>Google</span>
              </button>
              <button type="button" className={styles.socialButton} disabled>
                <span className={styles.socialButtonText}>Kakao</span>
              </button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button type="submit" form="loginForm" disabled={isLoading} className={styles.submitButton}>
            <img
              src="/cookie2.png" 
              alt="로그인 버튼" 
              width="180"      
              height="150"
              className={`${styles.cookieImage} ${styles.defaultImage}`}
            />
            <img
              src="/cookie2h.png" 
              alt="로그인 버튼 호버" 
              width="200"      
              height={180}
              className={`${styles.cookieImage} ${styles.hoverImage}`}
            />
            <span className={styles.buttonText}>
              {isLoading ? '...' : '로그인'}
            </span>
          </button>
        </div>
      </div>
      <div className={styles.footerCredit}>
        ♥ by playwith404
      </div>
    </div>
  );
};