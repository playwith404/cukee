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


interface UserInfoModalProps {
  onClose: () => void;
  currentNickname: string;
  email: string;
  onUpdate: (newName: string) => Promise<void>; // [추가] 업데이트 핸들러
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ onClose, currentNickname, email, onUpdate }) => {
  const [nickname, setNickname] = useState(currentNickname);

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      console.log("변경 요청:", nickname);
      await onUpdate(nickname);
      alert("닉네임이 변경되었습니다.");
      onClose();
    } catch (error) {
      console.error("닉네임 변경 실패:", error);
      alert("변경에 실패했습니다.");
    }
  };

  return (
    // 1. 공통 배경 (modalOverlay)
    <div className={styles.modalOverlay} onClick={onClose}>

      {/* 2. 공통 모달 박스 (glassModal) */}
      <div
        className={styles.glassModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3. 공통 타이틀 (modalTitle) */}
        <h2 className={styles.modalTitle}>내 정보 설정</h2>

        {/* 4. [차이점] 텍스트 대신 입력 폼 들어감 */}
        <div className={styles.formContainer}>

          {/* 닉네임 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>닉네임</label>
            <input
              type="text"
              className={styles.inputUnderline} // 새로 만든 밑줄 스타일
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"

            />
          </div>
          {/* 이메일 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>이메일</label>
            <p className={styles.emailText}>{email}</p>
          </div>
        </div>

        {/* 5. 공통 버튼 영역 (modalActions) */}
        <div className={styles.modalActions} style={{ marginTop: '10px' }}>
          <button className={styles.btnCancel} onClick={onClose}>
            취소
          </button>
          {/* 저장 버튼은 '확인' 버튼 스타일(btnConfirm)을 그대로 씀 */}
          <button className={styles.btnConfirm} onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
// ✅ [신규] 전시회 생성 확인 모달
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
// ✅ [신규] 회원 탈퇴 모달
interface DeleteAccountModalProps {
  onClose: () => void;
  nickname: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose, nickname }) => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleDelete = () => {
    if (!password || !passwordConfirm) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // TODO: 실제 탈퇴 API 호출
    console.log("회원 탈퇴 처리됨");
    alert("탈퇴가 완료되었습니다.");
    onClose();
    // 필요 시 여기서 로그아웃 처리 또는 홈으로 이동
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.glassModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>탈퇴하기</h2>
        <p className={styles.modalDesc}>
          <span className={styles.promptDesc}>{nickname} 님, 정말 떠나시는 건가요?</span>
        </p>

        <div className={styles.formContainer}>
          {/* 비밀번호 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>비밀번호 입력</label>
            <input
              type="password"
              className={styles.inputUnderline}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {/* 비밀번호 재입력 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>비밀번호 재입력</label>
            <input
              type="password"
              className={styles.inputUnderline}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력하세요"
            />
          </div>
        </div>

        <div className={styles.modalActions} style={{ marginTop: '10px' }}>
          <button className={styles.btnCancel} onClick={onClose}>
            취소
          </button>
          <button className={styles.btnConfirm} onClick={handleDelete}>
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
};
// === 내부 컴포넌트: 드롭다운 메뉴 ===
const DropdownMenu = () => {
  const navigate = useNavigate();
  const { logout, user, updateNickname } = useAuth();

  // 닉네임 설정
  const userNickname = user?.nickname || '게스트';
  const userEmail = user?.email || 'guest@cukee.com'; // user 객체에 email이 있다고 가정

  // UI 상태 관리
  const [showMore, setShowMore] = useState(false);

  // ✅ [추가] 모달 표시 여부 상태
  const [showInfoModal, setShowInfoModal] = useState(false);     // 내 정보 모달 ✅
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


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

  // 내 정보 모달 핸들러 ✅
  const handleOpenInfoModal = () => setShowInfoModal(true);
  const handleCloseInfoModal = () => setShowInfoModal(false);
  // ✅ 탈퇴 모달 핸들러
  const handleOpenDeleteModal = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);
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
                  <span
                    className={styles.menuLabel}
                    onClick={handleOpenInfoModal}
                  >내 정보</span>
                  <div
                    className={styles.profileRow}
                  >
                    <span className={styles.profileName}>{userNickname} 님</span>
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
                      {/* ✅ CSS 클래스 적용하여 호버 효과 추가 */}
                      <button className={styles.subMenuBtn}>
                        버그 제보
                      </button>
                      <button
                        className={styles.subMenuBtn}
                        onClick={handleOpenDeleteModal}
                      >
                        탈퇴하기
                      </button>
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
      {/* ✅ 내 정보 수정 모달 */}
      {showInfoModal && (
        <UserInfoModal
          onClose={handleCloseInfoModal}
          currentNickname={userNickname}
          email={userEmail}
          onUpdate={updateNickname} // [추가] 핸들러 전달
        />
      )}
      {/* ✅ 회원 탈퇴 모달 연결 */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={handleCloseDeleteModal}
          nickname={userNickname}
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
              onError={(e) => e.currentTarget.style.display = 'none'}
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