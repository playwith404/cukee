import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Content Script 전용 빌드 설정
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {} // 일부 라이브러리 에러 방지
  },
  build: {
    emptyOutDir: false, // 기존 빌드 파일(팝업 등) 지우지 않기
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/content.tsx'), // 입력 파일
      name: 'ContentScript',
      fileName: () => 'src/content.js', // 출력 파일명 고정
      formats: ['iife'], // ⭐ 핵심: 모든 걸 하나로 뭉치는 포맷 (IIFE)
    },
    rollupOptions: {
      output: {
        extend: true,
      }
    }
  }
});