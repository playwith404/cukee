// cukee/frontend/packages/ui/src/components/VerificationCodeInput.tsx

import { useRef, useState } from "react";

interface Props {
  length: number;
  onComplete: (code: string) => void;
}

export default function VerificationCodeInput({ length, onComplete }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const next = [...values];
    next[index] = value;
    setValues(next);

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (next.every((v) => v !== "")) {
      onComplete(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="code-input-wrapper">
      {values.map((v, i) => (
        <input
            key={i}
            ref={(el) => {
                inputsRef.current[i] = el;
            }}
            className="code-input"
            maxLength={1}
            value={v}
            inputMode="numeric"
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
        />

      ))}
    </div>
  );
}
