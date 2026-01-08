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

// 회원 탈퇴
export async function withdrawUser(password: string) {
  // DELETE 메서드에 body를 보낼 때는 data 속성을 사용해야 함
  const res = await api.delete('/users/me', {
    data: { password }
  });
  return res.data;
}

// Google 로그인 URL 가져오기
export async function getGoogleAuthUrl() {
  const res = await api.get('/auth/google/url');
  return res.data as {
    url: string;
    state: string;
  };
}

export function startGoogleLogin() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  window.location.href = `${baseUrl}/auth/google/login`;
}

// Kakao 로그인 URL 가져오기
export async function getKakaoAuthUrl() {
  const res = await api.get('/auth/kakao/url');
  return res.data as {
    url: string;
    state: string;
  };
}

export function startKakaoLogin() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  window.location.href = `${baseUrl}/auth/kakao/login`;
}

// 비밀번호 재설정 요청 (인증번호 발송)
export async function requestPasswordReset(email: string) {
  const res = await api.post('/auth/password/reset-request', { email });
  return res.data as {
    success: boolean;
    message: string;
    expiresIn?: number;
    retryAfter?: number;
  };
}

// 비밀번호 재설정 코드 검증
export async function verifyPasswordResetCode(email: string, code: string) {
  const res = await api.post('/auth/password/verify-code', { email, code });
  return res.data as {
    success: boolean;
    message: string;
    errorCode?: string;
  };
}

// 비밀번호 재설정 완료
export async function resetPassword(email: string, code: string, newPassword: string) {
  const res = await api.post('/auth/password/reset', { email, code, newPassword });
  return res.data as { message: string };
}

