// ui/src/components/MainLayout.tsx

import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    // 'cukee-layout' 클래스 적용
    <div className="cukee-layout">
      {children}
    </div>
  );
};