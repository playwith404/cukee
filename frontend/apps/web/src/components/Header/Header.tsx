import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

// ✅ [신규] 커스텀 모달 컴포넌트
interface ConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.glassModal} 
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫힘 방지
      >
        <h2 className={styles.modalTitle}>전시회 생성</h2>
        <p className={styles.modalDesc}>
          저장하지 않은 전시회 내용은 지워집니다.<br />
          <span className={styles.promptDesc}>새 전시회를 생성하러 갈까요?</span>
        </p>
        
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>
            취소
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

// === 내부 컴포넌트: 드롭다운 메뉴 ===
const DropdownMenu = () => {
  const navigate = useNavigate();
  // dev 브랜치의 AuthContext 사용
  const { logout, user } = useAuth();
  
  // 닉네임 설정
  const nickname = user?.nickname || '게스트';

  // UI 상태 관리
  const [showMore, setShowMore] = useState(false);
  
  // ✅ [추가] 모달 표시 여부 상태
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // 1. "새 전시회 생성하기" 클릭 시 모달 열기
  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  // 2. 모달에서 "확인" 클릭 시 실행
  const handleConfirmCreate = () => {
    setShowCreateModal(false);
    navigate('/'); 
  };

  // 3. 모달에서 "취소" 클릭 시 실행
  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  return (
    <>
    <div className={styles.dropdownOuter}>
      <div className={styles.dropdownGlass}>
        <div className={styles.dropSplit}>
          
          {/* 1. [좌측] 메뉴 영역 */}
          <div className={styles.dropLeft}>
            <div className={styles.menuContainer}>
              
              {/* 내 정보 토글 */}
              <div className={styles.menuGroup}>
                <span className={styles.menuLabel}>내 정보</span>
                <div 
                  className={styles.profileRow} 
                  onClick={() => console.log("나중에 모달 띄울 곳")}
                >
                  <span className={styles.profileName}>{nickname} 님</span>
                  <img 
                    src="/pencil.png" 
                    alt="edit" 
                    className={styles.pencilIcon} 
                  />
                </div>
              </div>

              {/* 새 전시회 & 더보기 */}
              <div className={styles.menuGroup}>
                {/* ✅ [수정됨] onClick 이벤트 연결 */}
                <button 
                    className={styles.menuBtn} 
                    onClick={handleCreateClick}
                  >
                  새 전시회 생성하기
                </button>
                
                <hr className={styles.divider} />
                <button 
                  className={styles.menuBtnMore} 
                  onClick={() => setShowMore(!showMore)}
                >
                  더보기 {showMore ? '▲' : '▼'}
                </button>
                
                {showMore && (
                  <div className={styles.subMenu}>
                    <p style={{ cursor: 'pointer', margin: '15px 0 10px 0' }}>버그 제보</p>
                    <p style={{ cursor: 'pointer' }}>탈퇴하기</p>
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
            <button className={styles.dropFooter} onClick={handleLogout}>로그아웃</button>
          </div>

        </div>
      </div>
    </div>
    {/* ✅ [추가] 모달 컴포넌트 렌더링 (조건부) */}
      {showCreateModal && (
        <ConfirmModal 
          onClose={handleCloseModal} 
          onConfirm={handleConfirmCreate} 
        />
      )}
    </>
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