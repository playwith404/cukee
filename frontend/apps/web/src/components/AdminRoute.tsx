import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Loading from './Loading/Loading';
import { checkAdminAuth } from '../apis/admin';

export const AdminRoute = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isActive = true;
    const verify = async () => {
      try {
        await checkAdminAuth();
        if (isActive) {
          setIsAllowed(true);
        }
      } catch (error) {
        if (isActive) {
          setIsAllowed(false);
        }
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };
    verify();
    return () => {
      isActive = false;
    };
  }, []);

  if (isChecking) {
    return <Loading text="인증 확인 중..." characterCount={3} />;
  }

  if (!isAllowed) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
