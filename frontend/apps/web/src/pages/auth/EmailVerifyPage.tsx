// src/pages/EmailVerifyPage.tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VerificationCodeInput from "../../../../../packages/ui/src/components/VerificationCodeInput";
import { verifyEmailCode, signup, sendVerificationCode } from "../../apis/auth";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/emailVerify.css";

interface SignupState {
  email: string;
  password: string;
  nickname: string;
}

export default function EmailVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const state = location.state as SignupState | null;

  useEffect(() => {
    if (!state?.email) {
      navigate('/auth/signup');
    }
  }, [state, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleComplete = (value: string) => {
    setCode(value);
    setError(null);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !state?.email) return;

    try {
      await sendVerificationCode(state.email);
      setResendCooldown(60);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.detail?.retry_after || 60;
        setResendCooldown(retryAfter);
      } else {
        setError("인증번호 재발송에 실패했습니다.");
      }
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !state) return;

    setLoading(true);
    setError(null);

    try {
      const verifyRes = await verifyEmailCode(state.email, code);

      if (verifyRes.success) {
        // 이메일 인증 완료 후 회원가입 진행
        const user = await signup(state.email, state.password, state.nickname);
        login(user);
        alert("회원가입이 완료되었습니다!");
        navigate('/home');
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError("인증코드가 올바르지 않습니다.");
      } else if (err.response?.status === 410) {
        setError("인증코드가 만료되었습니다. 다시 요청해주세요.");
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.detail || "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!state?.email) {
    return null;
  }

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h1>이메일 인증</h1>
        <p><strong>{state.email}</strong>로 전송된 6자리 인증코드를 입력해주세요.</p>

        <VerificationCodeInput length={6} onComplete={handleComplete} />

        {error && <p className="error-text">{error}</p>}

        <button
          className="verify-button"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading ? "확인 중..." : "확인"}
        </button>

        <button
          className="resend-button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0 ? `${resendCooldown}초 후 재발송 가능` : "인증번호 재발송"}
        </button>
      </div>
    </div>
  );
}
