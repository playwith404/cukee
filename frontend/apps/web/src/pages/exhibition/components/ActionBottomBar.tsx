import { useState } from 'react';
import styles from './ActionBottomBar.module.css';
// import { ExhibitionDecorate } from '../ExhibitionDecorate';
// import type { CukeeStyle } from '../../../types/cukee';

interface ActionBottomBarProps {
  promptValue: string;
  setPromptValue: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isReadOnly: boolean; // [추가]

  // 추가: 모드 관련 props
  mode: 'action' | 'decorate';
  onCloseDecorate: () => void;
  onOpenDecorate: () => void;
}

export const ActionBottomBar = ({ promptValue, setPromptValue, onSubmit, isLoading, isReadOnly, mode, onCloseDecorate, onOpenDecorate, }: ActionBottomBarProps) => {
  // 모달 표시 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // [신규] 첫 번째 전송인지 여부를 기억하는 상태 (초기값: true)
  const [isFirstSubmit, setIsFirstSubmit] = useState(true);

  const handleChipClick = (text: string) => {
    setPromptValue(text);
  };

  // [수정] 전송 시도 로직 변경
  const handlePreSubmit = () => {
    if (isLoading || !promptValue.trim()) return;

    if (isFirstSubmit) {
      // 1. 첫 번째 전송이라면 -> 모달을 띄운다
      setShowConfirmModal(true);
    } else {
      // 2. 두 번째부터는 -> 모달 없이 바로 전송
      onSubmit();
    }
  };

  // [수정] 모달 확인 버튼 클릭 시
  const handleConfirm = () => {
    setShowConfirmModal(false); // 모달 닫기
    setIsFirstSubmit(false);    // [핵심] 이제 더 이상 첫 번째가 아니라고 표시
    onSubmit();                 // 실제 전송
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <div className={`${styles.container} ${isReadOnly ? styles.narrowBar : ''}`}>
        {/* ✅ isReadOnly가 아닐 때(편집 모드)만 입력창과 버튼을 보여줌 */}
        {mode === 'action' && !isReadOnly && (
          <>
            <div className={styles.promptWrapper}>
              <input
                type="text"
                className={styles.input}
                placeholder={isLoading ? "큐키가 전시회를 생성중이에요..." : "cukee 프롬프트 입력하기"}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handlePreSubmit()}
                disabled={isLoading}
              />
              <button
                className={styles.submitBtn}
                onClick={handlePreSubmit}
                disabled={isLoading || !promptValue.trim()}
                style={{ opacity: (isLoading || !promptValue.trim()) ? 0.5 : 1 }}
              >
                {isLoading ? '...' : '→'}
              </button>
            </div>

            <div className={styles.actions}>
              <button className={styles.chip} onClick={() => handleChipClick("조금 더 감동적인 영화를 원해!")}>
                조금 더 감동적인 영화를 원해!
              </button>
              <button className={styles.chip} onClick={() => handleChipClick("러닝 타임이 짧은 영화를 원해!")}>
                러닝 타임이 짧은 영화를 원해!
              </button>
            </div>
          </>
        )}
      </div>

      {/* 모달: showConfirmModal이 true일 때만 뜸 */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.glassModal}>
            <h3 className={styles.modalTitle}>알림</h3>
            <p className={styles.modalDesc}>
              입력하신 프롬프트를 전송할까요?<br />
              <p className={styles.promptDesc}>"{promptValue}"</p>
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={handleCancel}>
                취소
              </button>
              <button className={styles.btnConfirm} onClick={handleConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};