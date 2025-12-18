/**
 * 로그인 페이지
 */
'use client';

import { useState } from 'react';
import { useLogin } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/modules/Login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    try {
      await login.mutateAsync({
        email,
        password,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || '로그인에 실패했습니다';
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* 로고 */}
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>
            <Image
              src="/cukee-logo.svg"
              alt="큐키"
              width={36}
              height={36}
              className={styles.logoImage}
            />
            큐키
          </h1>
        </div>

        {/* 로그인 폼 */}
        <div className={styles.card}>
          <h2 className={styles.title}>로그인</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* 이메일 */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={styles.input}
                disabled={login.isPending}
                autoComplete="email"
              />
            </div>

            {/* 비밀번호 */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className={styles.input}
                disabled={login.isPending}
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

            {/* 제출 버튼 */}
            <button type="submit" disabled={login.isPending} className={styles.submitButton}>
              {login.isPending ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 소셜 로그인 (추후 구현) */}
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

          {/* 회원가입 링크 */}
          <div className={styles.footer}>
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className={styles.footerLink}>
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
