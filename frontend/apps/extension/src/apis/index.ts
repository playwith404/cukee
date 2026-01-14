// apps/extension/src/apis/index.ts
import axios from 'axios';

// 환경변수 적용 (없으면 기본값 사용)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://middle.cloudkakao.store/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 쿠키(세션) 주고받기 필수! Web과 동일하게 HTTP-only 쿠키 사용
  headers: {
    'Content-Type': 'application/json',
  },
});

// 401 에러 자동 처리 (토큰 만료 시 Silent Refresh) - Web과 동일한 로직
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 아직 재시도 안 한 요청이라면
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 무한 루프 방지: Refresh 요청 자체가 실패한 경우 재시도 금지
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Silent refresh 요청
        await api.post('/auth/refresh');

        // 토큰 갱신 성공 시 원래 요청 다시 시도
        return api.request(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료됐다면 에러 반환 (Extension에서는 리다이렉트 대신 에러 처리)
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;