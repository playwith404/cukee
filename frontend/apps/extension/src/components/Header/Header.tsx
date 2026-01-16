import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

interface HeaderProps {
  currentSection: string;
  exhibitionTitle?: string;
  onBack?: () => void;
  onHome?: () => void;
}

export const Header = ({
  currentSection,
  exhibitionTitle,
  onHome
}: HeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, isLoading } = useAuth();

  // isAdultAllowed: false면 제외(차단), true면 포함(19금 노출)
  const [isAdultAllowed, setIsAdultAllowed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('isAdultAllowed');
    setIsAdultAllowed(saved === 'true');
  }, []);

  const toggleAdultFilter = () => {
    const nextState = !isAdultAllowed;
    setIsAdultAllowed(nextState);
    localStorage.setItem('isAdultAllowed', String(nextState));
  };

  const getImageUrl = (path: string) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
    } catch (e) { }
    return `/${path}`;
  };

  const is19PlusOn = isAdultAllowed;

  const handleHomeClick = () => {
    if (onHome) {
      onHome();
    } else {
      navigate('/');
    }
  };

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      await logout();
      navigate('/');
    }
  };

  return (
    <div className={styles.outerWrapper}>
      <header className={styles.header}>

        {/* 1. 좌측: 홈 버튼 */}
        <div className={styles.leftPos}>
          <button
            className={styles.iconBtn}
            onClick={handleHomeClick}
            title="홈으로 가기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
        </div>

        {/* 2. 중앙: 쿠키 아이콘 + 타이틀 */}
        <div className={styles.container}>
          <div>
            <img
              src={getImageUrl("cookie.png")}
              alt="Cookie"
              className={styles.cookieIcon}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <span className={styles.title}>
            cukee / {currentSection}
            {exhibitionTitle && ` / ${exhibitionTitle}`}
          </span>
        </div>

        {/* 3. 우측: 19금 토글 + 로그인/로그아웃 */}
        <div className={styles.rightPos}>
          <button
            className={`${styles.toggleBtn} ${is19PlusOn ? styles.toggleBtnActive : ''}`}
            onClick={toggleAdultFilter}
            title={is19PlusOn ? "19금 컨텐츠 숨기기" : "19금 컨텐츠 보기"}
          >
            {is19PlusOn ? '19+ ON' : '19+ OFF'}
          </button>

          {/* 로그아웃 버튼 */}
          {isAuthenticated && (
            <button
              className={styles.dropFooter}
              onClick={handleAuthClick}
              disabled={isLoading}
            >
              {isLoading ? '...' : '로그아웃'}
            </button>
          )}
        </div>

      </header>
    </div>
  );
};
