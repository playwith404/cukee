// ui/src/components/Header.tsx (수정된 버전)

import React, { useState } from "react";

// ui/src/components/Header.tsx (수정된 DropdownMenu)

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

const DropdownMenu = () => {
  const nickname = '마길초';
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="cukee-dropdown-outer"> 
        <div className="cukee-dropdown-glass">
            
            {/* 좌우 분할 컨테이너 */}
            <div className="dropdown-content-split">
                
                {/* 1. [좌측 영역] 내 정보, 새 전시회 생성하기, 더보기 */}
                <div className="dropdown-left-section">
                    <div className="dropdown-user-info">
                        <span>내 정보<br /></span>
                        <span>{nickname} 님 ✏️</span> 
                    </div>
                    
                    <div className="dropdown-item-group">
                        <div className="dropdown-item">내 전시회 검색</div>
                        <div className="dropdown-item">새 전시회 생성하기</div>
                    </div>

                    {/* 더보기 버튼 및 추가 메뉴 */}
                    <div className="dropdown-more-section">
                        <button 
                            className="dropdown-more-button"
                            onClick={() => setShowMore(prev => !prev)}
                        >
                            더보기 {showMore ? '▲' : '▼'}
                        </button>
                        
                        {showMore && (
                            <div className="dropdown-more-items">
                                <div className="dropdown-item">버그 제보</div>
                                <div className="dropdown-item">탈퇴하기</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. [우측 영역] 전시회 목록 (스크롤 영역) */}
                <div className="dropdown-right-section">
                    <p className="dropdown-list-title">최근 큐레이션 전시회 목록</p>
                    
                    {/* 스크롤을 구현할 컨테이너 */}
                    <div className="dropdown-scroll-list">
                        <ul className="dropdown-exhibition-list">
                            {TICKET_LIST.map((name, index) => (
                                <li key={index} className="dropdown-list-item">
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div> {/* end of dropdown-content-split */}
            
            {/* 3. [우측 하단] 로그아웃 텍스트 */}
            <div className="dropdown-footer">
                <span className="dropdown-logout-text">로그아웃</span>
            </div>
            
        </div>
    </div>
  );
};

interface HeaderProps {
  currentSection: string; 
  onBack?: () => void; 
}

export const Header: React.FC<HeaderProps> = ({ currentSection, onBack }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    // [Header가 기준점] position: relative 유지
    <header className="cukee-header">
      
      {/* 1. 햄버거 버튼 Wrapper (Header 내용 중앙에 포함됨) */}
      <div className="cukee-menu-wrapper">
          <button 
              onClick={handleDropdownToggle} // 토글 기능은 유지
              className="cukee-header-button"
          >
              ☰ 
          </button>
      </div>
      
      {/* 2. 쿠키/타이틀 컨테이너 */}
      <div className="cukee-header-container">
        <div>
          <img 
            src="/cookie.png" 
            alt="Cookie Icon" 
            className="cukee-cookie-icon" 
          />
        </div>
        <div className="cukee-header-title">
          cukee / {currentSection}
        </div>
      </div>
      
      {/* 3. [수정] 드롭다운 메뉴를 Header의 직계 자식으로 배치 */}
      {/* 이제 Header를 기준으로 Header 전체 너비에 걸쳐 내려옵니다. */}
      {isDropdownOpen && <DropdownMenu />}
      
    </header>
  );
};