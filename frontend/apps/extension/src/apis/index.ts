import axios from 'axios';

// 환경변수 적용 (없으면 기본값 사용)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://middle.cloudkakao.store/api';
const COOKIE_DOMAIN = 'https://middle.cloudkakao.store';

// 웹사이트 도메인에서 세션 쿠키 가져오기
export async function getSessionCookie(): Promise<string | null> {
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    try {
      const cookie = await chrome.cookies.get({
        url: COOKIE_DOMAIN,
        name: 'session'
      });
      return cookie?.value || null;
    } catch (e) {
      console.error('Failed to get session cookie:', e);
      return null;
    }
  }
  return null;
}

// 웹사이트 도메인에 세션 쿠키 저장하기 (익스텐션에서 로그인 시 사용)
export async function setSessionCookie(sessionId: string): Promise<boolean> {
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    try {
      await chrome.cookies.set({
        url: COOKIE_DOMAIN,
        name: 'session',
        value: sessionId,
        path: '/',
        secure: true,
        sameSite: 'no_restriction', // SameSite=None
        expirationDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7일
      });
      return true;
    } catch (e) {
      console.error('Failed to set session cookie:', e);
      return false;
    }
  }
  return false;
}

// 세션 쿠키 삭제 (로그아웃 시 사용)
export async function removeSessionCookie(): Promise<boolean> {
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    try {
      await chrome.cookies.remove({
        url: COOKIE_DOMAIN,
        name: 'session'
      });
      return true;
    } catch (e) {
      console.error('Failed to remove session cookie:', e);
      return false;
    }
  }
  return false;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 세션을 Authorization 헤더로 전송
api.interceptors.request.use(
  async (config) => {
    const sessionValue = await getSessionCookie();
    if (sessionValue) {
      // Authorization 헤더에 세션 ID 추가 (Bearer 토큰 형식)
      config.headers['Authorization'] = `Bearer ${sessionValue}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;