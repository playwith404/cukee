// extension/src/apis/auth.ts
import api, { setSessionCookie, removeSessionCookie, getSessionFromCookie } from './index';

// 1. 세션 확인 (로그인 유지 확인용)
// chrome.cookies에서 세션을 읽어 Authorization 헤더로 전송
export async function checkAuth() {
  // 먼저 쿠키에 세션이 있는지 확인
  const sessionId = await getSessionFromCookie();
  if (!sessionId) {
    throw new Error('No session found');
  }

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
// 백엔드에서 session_id를 응답에 포함 → chrome.cookies에 저장
export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data as {
    userId: number;
    email: string;
    nickname: string;
    sessionId?: string; // 백엔드에서 session_id 응답 (camelCase로 변환됨)
    session_id?: string; // 또는 snake_case 그대로
  };

  // 세션 ID를 chrome.cookies에 저장
  const sessionId = data.sessionId || data.session_id;
  if (sessionId) {
    await setSessionCookie(sessionId);
    console.log('[Extension] Session cookie saved');
  }

  return {
    userId: data.userId,
    email: data.email,
    nickname: data.nickname,
  };
}

// 4. 로그아웃
// 백엔드 로그아웃 API 호출 + chrome.cookies에서 세션 삭제
export async function logout() {
  try {
    const response = await api.post('/auth/logout');
    return response.data as { message: string };
  } finally {
    // API 호출 성공/실패 관계없이 로컬 쿠키 삭제
    await removeSessionCookie();
    console.log('[Extension] Session cookie removed');
  }
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
  // 탈퇴 후 쿠키 삭제
  await removeSessionCookie();
  return response.data;
}

// --- Extension에서는 사용하지 않지만 타입 호환을 위해 stub 유지 ---
export async function signup() { return {} as { userId: number; email: string; nickname: string }; }
export async function sendVerificationCode() { return { success: true, message: '' }; }
export async function verifyEmailCode() { return { success: true, message: '' }; }
