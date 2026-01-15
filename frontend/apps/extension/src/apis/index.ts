// apps/extension/src/apis/index.ts
import axios from 'axios';

// 환경변수 적용 (없으면 기본값 사용)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COOKIE_DOMAIN = 'cukee.world';
const COOKIE_URL = 'https://cukee.world';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * chrome.cookies API로 세션 쿠키 읽기
 * session_ext 쿠키를 우선 읽고, 없으면 session 쿠키 시도
 */
export async function getSessionFromCookie(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.cookies) {
      console.warn('[Extension] chrome.cookies API not available');
      resolve(null);
      return;
    }

    // 먼저 Extension용 쿠키(session_ext) 시도
    chrome.cookies.get(
      { url: COOKIE_URL, name: 'session_ext' },
      (cookie) => {
        if (chrome.runtime.lastError) {
          console.error('[Extension] Cookie read error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }

        if (cookie?.value) {
          resolve(cookie.value);
          return;
        }

        // session_ext가 없으면 session 쿠키 시도 (fallback)
        chrome.cookies.get(
          { url: COOKIE_URL, name: 'session' },
          (sessionCookie) => {
            resolve(sessionCookie?.value || null);
          }
        );
      }
    );
  });
}

/**
 * chrome.cookies API로 세션 쿠키 저장
 * session_ext 쿠키를 저장 (백엔드에서 웹 로그인 시에도 같이 설정됨)
 */
export async function setSessionCookie(sessionId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.cookies) {
      console.warn('[Extension] chrome.cookies API not available');
      resolve(false);
      return;
    }

    // 7일 후 만료
    const expirationDate = Date.now() / 1000 + 60 * 60 * 24 * 7;

    chrome.cookies.set(
      {
        url: COOKIE_URL,
        name: 'session_ext',
        value: sessionId,
        domain: COOKIE_DOMAIN,
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'no_restriction',
        expirationDate,
      },
      (cookie) => {
        if (chrome.runtime.lastError) {
          console.error('[Extension] Cookie set error:', chrome.runtime.lastError);
          resolve(false);
          return;
        }
        resolve(!!cookie);
      }
    );
  });
}

/**
 * chrome.cookies API로 세션 쿠키 삭제
 * session_ext와 session 모두 삭제
 */
export async function removeSessionCookie(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.cookies) {
      console.warn('[Extension] chrome.cookies API not available');
      resolve(false);
      return;
    }

    // session_ext 쿠키 삭제
    chrome.cookies.remove(
      { url: COOKIE_URL, name: 'session_ext' },
      () => {
        // session 쿠키도 삭제 (혹시 있을 경우)
        chrome.cookies.remove(
          { url: COOKIE_URL, name: 'session' },
          () => {
            if (chrome.runtime.lastError) {
              console.error('[Extension] Cookie remove error:', chrome.runtime.lastError);
            }
            resolve(true);
          }
        );
      }
    );
  });
}

// Request Interceptor: 매 요청 전 chrome.cookies에서 세션 읽어서 Authorization 헤더에 추가
api.interceptors.request.use(
  async (config) => {
    const sessionId = await getSessionFromCookie();
    if (sessionId) {
      config.headers.Authorization = `Bearer ${sessionId}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 에러 시 Silent Refresh 시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh 요청 자체가 실패한 경우 재시도 금지
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Silent refresh 요청
        const refreshResponse = await api.post('/auth/refresh');

        // 새 세션 ID가 응답에 있으면 쿠키에 저장
        const newSessionId = refreshResponse.data?.session_id;
        if (newSessionId) {
          await setSessionCookie(newSessionId);
        }

        // 원래 요청 다시 시도
        return api.request(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
