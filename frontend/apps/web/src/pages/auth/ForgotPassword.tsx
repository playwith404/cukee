import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { requestPasswordReset, verifyPasswordResetCode, resetPassword } from '../../apis/auth';

export const ForgotPassword = () => {
    const navigate = useNavigate();

    // 상태 관리
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: 이메일입력, 2: 인증번호확인, 3: 비밀번호재설정
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1단계: 이메일 인증 요청
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await requestPasswordReset(email);
            if (response.success) {
                setMessage('인증번호가 이메일로 전송되었습니다.');
                setStep(2);
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('가입되지 않은 이메일입니다.');
            } else if (err.response?.status === 400 && err.response?.data?.detail?.message) {
                setError(err.response.data.detail.message);
            } else {
                setError('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 2단계: 인증번호 확인
    const handleVerifyCode = async () => {
        setError('');
        setMessage('');

        if (code.length !== 6) {
            setError('인증번호 6자리를 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await verifyPasswordResetCode(email, code);
            if (response.success) {
                setMessage('인증되었습니다.');
                setStep(3);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail?.message || '인증번호 확인에 실패했습니다.';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // 3단계: 비밀번호 재설정
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== newPasswordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(email, code, newPassword);
            alert('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
            navigate('/auth/login');
        } catch (err: any) {
            setError('비밀번호 변경에 실패했습니다. 처음부터 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* 로고 영역 */}
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

                {/* 상단 로그인 링크 */}
                <div className={styles.signupPrompt}>
                    비밀번호가 기억나셨나요?{' '}
                    <Link to="/auth/login" className={styles.signupLink}>
                        로그인
                    </Link>
                </div>

                <div className={styles.mainContent}>

                    {/* 제출 버튼 (왼쪽 배치) */}
                    <button
                        type="submit"
                        form={step === 1 ? "emailForm" : (step === 3 ? "resetForm" : undefined)}
                        onClick={step === 2 ? handleVerifyCode : undefined}
                        disabled={isLoading}
                        className={styles.submitButton}
                        style={{ margin: '0 -30px 0 0' }}
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
                            {isLoading ? '...' : (step === 1 ? '인증번호 받기' : (step === 2 ? '확인' : '변경하기'))}
                        </span>
                    </button>


                    {/* 카드 영역 */}
                    <div className={`${styles.card} ${styles.cardSignup}`}>

                        {/* 1단계 폼 */}
                        {step === 1 && (
                            <form id="emailForm" onSubmit={handleRequestCode} className={styles.form}>
                                <p className={styles.description}>가입한 이메일 주소를 입력해주세요.</p>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email" className={styles.label}>이메일_</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className={styles.input}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </form>
                        )}

                        {/* 2단계 폼 (인증번호 입력) */}
                        {step === 2 && (
                            <div className={styles.form}>
                                <p className={styles.description}>이메일로 전송된 인증번호를 입력해주세요.</p>
                                <div className={styles.formGroup}>
                                    <label htmlFor="code" className={styles.label}>인증번호_</label>
                                    <input
                                        id="code"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="6자리 숫자"
                                        className={styles.input}
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 3단계 폼 (비밀번호 재설정) */}
                        {step === 3 && (
                            <form id="resetForm" onSubmit={handleResetPassword} className={styles.form}>
                                <p className={styles.description}>새로운 비밀번호를 입력해주세요.</p>

                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword" className={styles.label}>새 비밀번호_</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="8자 이상 입력"
                                        className={styles.input}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="newPasswordConfirm" className={styles.label}>비밀번호 확인_</label>
                                    <input
                                        id="newPasswordConfirm"
                                        type="password"
                                        value={newPasswordConfirm}
                                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                        placeholder="비밀번호 재입력"
                                        className={styles.input}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </form>
                        )}

                        {/* 메시지 표시 */}
                        {error && <div className={styles.error} style={{ marginTop: '15px' }}>{error}</div>}
                        {message && <div className={styles.success} style={{ marginTop: '15px' }}>{message}</div>}

                    </div>
                </div>
            </div>
            <div className={styles.footerCredit}>
                ♥ by playwith404
            </div>
        </div>
    );
};
