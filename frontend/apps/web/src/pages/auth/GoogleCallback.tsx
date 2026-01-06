import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { checkAuth } from '../../apis/auth';
import styles from './Auth.module.css';

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
        setTimeout(() => navigate('/auth/login'), 3000);
        return;
      }

      if (success === 'true') {
        try {
          // 세션 쿠키가 설정되었으므로 사용자 정보 조회
          const userData = await checkAuth();
          setAuthUser(userData);
          navigate('/home');
        } catch (err) {
          setError('사용자 정보를 가져오는데 실패했습니다.');
          setTimeout(() => navigate('/auth/login'), 3000);
        }
      } else {
        setError('잘못된 접근입니다.');
        setTimeout(() => navigate('/auth/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthUser]);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h2 className={styles.title}>
          {error ? '로그인 실패' : 'Google 로그인 처리 중...'}
        </h2>
        {error ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>
        ) : (
          <p style={{ textAlign: 'center' }}>잠시만 기다려주세요.</p>
        )}
      </div>
    </div>
  );
};
