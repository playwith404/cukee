// extension/src/apis/auth.ts
import api, { setSessionCookie, removeSessionCookie } from './index';

// 1. 세션 확인 (로그인 유지 확인용)
export async function checkAuth() {
  const response = await api.get('/auth/me');
  return response.data as {
    userId: number;
    email: string;
    nickname: string;
  };
}

// 2. 내 정보 조회 (상세 정보)
export async function getMe() {
  const response = await api.get('/users/me');
  return response.data as {
    userId: number;
    email: string;
    nickname: string;
    createdAt: string;
  };
}

// 3. 로그인 (익스텐션에서 로그인 시 웹과 세션 공유를 위해 쿠키 저장)
export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data as {
    userId: number;
    email: string;
    nickname: string;
    sessionId?: string;
  };

  // 세션 ID가 응답에 있으면 웹 도메인 쿠키에 저장 (웹과 동기화)
  if (data.sessionId) {
    await setSessionCookie(data.sessionId);
  }

  return {
    userId: data.userId,
    email: data.email,
    nickname: data.nickname,
  };
}

// 4. 로그아웃 (웹과 동기화를 위해 쿠키도 삭제)
export async function logout() {
  const response = await api.post('/auth/logout');

  // 웹 도메인 쿠키 삭제
  await removeSessionCookie();

  return response.data as { message: string };
}

// --- Extension에서는 사용하지 않지만 타입 호환을 위해 stub 유지 ---

export async function signup() { return {} as { userId: number; email: string; nickname: string }; }
export async function sendVerificationCode() { return { success: true, message: '' }; }
export async function verifyEmailCode() { return { success: true, message: '' }; }
export async function updateProfile(_data?: { nickname?: string }) {
  return {} as { userId: number; email: string; nickname: string; createdAt: string };
}
export async function withdrawUser(_password?: string) { return { success: true }; }