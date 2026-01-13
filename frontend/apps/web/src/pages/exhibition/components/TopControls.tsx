import React, { useState } from 'react';
import styles from './TopControls.module.css';

interface TopControlsProps {
  onSave?: () => void;
  onDecorate?: () => void;
}

// ✅ [신규] 저장 확인 모달 컴포넌트
interface SaveModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.glassModal} 
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className={styles.modalTitle}>전시회 저장</h2>
        <p className={styles.modalDesc}>
          현재까지 작업한 내용을 저장합니다.<br />
          <span className={styles.promptDesc}>전시회를 저장하시겠습니까?</span>
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

export const TopControls = ({ onSave, onDecorate }: TopControlsProps) => {
  // ✅ 모달 상태 관리
  const [showSaveModal, setShowSaveModal] = useState(false);

  // 1. "전시회 저장하기" 버튼 클릭 시 모달 열기
  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  // 2. 모달에서 "확인" 클릭 시 실제 onSave 실행
  const handleConfirmSave = () => {
    if (onSave) onSave();
    setShowSaveModal(false);
  };

  return (
    <>
      <div className={styles.container}>
        {/* onClick을 handleSaveClick으로 변경 */}
        <button className={styles.button} onClick={handleSaveClick}>
          전시회 저장하기
        </button>
        <button
          className={styles.button}
          onClick={onDecorate}
        >
          전시회 꾸미기
        </button>
      </div>

      {/* ✅ 조건부 렌더링으로 모달 표시 */}
      {showSaveModal && (
        <SaveModal 
          onClose={() => setShowSaveModal(false)} 
          onConfirm={handleConfirmSave} 
        />
      )}
    </>
  );
};