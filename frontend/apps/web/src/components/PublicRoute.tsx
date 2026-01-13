import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading/Loading';

export const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <Loading text="확인 중..." characterCount={3} />;
    }

    if (isAuthenticated) {
        // 이미 로그인 된 상태라면 홈으로 리다이렉트
        return <Navigate to="/home" replace />;
    }
    // outlet
    return <Outlet />;
};
