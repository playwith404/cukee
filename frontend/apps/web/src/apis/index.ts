// apps/web/src/apis/index.ts
import axios from 'axios';

// 환경변수 적용 (없으면 기본값 /api)
// docker-compose와 rewrites 설정 덕분에 개발/배포 모두 '/api'로 통일 가능합니다.
// 뒤에 있는 불필요한 텍스트를 모두 지워주세요.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 쿠키(세션) 주고받기 필수!
  headers: {
    'Content-Type': 'application/json',
  },
});

// 401 에러 자동 처리 (토큰 만료 시 Silent Refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 아직 재시도 안 한 요청이라면
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ⚠️ 무한 루프 방지: Refresh 요청 자체가 실패한 경우 재시도 금지
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
        // 리프레시 토큰도 만료됐다면 로그인 페이지로 이동
        // 단, 이미 로그인 페이지에 있거나 하는 경우 무한 리로딩 방지 필요할 수 있음
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;