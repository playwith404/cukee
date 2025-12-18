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
  const [showInfo, setShowInfo] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="cukee-dropdown-outer"> 
        <div className="cukee-dropdown-glass">
            
            <div className="drop-split">
                
                {/* 1. [좌측] 50% 영역: 메뉴 모음 */}
                <div className="drop-section drop-left">
                    <div className="menu-container">
                        
                        {/* [수정 2] 내 정보 영역 */}
                        <div className="menu-group">
                            <button 
                                className="menu-btn" 
                                onClick={() => setShowInfo(!showInfo)}
                            >
                                내 정보 {showInfo ? '' : ''}
                            </button>
                            
                            {/* 버튼 누르면 닉네임 등장 */}
                            {showInfo && (
                                <div className="sub-menu">
                                    <p>✏️ {nickname} 님</p>
                                </div>
                            )}
                        </div>

                        {/* 새 전시회 (단일 버튼) */}
                        <div className="menu-group">
                            <button className="menu-btn">새 전시회 생성하기</button>
                            <button className="menu-btn-more" onClick={() => setShowMore(!showMore)}>
                                더보기 {showMore ? '▲' : '▼'}
                            </button>
                            {showMore && (
                                <div className="sub-menu">
                                    <p className="sub-item-bug">버그 제보</p>
                                    <p className="sub-item-wd">탈퇴하기</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* 2. [우측] 50% 영역: 리스트 */}
                <div className="drop-section drop-right">
                    <p className="list-title">나의 전시회 목록</p>
                    <div className="scroll-list">
                        <ul>
                            {TICKET_LIST.map((name, index) => (
                                <li key={index}>{name}</li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
            
            {/* 로그아웃 (우측 하단) */}
            <div className="drop-footer">
                <span>로그아웃</span>
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