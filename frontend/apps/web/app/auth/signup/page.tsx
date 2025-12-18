/**
 * 회원가입 페이지
 */
'use client';

import { useState } from 'react';
import { useSignup } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/modules/Signup.module.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const signup = useSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
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

    // 비밀번호 강도 검증 (백엔드와 동일)
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

    // 닉네임 특수문자 검증 (백엔드와 동일)
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
      setError('닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다');
      return;
    }

    try {
      await signup.mutateAsync({
        email,
        password,
        nickname,
      });
    } catch (err: any) {
      // Pydantic 검증 에러 처리
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        const validationErrors = err.response.data.detail
          .map((e: any) => e.msg || e.message)
          .join(', ');
        setError(validationErrors);
      } else {
        const errorMessage = err.response?.data?.detail || '회원가입에 실패했습니다';
        setError(errorMessage);
      }
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
          <p className={styles.logoSubtitle}>AI 큐레이터 영화 전시회</p>
        </div>

        {/* 회원가입 폼 */}
        <div className={styles.card}>
          <h2 className={styles.title}>회원가입</h2>

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
                disabled={signup.isPending}
              />
            </div>

            {/* 닉네임 */}
            <div className={styles.formGroup}>
              <label htmlFor="nickname" className={styles.label}>
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="한글, 영문, 숫자 2-20자"
                className={styles.input}
                disabled={signup.isPending}
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
                placeholder="영문, 숫자 포함 8자 이상"
                className={styles.input}
                disabled={signup.isPending}
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className={styles.formGroup}>
              <label htmlFor="passwordConfirm" className={styles.label}>
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                className={styles.input}
                disabled={signup.isPending}
              />
            </div>

            {/* 에러 메시지 */}
            {error && <div className={styles.error}>{error}</div>}

            {/* 제출 버튼 */}
            <button type="submit" disabled={signup.isPending} className={styles.submitButton}>
              {signup.isPending ? '가입 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className={styles.footer}>
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className={styles.footerLink}>
              로그인
            </Link>
          </div>
        </div>

        {/* 약관 */}
        <div className={styles.terms}>
          회원가입 시 <span>서비스 이용약관</span> 및 <span>개인정보 처리방침</span>에
          동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}
