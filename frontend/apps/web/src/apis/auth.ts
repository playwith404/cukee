// src/apis/auth.ts
import api from './index';

// 이메일 인증번호 발송
export async function sendVerificationCode(email: string) {
  const res = await api.post('/auth/email/send', { email });
  return res.data as {
    success: boolean;
    message: string;
    expiresIn?: number;
    retryAfter?: number;
  };
}

// 이메일 인증번호 검증
export async function verifyEmailCode(email: string, code: string) {
  const res = await api.post('/auth/email/verify', { email, code });
  return res.data as {
    success: boolean;
    message: string;
    errorCode?: string;
  };
}

// 회원가입
export async function signup(email: string, password: string, nickname: string) {
  const res = await api.post('/auth/signup', { email, password, nickname });
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
  };
}

// 로그인
export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
  };
}

// 로그아웃
export async function logout() {
  const res = await api.post('/auth/logout');
  return res.data as { message: string };
}

// 현재 로그인한 사용자 정보 조회
export async function getMe() {
  const res = await api.get('/users/me');
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
    createdAt: string;
  };
}

// 내 정보 확인 (세션 체크 - AuthContext용)
export async function checkAuth() {
  const res = await api.get('/auth/me');
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
  };
}
// 사용자 정보 수정 (통합 Patch)
export async function updateProfile(data: { nickname?: string }) {
  const res = await api.patch('/users/me', data);
  return res.data as {
    userId: number;
    email: string;
    nickname: string;
    createdAt: string;
  };
}
