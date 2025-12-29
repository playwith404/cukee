import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PrivateRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // 로딩 중일 때 표시할 컴포넌트 (스피너 등)
        // 현재는 빈 화면 혹은 스켈레톤 UI를 보여줄 수 있음
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        // 로그인 안 된 상태면 로그인 페이지로 리다이렉트
        // 원래 가려던 주소(location)를 state로 넘겨주면 로그인 후 복귀 가능 (선택사항)
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // 로그인 된 상태면 자식 라우트(Outlet) 렌더링
    return <Outlet />;
};
