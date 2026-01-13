import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  currentSection: string;
  exhibitionTitle?: string;
  onBack?: () => void;
  onHome?: () => void; // ✅ 홈으로 가기 함수 추가
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  exhibitionTitle,
  onHome
}) => {
  const navigate = useNavigate();
  // isAdultExclude: true면 제외(차단), false면 포함(19금 노출)
  // 초기값: true (안전 모드)
  const [isAdultExclude, setIsAdultExclude] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('adultExclude');
    // 저장된 값이 없으면 true(차단), 있으면 그 값 따름
    setIsAdultExclude(saved !== 'false'); 
  }, []);

  const toggleAdultFilter = () => {
    const nextState = !isAdultExclude;
    setIsAdultExclude(nextState);
    localStorage.setItem('adultExclude', String(nextState));
  };

  const getImageUrl = (path: string) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
    } catch (e) {}
    return `/${path}`;
  };

  // ✅ 버튼 상태 UI 결정
  // isAdultExclude가 false(차단 안함) -> 19금 켜짐 -> 빨간색/ON
  // isAdultExclude가 true(차단 함) -> 19금 꺼짐 -> 회색/OFF
  const is19PlusOn = !isAdultExclude;
  const handleHomeClick = () => {
    if (onHome) {
      onHome(); // props로 받은 기능이 있다면 실행
    } else {
      navigate('/'); // 없으면 기본적으로 /home 이동
    }
  };

  return (
    <div className={styles.outerWrapper}>
      <header className={styles.header}>

        {/* ✅ 1. 좌측 영역: 홈 버튼 */}
        <div className={styles.leftPos}>
          <button 
            className={styles.iconBtn} 
            onClick={handleHomeClick}
            title="홈으로 가기"
          >
            {/* Home Icon SVG */}
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
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
          <span className={styles.title}>
            cukee / {currentSection}
            {exhibitionTitle && ` / ${exhibitionTitle}`}
          </span>
        </div>

        {/* ✅ 3. 우측: 19금 토글 */}
        <div className={styles.rightPos}>
          <button
            className={`
              ${styles.toggleBtn} 
              ${is19PlusOn ? styles.toggleBtnActive : ''}
            `}
            onClick={toggleAdultFilter}
            title={is19PlusOn ? "19금 컨텐츠 숨기기" : "19금 컨텐츠 보기"}
          >
            {is19PlusOn ? '19+ ON' : '19+ OFF'}
          </button>
        </div>

      </header>
    </div>
  );
};