import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { sendVerificationCode } from '../../apis/auth';

// --- 아이콘 컴포넌트 ---
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

// O 아이콘 (유효함)
const CheckIcon = () => (
  <svg className={`${styles.validationIcon} ${styles.valid}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// X 아이콘 (유효하지 않음)
const XIcon = () => (
  <svg className={`${styles.validationIcon} ${styles.invalid}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const Signup = () => {
  const navigate = useNavigate();

  // 입력 값 State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  
  // 유효성 검사 결과 State (null: 입력 전, true: 통과, false: 실패)
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);
  const [isConfirmValid, setIsConfirmValid] = useState<boolean | null>(null);
  const [isNicknameValid, setIsNicknameValid] = useState<boolean | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- 유효성 검사 로직 함수들 ---

  // 1. 닉네임: 2~20자, 한글/영문/숫자/언더스코어
  const validateNickname = (name: string) => {
    const regex = /^[가-힣a-zA-Z0-9_]{2,20}$/;
    return regex.test(name);
  };

  // 2. 이메일: 표준 형식
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // 3. 비밀번호: 8자 이상, 영문 포함, 숫자 포함
  const validatePassword = (pwd: string) => {
    const hasLength = pwd.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    return hasLength && hasLetter && hasNumber;
  };

  // --- 이벤트 핸들러 ---

  // 공백(스페이스바) 입력 차단
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, ''); // 공백 제거
    setNickname(val);
    if (val.length === 0) setIsNicknameValid(null);
    else setIsNicknameValid(validateNickname(val));
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
    
    // 비밀번호 유효성 체크
    if (val.length === 0) setIsPasswordValid(null);
    else setIsPasswordValid(validatePassword(val));

    // 비밀번호를 바꿀 때, 이미 입력된 '비밀번호 확인' 값과 일치하는지도 갱신해줘야 함
    if (passwordConfirm.length > 0) {
      setIsConfirmValid(val === passwordConfirm);
    }
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, '');
    setPasswordConfirm(val);

    if (val.length === 0) setIsConfirmValid(null);
    else setIsConfirmValid(val === password); // 현재 비밀번호와 일치하는지 확인
  };

  // 폼 전체 유효성 검사 (모든 조건이 true여야 버튼 활성화)
  const isFormValid = 
    isNicknameValid === true &&
    isEmailValid === true &&
    isPasswordValid === true &&
    isConfirmValid === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비활성 버튼이지만 엔터키 등으로 제출될 경우를 대비한 방어 코드
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      await sendVerificationCode(email);
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
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navLogo}>cukee</Link>
        {/* <div className={styles.navLinks}>
          <Link to="/auth/login" className={styles.navLink}>로그인</Link>
          <Link to="/auth/signup" className={`${styles.navLink} ${styles.navLinkActive}`}>회원가입</Link>
        </div> */}
      </nav>

      <div className={styles.wrapper}>
        <div className={styles.mainContent}>
          <div className={`${styles.card} ${styles.cardSignup}`}>
            <h2 className={styles.title}>회원가입</h2>
            <p className={styles.subtitle}>cukee의 멤버가 되어보세요</p>

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
                    onChange={handleNicknameChange}
                    onKeyDown={handleKeyDown}
                    placeholder="이름을 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                  />
                  {nickname.length > 0 && (
                    isNicknameValid ? <CheckIcon /> : <XIcon />
                  )}
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
                    onChange={handleEmailChange}
                    onKeyDown={handleKeyDown}
                    placeholder="이메일을 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                  />
                  {email.length > 0 && (
                    isEmailValid ? <CheckIcon /> : <XIcon />
                  )}
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
                    placeholder="비밀번호 (8자 이상, 영문/숫자)"
                    className={styles.input}
                    disabled={isLoading}
                  />
                  {password.length > 0 && (
                    isPasswordValid ? <CheckIcon /> : <XIcon />
                  )}
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
                    onChange={handleConfirmChange}
                    onKeyDown={handleKeyDown}
                    placeholder="비밀번호를 다시 입력하세요"
                    className={styles.input}
                    disabled={isLoading}
                  />
                  {passwordConfirm.length > 0 && (
                    isConfirmValid ? <CheckIcon /> : <XIcon />
                  )}
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && <div className={styles.error}>{error}</div>}

              <button 
                type="submit" 
                disabled={isLoading || !isFormValid} 
                className={styles.submitButton}
              >
                {isLoading ? '처리 중...' : '가입하기'}
                {!isLoading && <ArrowIcon />}
              </button>
            </form>

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