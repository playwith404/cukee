import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // 환경변수 로드 (VITE_ 로 시작하는 것들)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 개발 환경(npm run dev)에서만 적용되는 프록시
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          // 백엔드 경로에 /api가 포함되어 있다면 rewrite 불필요
          // 만약 백엔드가 /api를 안 쓴다면 rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});