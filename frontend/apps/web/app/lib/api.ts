/**
 * Axios API Client
 * HttpOnly Cookie 방식 인증
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // 🔴 필수! HttpOnly Cookie 사용
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 요청 로그 (개발용)
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    // 응답 로그 (개발용)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 시 토큰 갱신 시도 (1회만)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 요청
        await api.post('/api/v1/auth/refresh');

        // 원래 요청 재시도
        return api.request(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // 에러 로그 (개발용)
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error:', error.response?.status, error.config?.url);
      console.error('Error details:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;
