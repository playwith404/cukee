import React, { useState } from 'react';
import styles from './Header.module.css';

// === 데이터 상수 ===
const TICKET_LIST = [
  "짧고 굵게 로맨스 전시회",
  "조금은 감동적인 MZ 전시회",
  "영화로 배우는 인생 수업",
  "비 오는 날의 명화 컬렉션",
  "여름밤의 스릴러 모음",
  "1990년대 레트로 명작",
  "숨겨진 유럽 독립 영화",
  "SF 블록버스터 베스트",
  "아이들이 좋아하는 애니메이션",
  "마길초 큐레이션 11",
  "마길초 큐레이션 12",
];

// === 내부 컴포넌트: 드롭다운 메뉴 ===
const DropdownMenu = () => {
  const nickname = '마길초';
  const [showInfo, setShowInfo] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className={styles.dropdownOuter}>
      <div className={styles.dropdownGlass}>
        <div className={styles.dropSplit}>
          
          {/* 1. [좌측] 메뉴 영역 */}
          <div className={styles.dropLeft}>
            <div className={styles.menuContainer}>
              
              {/* 내 정보 토글 */}
              <div className={styles.menuGroup}>
                <button 
                  className={styles.menuBtn} 
                  onClick={() => setShowInfo(!showInfo)}
                >
                  내 정보
                </button>
                {showInfo && (
                  <div className={styles.subMenu}>
                    <p>✏️ {nickname} 님</p>
                  </div>
                )}
              </div>

              {/* 새 전시회 & 더보기 */}
              <div className={styles.menuGroup}>
                <button className={styles.menuBtn}>새 전시회 생성하기</button>
                
                <button 
                  className={styles.menuBtnMore} 
                  onClick={() => setShowMore(!showMore)}
                >
                  더보기 {showMore ? '▲' : '▼'}
                </button>
                
                {showMore && (
                  <div className={styles.subMenu}>
                    <p style={{ cursor: 'pointer', margin: '5px 0' }}>버그 제보</p>
                    <p style={{ cursor: 'pointer', margin: '5px 0' }}>탈퇴하기</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 2. [우측] 리스트 영역 */}
          <div className={styles.dropRight}>
            <h3 className={styles.listTitle}>나의 전시회 목록</h3>
            <div className={styles.scrollList}>
              <ul>
                {TICKET_LIST.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            </div>
            <div className={styles.dropFooter}>로그아웃</div>
          </div>

        </div>
      </div>
    </div>
  );
};

// === 메인 컴포넌트: 헤더 ===
interface HeaderProps {
  currentSection: string;      // 예: 큐레이터
  exhibitionTitle?: string;    // 예: 나만의 전시회
  onBack?: () => void;         // 뒤로가기 (필요시 사용)
}

export const Header: React.FC<HeaderProps> = ({ 
  currentSection, 
  exhibitionTitle 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className={styles.outerWrapper}>
      <header className={styles.header}>
        
        {/* 1. 햄버거 버튼 */}
        <div className={styles.menuWrapper}>
          <button className={styles.menuButton} onClick={toggleMenu}>
             ☰ 
          </button>
        </div>

        {/* 2. 쿠키 아이콘 + 타이틀 */}
        <div className={styles.container}>
          <div>
            <img 
                src="/cookie.png" 
                alt="Cookie" 
                className={styles.cookieIcon} 
                onError={(e) => e.currentTarget.style.display='none'} 
            />
          </div>
          <span className={styles.title}>
            cukee / {currentSection}
            {exhibitionTitle && ` / ${exhibitionTitle}`}
          </span>
        </div>

        {/* 3. 드롭다운 메뉴 (조건부 렌더링) */}
        {isMenuOpen && <DropdownMenu />}
        
      </header>
    </div>
  );
};