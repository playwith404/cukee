// [Guest Mode] 익스텐션용 가짜 Auth API

const GUEST_USER = {
  userId: 0,
  email: 'guest@cukee.com',
  nickname: '쿠키 게스트',
  characterImageUrl: '/cara/cara1.png', // 이미지 경로 임시 지정
  createdAt: new Date().toISOString(),
  isGuest: true
};

// 1. 내 정보 조회
export async function getMe() {
  return GUEST_USER;
}

// 2. 로그인 (인자를 받아주긴 해야 에러가 안 남)
export async function login(_email?: string, _password?: string) {
  console.log('익스텐션은 로그인이 필요 없습니다.');
  return GUEST_USER;
}

// 3. 로그아웃
export async function logout() {
  return { message: '로그아웃 됨' };
}



// 4. 나머지 빈 껍데기들 (AuthContext가 찾으니까 만들어줘야 함)
export async function signup() { return GUEST_USER; }
export async function checkAuth() { return GUEST_USER; }
export async function sendVerificationCode() { return { success: true }; }
export async function verifyEmailCode() { return { success: true }; }
export async function updateProfile(_data?: any) { return GUEST_USER; }
export async function withdrawUser(_password?: string) { return { success: true }; }
// 소셜
export async function getGoogleAuthUrl() { return { url: '', state: '' }; }
export function startGoogleLogin() { }
export async function getKakaoAuthUrl() { return { url: '', state: '' }; }
export function startKakaoLogin() { }