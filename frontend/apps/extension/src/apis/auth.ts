// extension/src/apis/auth.ts
import api from './index';

// 1. 세션 확인 (로그인 유지 확인용)
// withCredentials: true로 HTTP-only 쿠키가 자동 전송되므로 별도 처리 불필요
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

// 3. 로그인
// 백엔드에서 Set-Cookie 헤더로 HTTP-only 쿠키 설정 → Web과 Extension 모두 자동 공유
export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data as {
    userId: number;
    email: string;
    nickname: string;
  };

  return {
    userId: data.userId,
    email: data.email,
    nickname: data.nickname,
  };
}

// 4. 로그아웃
// 백엔드에서 쿠키 삭제 처리 → Web과 Extension 모두 자동 로그아웃
export async function logout() {
  const response = await api.post('/auth/logout');
  return response.data as { message: string };
}

// 5. 프로필 업데이트
export async function updateProfile(data: { nickname?: string }) {
  const response = await api.patch('/users/me', data);
  return response.data as {
    userId: number;
    email: string;
    nickname: string;
    createdAt: string;
  };
}

// 6. 회원 탈퇴
export async function withdrawUser(password: string) {
  const response = await api.delete('/users/me', {
    data: { password }
  });
  return response.data;
}

// --- Extension에서는 사용하지 않지만 타입 호환을 위해 stub 유지 ---
export async function signup() { return {} as { userId: number; email: string; nickname: string }; }
export async function sendVerificationCode() { return { success: true, message: '' }; }
export async function verifyEmailCode() { return { success: true, message: '' }; }