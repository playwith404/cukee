import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  currentSection: string;      // 예: 큐레이터
  exhibitionTitle?: string;    // 예: 나만의 전시회
  onBack?: () => void;         // (사용 안 해도 인터페이스 호환을 위해 유지)
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  exhibitionTitle
}) => {
  // 19금 필터 상태 (로컬 스토리지 연동)
  const [isAdultExclude, setIsAdultExclude] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adultExclude');
    setIsAdultExclude(saved === 'true');
  }, []);

  const toggleAdultFilter = () => {
    const nextState = !isAdultExclude;
    setIsAdultExclude(nextState);
    localStorage.setItem('adultExclude', String(nextState));
  };

  // ✅ [핵심] 로컬/익스텐션 환경 구분해서 이미지 경로 가져오기 (에러 방지)
  const getImageUrl = (path: string) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        // 익스텐션 환경이면 chrome.runtime.getURL 사용
        return chrome.runtime.getURL(path);
      }
    } catch (e) {
      // 에러 나면 그냥 넘어감
    }
    // 로컬 환경이면 그냥 경로 반환
    return `/${path}`;
  };

  return (
    <div className={styles.outerWrapper}>
      <header className={styles.header}>

        {/* 1. 좌측 영역 (햄버거 버튼 삭제됨) */}
        {/* 드롭다운을 뺐으므로 버튼을 삭제해도 되지만, 
            중앙 정렬 균형을 위해 빈 div 영역(menuWrapper)은 남겨둡니다. */}
        <div className={styles.menuWrapper}>
          {/* 드롭다운 트리거 버튼 제거됨 */}
        </div>

        {/* 2. 중앙: 쿠키 아이콘 + 타이틀 */}
        <div className={styles.container}>
          <div>
            {/* 안전하게 이미지 경로 가져오기 */}
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

        {/* 3. 우측: 19금 필터 토글 (기능 유지) */}
        <div className={styles.rightWrapper}>
          <button
            className={`${styles.toggleBtn} ${isAdultExclude ? styles.toggleBtnActive : ''}`}
            onClick={toggleAdultFilter}
            title="19금 컨텐츠 필터링"
          >
            {isAdultExclude ? '19+ OFF' : '19+ ON'}
          </button>
        </div>

      </header>
    </div>
  );
};