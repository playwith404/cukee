import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyExhibitions, type Exhibition } from '../../apis/exhibition';
import styles from './Header.module.css';


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

    // [추가] 유효성 검사 (Signup.tsx와 동일 규격 적용)
    if (nickname.length < 2 || nickname.length > 20) {
      alert('닉네임은 2-20자 사이여야 합니다.');
      return;
    }

    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
      alert('닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
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
  const { withdraw } = useAuth(); // [추가] withdraw 함수 가져오기
  const navigate = useNavigate(); // [추가] navigate 가져오기
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleDelete = async () => {
    if (!password || !passwordConfirm) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // 실제 탈퇴 API 호출 (비밀번호 전달)
      await withdraw(password);

      alert("탈퇴가 완료되었습니다.");
      onClose();
      navigate('/'); // 홈으로 이동
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      // 에러 메시지 처리는 API 응답에 따라 다를 수 있으나, 여기서는 일반적인 실패 메시지
      alert("탈퇴 실패: 비밀번호가 올바르지 않거나 오류가 발생했습니다.");
    }
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

  // ✅ [추가] 전시회 목록 상태
  const [exhibitions, setExhibitions] = useState<{ id: number; title: string }[]>([]);
  const [loadingExhibitions, setLoadingExhibitions] = useState(true);

  // 전시회 목록 로드
  useEffect(() => {
    const loadExhibitions = async () => {
      try {
        setLoadingExhibitions(true);
        const response = await getMyExhibitions(1, 20);
        const exhibitionList = response.data.map((ex: Exhibition) => ({
          id: ex.id,
          title: ex.title
        }));
        setExhibitions(exhibitionList);
      } catch (error) {
        console.error('전시회 목록 로드 실패:', error);
        setExhibitions([]);
      } finally {
        setLoadingExhibitions(false);
      }
    };

    loadExhibitions();
  }, []);


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
                {loadingExhibitions ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>로딩 중...</p>
                ) : exhibitions.length > 0 ? (
                  <ul>
                    {exhibitions.map((ex) => (
                      <li
                        key={ex.id}
                        onClick={() => navigate(`/exhibition?exhibitionId=${ex.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {ex.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>저장된 전시회가 없습니다.</p>
                )}
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