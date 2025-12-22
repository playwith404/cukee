'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // 페이지 이동용
import Link from 'next/link';
import Image from 'next/image';
//import styles from './Login.module.css';
import styles from './Auth.module.css'; 

// 나중에 백엔드 연결할 때 주석 풀어서 쓰세요
// import { useLogin } from '@/hooks/useAuth'; 

export default function LoginForm() {
  const router = useRouter();
  // const login = useLogin(); // 🚧 진짜 훅은 잠시 대기
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 직접 관리

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsLoading(true); // 로딩 시작

    try {
      // -------------------------------------------------------------
      // 🚧 [Mocking Mode] 백엔드 없이 디자인 작업을 위한 가짜 로직
      // -------------------------------------------------------------
      console.log('로그인 시도:', { email, password });
      
      // 1.5초 딜레이 (서버 요청하는 척)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 성공 처리 및 페이지 이동
      alert('로그인 성공! (Mocking)');
      router.push('/'); 
      // -------------------------------------------------------------

      /* 🔥 진짜 코드는 나중에 이거 주석 풀면 됨
      await login.mutateAsync({
        email,
        password,
      });
      */

    } catch (err: any) {
      // 가짜 에러 테스트하고 싶으면 위에서 throw new Error() 하시면 됩니다.
      const errorMessage = err.response?.data?.detail || '로그인에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // 로딩 끝
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        {/* 로고 */}
  <h1 className={styles.logo}>
    {/* cu는 그냥 두고, kee, 큐, 키 만 span으로 감싸기 */}
    cu<span className={styles.boldText}>kee </span>
    <Image
      src="/cukee-logo.svg"
      alt="큐키"
      width={36}
      height={36}
      className={styles.logoImage}
    />
    : <span 
    className={styles.boldText}
    style={{ marginLeft: '5px' }}>큐</span>레이터{' '}
    <span 
    className={styles.boldText}
    style={{ marginLeft: '5px' }}
    >키</span>우기
  </h1>
</div>
      <div className={styles.wrapper}>

        {/* 로그인 폼 */}
          <h2 className={styles.title}>로그인</h2>
            {/* 회원가입 링크- 회원가입도수정 */}
          <div className={styles.signupPrompt}>
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className={styles.signupLink}>
              회원가입
            </Link>
          </div>
          <div className={styles.mainContent}>
          <div className={`${styles.card} ${styles.cardLogin}`}>
          <form id="loginForm" onSubmit={handleSubmit} className={styles.form}>
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
                autoComplete="email"
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
                placeholder="비밀번호 입력"
                className={styles.input}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* 비밀번호 찾기 */}
            <div className={styles.forgotPassword}>
              <Link href="/auth/forgot-password" className={styles.forgotPasswordLink}>
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 에러 메시지 */}
            {error && <div className={styles.error}>{error}</div>}

            
          </form>

            {/* 소셜 로그인 (디자인 확인용) */}
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
              <Image
              src="/cookie2.png" 
              alt="로그인 버튼" 
              width={180}      
              height={150}
              className={`${styles.cookieImage} ${styles.defaultImage}`}
              />
              <Image
              src="/cookie2h.png" 
              alt="로그인 버튼 호버" 
              width={200}      
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
}