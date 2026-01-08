import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { requestPasswordReset, verifyPasswordResetCode, resetPassword } from '../../apis/auth';

// 아이콘 SVG 컴포넌트
const MailIcon = () => (
    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 6L12 13L2 6" />
    </svg>
);

const KeyIcon = () => (
    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
    </svg>
);

const LockIcon = () => (
    <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

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
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
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

    // 단계별 타이틀
    const getStepTitle = () => {
        switch (step) {
            case 1: return '비밀번호 찾기';
            case 2: return '인증번호 확인';
            case 3: return '비밀번호 재설정';
        }
    };

    // 단계별 서브타이틀
    const getStepSubtitle = () => {
        switch (step) {
            case 1: return '가입한 이메일 주소를 입력해주세요';
            case 2: return '이메일로 전송된 인증번호를 입력해주세요';
            case 3: return '새로운 비밀번호를 입력해주세요';
        }
    };

    // 단계별 버튼 텍스트
    const getButtonText = () => {
        if (isLoading) return '처리 중...';
        switch (step) {
            case 1: return '인증번호 받기';
            case 2: return '확인';
            case 3: return '변경하기';
        }
    };

    return (
        <div className={styles.container}>
            {/* 네비게이션 바 */}
            <nav className={styles.navbar}>
                <Link to="/" className={styles.navLogo}>cukee</Link>
                <div className={styles.navLinks}>
                    <Link to="/auth/login" className={styles.navLink}>로그인</Link>
                    <Link to="/auth/signup" className={styles.navLink}>회원가입</Link>
                </div>
            </nav>

            {/* 메인 컨텐츠 */}
            <div className={styles.wrapper}>
                <div className={styles.mainContent}>
                    <div className={`${styles.card} ${styles.cardLogin}`}>
                        {/* 타이틀 */}
                        <h2 className={styles.title}>{getStepTitle()}</h2>
                        <p className={styles.subtitle}>{getStepSubtitle()}</p>

                        {/* 1단계 폼 - 이메일 입력 */}
                        {step === 1 && (
                            <form onSubmit={handleRequestCode} className={styles.form}>
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
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {error && <div className={styles.error}>{error}</div>}

                                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                                    {getButtonText()}
                                </button>
                            </form>
                        )}

                        {/* 2단계 폼 - 인증번호 입력 */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyCode} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="code" className={styles.label}>인증번호</label>
                                    <div className={styles.inputWrapper}>
                                        <KeyIcon />
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

                                {message && <div className={styles.success}>{message}</div>}
                                {error && <div className={styles.error}>{error}</div>}

                                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                                    {getButtonText()}
                                </button>
                            </form>
                        )}

                        {/* 3단계 폼 - 비밀번호 재설정 */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword" className={styles.label}>새 비밀번호</label>
                                    <div className={styles.inputWrapper}>
                                        <LockIcon />
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
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="newPasswordConfirm" className={styles.label}>비밀번호 확인</label>
                                    <div className={styles.inputWrapper}>
                                        <LockIcon />
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
                                </div>

                                {error && <div className={styles.error}>{error}</div>}

                                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                                    {getButtonText()}
                                </button>
                            </form>
                        )}

                        {/* 푸터 링크 */}
                        <div className={styles.signupPrompt}>
                            비밀번호가 기억나셨나요?
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
