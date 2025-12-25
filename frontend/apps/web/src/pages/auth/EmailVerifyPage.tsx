// src/pages/EmailVerifyPage.tsx
import { useState } from "react";
import VerificationCodeInput from "../../../../../packages/ui/src/components/VerificationCodeInput";
import { verifyEmailCode } from "../../apis/auth";
import "../../styles/emailVerify.css";

export default function EmailVerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const email = "test@test.com"; // 👉 실제로는 이전 단계에서 전달받기

  const handleComplete = (value: string) => {
    setCode(value);
    setError(null);
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await verifyEmailCode(email, code);

      if (res.verified) {
        alert("이메일 인증 완료!");
        // TODO: 다음 단계 이동
      }
    } catch (err: any) {
      if (err.status === 400) {
        setError("인증코드가 올바르지 않습니다.");
      } else if (err.status === 410) {
        setError("인증코드가 만료되었습니다. 다시 요청해주세요.");
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h1>이메일 인증</h1>
        <p>이메일로 전송된 6자리 인증코드를 입력해주세요.</p>

        <VerificationCodeInput length={6} onComplete={handleComplete} />

        {error && <p className="error-text">{error}</p>}

        <button
          className="verify-button"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading ? "확인 중..." : "확인"}
        </button>
      </div>
    </div>
  );
}
