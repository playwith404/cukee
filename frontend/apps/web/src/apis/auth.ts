// src/api/auth.ts
export async function verifyEmailCode(email: string, code: string) {
  const res = await fetch("/auth/email/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    throw res;
  }

  return res.json() as Promise<{ verified: boolean }>;
}
