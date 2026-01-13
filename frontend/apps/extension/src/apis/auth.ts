// extension/src/apis/auth.ts
import api from './index'; // 👈 아까 IP 주소(34.64...) 설정한 axios 인스턴스

// 1. 내 정보 조회 (새로고침 시 로그인 유지 확인용)
export async function checkAuth() {
  // 백엔드에 "나 로그인 돼있니?" 물어보는 진짜 요청
  const response = await api.get('/members/me'); 
  return response.data;
}

// 2. 로그인 (게스트 계정으로 진짜 로그인 요청)
export async function login(email?: string, password?: string) {
  // 백엔드에 ID/PW 보내고 쿠키 받아오기
  const response = await api.post('/auth/login', { 
    email, 
    password 
  });
  return response.data;
}

// 3. 로그아웃
export async function logout() {
  await api.post('/auth/logout');
  return { message: '로그아웃 됨' };
}

// --- 아래는 안 쓴다면 비워둬도 되지만, 에러 방지용으로 남겨둠 ---

export async function signup() { return {}; }
export async function sendVerificationCode() { return { success: true }; }
export async function verifyEmailCode() { return { success: true }; }
export async function updateProfile(_data?: any) { return {}; }
export async function withdrawUser(_password?: string) { return { success: true }; }