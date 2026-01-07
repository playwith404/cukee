import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { requestPasswordReset, resetPassword } from '../../apis/auth';

type Step = 'REQUEST' | 'RESET';

export const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('REQUEST');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError('이메일을 입력해주세요');
            return;
        }

        setIsLoading(true);
        try {
            await requestPasswordReset(email);
            setMessage('인증번호가 이메일로 발송되었습니다.');
            setStep('RESET');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.detail?.message || '이메일 발송에 실패했습니다.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!code || !newPassword) {
            setError('인증번호와 새로운 비밀번호를 입력해주세요');
            return;
        }

        if (newPassword.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(email, code, newPassword);
            alert('비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.');
            navigate('/auth/login');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.detail?.message || '비밀번호 변경에 실패했습니다.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
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
                <h2 className={styles.title}>비밀번호 찾기</h2>

                <div className={styles.signupPrompt}>
                    <Link to="/auth/login" className={styles.signupLink}>
                        로그인으로 돌아가기
                    </Link>
                </div>

                <div className={styles.mainContent}>
                    <div className={`${styles.card} ${styles.cardLogin}`}>

                        {step === 'REQUEST' ? (
                            <form id="requestForm" onSubmit={handleRequest} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <p className={styles.description} style={{ marginBottom: '20px', color: '#ccc', fontSize: '14px' }}>
                                        가입하신 이메일을 입력하시면<br />비밀번호 재설정 인증번호를 보내드립니다.
                                    </p>
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

                                {error && <div className={styles.error}>{error}</div>}
                            </form>
                        ) : (
                            <form id="resetForm" onSubmit={handleReset} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <p className={styles.success} style={{ marginBottom: '20px', color: '#4ade80', fontSize: '14px' }}>
                                        {message}
                                    </p>
                                    <label className={styles.label} style={{ color: '#888' }}>
                                        {email}
                                    </label>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="code" className={styles.label}>
                                        인증번호_
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="6자리 인증번호"
                                        className={styles.input}
                                        disabled={isLoading}
                                        maxLength={6}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword" className={styles.label}>
                                        새 비밀번호_
                                    </label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="새로운 비밀번호 (8자 이상)"
                                        className={styles.input}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>

                                {error && <div className={styles.error}>{error}</div>}
                            </form>
                        )}

                        <button
                            type="submit"
                            form={step === 'REQUEST' ? "requestForm" : "resetForm"}
                            disabled={isLoading}
                            className={styles.submitButton}
                            style={{ marginTop: '20px' }}
                        >
                            <img
                                src="/cookie2.png"
                                alt="버튼"
                                width="180"
                                height="150"
                                className={`${styles.cookieImage} ${styles.defaultImage}`}
                            />
                            <img
                                src="/cookie2h.png"
                                alt="버튼 호버"
                                width="200"
                                height={180}
                                className={`${styles.cookieImage} ${styles.hoverImage}`}
                            />
                            <span className={styles.buttonText}>
                                {isLoading ? '처리중...' : (step === 'REQUEST' ? '인증번호 받기' : '비밀번호 변경')}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <div className={styles.footerCredit}>
                ♥ by playwith404
            </div>
        </div>
    );
};
