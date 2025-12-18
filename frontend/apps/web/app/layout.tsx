// apps/web/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css"; // 전역 스타일 임포트 (필수)

export const metadata: Metadata = {
  // 프로젝트에 맞는 메타데이터로 수정
  title: "Cukee",
  description: "영화 큐레이션 서비스 Cukee의 웹 버전입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Next.js Root Layout의 필수 구조
    <html lang="ko"> 
      <body> 
        {children} 
      </body>
    </html>
  );
}