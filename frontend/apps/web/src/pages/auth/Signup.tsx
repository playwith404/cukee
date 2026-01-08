import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { sendVerificationCode } from '../../apis/auth';

// 아이콘 SVG 컴포넌트
const UserIcon = () => (
  <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 00-16 0" />
  </svg>
);

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

const ArrowIcon = () => (
  <svg className={styles.buttonArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

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
      // 이메일 인증번호 발송
      await sendVerificationCode(email);

      // 인증 페이지로 이동 (회원가입 정보를 state로 전달)
      navigate('/auth/email/verify', {
        state: { email, password, nickname }
      });
    } catch (err: any) {
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.detail?.retry_after || 60;
        setError(`${retryAfter}초 후에 다시 시도해주세요.`);
      } else if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationErrors = err.response.data.detail
          .map((e: any) => e.msg || e.message)
          .join(', ');
        setError(validationErrors);
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.detail || '인증번호 발송에 실패했습니다';
        setError(errorMessage);
      }
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
          <Link to="/auth/login" className={styles.navLink}>로그인</Link>
          <Link to="/auth/signup" className={`${styles.navLink} ${styles.navLinkActive}`}>회원가입</Link>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className={styles.wrapper}>
        <div className={styles.mainContent}>
          <div className={`${styles.card} ${styles.cardSignup}`}>
            {/* 타이틀 */}
            <h2 className={styles.title}>회원가입</h2>
            <p className={styles.subtitle}>cukee의 멤버가 되어보세요</p>

            {/* 회원가입 폼 */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* 이름(닉네임) */}
              <div className={styles.formGroup}>
                <label htmlFor="nickname" className={styles.label}>이름</label>
                <div className={styles.inputWrapper}>
                  <UserIcon />
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 이메일 */}
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
                  />
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (6자 이상)"
                    className={styles.input}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className={styles.formGroup}>
                <label htmlFor="passwordConfirm" className={styles.label}>비밀번호 확인</label>
                <div className={styles.inputWrapper}>
                  <LockIcon />
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? '처리 중...' : '가입하기'}
                {!isLoading && <ArrowIcon />}
              </button>
            </form>

            {/* 푸터 링크 */}
            <div className={styles.signupPrompt}>
              이미 계정이 있으신가요?
              <Link to="/auth/login" className={styles.signupLink}>로그인</Link>
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
