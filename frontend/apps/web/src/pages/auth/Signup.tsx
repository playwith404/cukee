import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';

export const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- 유효성 검사 로직 ---
    if (!email || !password || !nickname) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setError('비밀번호는 영문자를 포함해야 합니다');
      return;
    }

    if (!/\d/.test(password)) {
      setError('비밀번호는 숫자를 포함해야 합니다');
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2-20자 사이여야 합니다');
      return;
    }

    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
      setError('닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다');
      return;
    }
    // ----------------------

    setIsLoading(true);

    try {
      // 🚧 [Mocking Mode]
      console.log('회원가입 시도:', { email, password, nickname });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert('회원가입 성공! 로그인 페이지로 이동합니다.');
      navigate('/auth/login'); // router.push -> navigate
      
    } catch (err: any) {
      // 에러 처리 로직
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationErrors = err.response.data.detail
          .map((e: any) => e.msg || e.message)
          .join(', ');
        setError(validationErrors);
      } else {
        const errorMessage = err.response?.data?.detail || '회원가입에 실패했습니다';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. 로고 영역 */}
      <div className={styles.logoSection}>
        <h1 className={styles.logo}>
          cu<span className={styles.boldText}>kee </span>
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
        {/* 타이틀 */}
        <h2 className={styles.title}>회원가입</h2>

        {/* 상단 로그인 링크 */}
        <div className={styles.signupPrompt}>
          이미 계정이 있으신가요?{' '}
          <Link to="/auth/login" className={styles.signupLink}>
            로그인
          </Link>
        </div>

        {/* 메인 컨텐츠 */}
        <div className={styles.mainContent}>
          
          {/* 버튼을 왼쪽(HTML 순서상 위)에 배치 + 음수 마진으로 카드와 겹치게 */}
          <button 
            type="submit" 
            form="signupForm" 
            disabled={isLoading} 
            className={styles.submitButton}
            style={{ margin: '0 -30px 0 0' }} 
          >
            <img
              src="/cookie2.png"
              alt="회원가입 버튼"
              width="180"
              height="150"
              className={`${styles.cookieImage} ${styles.defaultImage}`}
            />
            <img
              src="/cookie2h.png"
              alt="회원가입 버튼 호버"
              width="200"
              height={180}
              className={`${styles.cookieImage} ${styles.hoverImage}`}
            />
            <span className={styles.buttonText}>
              {isLoading ? '...' : '회원가입'}
            </span>
          </button>

          {/* 카드 영역 */}
          <div className={`${styles.card} ${styles.cardSignup}`}>
            <form id="signupForm" onSubmit={handleSubmit} className={styles.form}>
              {/* 이메일 */}
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
                />
              </div>

              {/* 닉네임 */}
              <div className={styles.formGroup}>
                <label htmlFor="nickname" className={styles.label}>
                  닉네임_
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="한글, 영문, 숫자 2-20자"
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* 비밀번호 */}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  비밀번호_
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="영문, 숫자 포함 8자 이상"
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* 비밀번호 확인 */}
              <div className={styles.formGroup}>
                <label htmlFor="passwordConfirm" className={styles.label}>
                  비밀번호 확인_
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              {/* 에러 메시지 */}
              {error && <div className={styles.error}>{error}</div>}
            </form>

            {/* 약관 */}
            <div className={styles.terms}>
              회원가입 시 <span>서비스 이용약관</span> 및 <span>개인정보 처리방침</span>에
              동의하게 됩니다.
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