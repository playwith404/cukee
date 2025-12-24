// apps/web/src/layouts/RootLayout.tsx
import { Outlet } from 'react-router-dom';
// ❌ 제거: import Providers from ... (main.tsx에서 이미 했음!)

export default function RootLayout() {
  return (
    <div className="layout-container">
       {/* Providers 제거하고 Outlet만 남깁니다 */}
       <Outlet />
    </div>
  );
}