import axios from 'axios';

// 환경변수 적용
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const BASE_URL = 'http://34.64.90.142:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인터셉터: 에러 처리만 하고, 강제 이동 로직은 제거
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ⚠️ 익스텐션 Guest Mode에서는 복잡한 리프레시 로직이나 리다이렉트가 필요 없습니다.
    // 그냥 에러를 반환해서 컴포넌트(HomePage)가 Fallback UI를 띄우게 하는 게 안전합니다.
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;