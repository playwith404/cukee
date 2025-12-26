// src/apis/auth.ts
import api from './index';

// 이메일 인증번호 발송
export async function sendVerificationCode(email: string) {
  const res = await api.post('/v1/auth/email/send', { email });
  return res.data as {
    success: boolean;
    message: string;
    expiresIn?: number;
    retryAfter?: number;
  };
}

// 이메일 인증번호 검증
export async function verifyEmailCode(email: string, code: string) {
  const res = await api.post('/v1/auth/email/verify', { email, code });
  return res.data as {
    success: boolean;
    message: string;
    errorCode?: string;
  };
}

// 회원가입
export async function signup(email: string, password: string, nickname: string) {
  const res = await api.post('/v1/auth/signup', { email, password, nickname });
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
  };
}

// 로그인
export async function login(email: string, password: string) {
  const res = await api.post('/v1/auth/login', { email, password });
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
  };
}

// 로그아웃
export async function logout() {
  const res = await api.post('/v1/auth/logout');
  return res.data as { message: string };
}
