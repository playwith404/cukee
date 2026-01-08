import React, { useState } from 'react';
import styles from './Gallery3D.module.css';

export interface Frame {
  id: number;
  content?: string;
  imageUrl?: string;
  isPinned?: boolean;
  title?: string;  // 영화 제목
  personaSummary?: string | null;  // DB에서 가져온 AI 영화 소개
}

interface Gallery3DProps {
  frames: Frame[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: (id: number, index: number) => void;
  onSelect: (index: number) => void;
  onPosterClick?: (id: number) => void;
  onPin?: (id: number) => void;
}

// ✅ 범용 확인 모달 (삭제/고정 공용)
interface ConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  onClose,
  onConfirm,
  title,
  description,
  confirmText
}) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.glassModal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalDesc}>{description}</p>
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>취소</button>
          <button className={styles.btnConfirm} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

type ModalType = 'DELETE' | 'PIN';

interface ModalState {
  type: ModalType;
  id: number;
  index: number;
  movieTitle: string;
}

export const Gallery3D = ({
  frames,
  activeIndex,
  onPrev,
  onNext,
  onDelete,
  onSelect,
  onPosterClick,
  onPin
}: Gallery3DProps) => {
  const [activeModal, setActiveModal] = useState<ModalState | null>(null);

  const maxIndex = frames.length - 1;
  const isEditMode = onPin && onDelete;

  const getFrameStyle = (index: number) => {
    const diff = index - activeIndex;
    if (diff === 0) return styles.center;
    if (diff === -1) return styles.left1;
    if (diff === 1) return styles.right1;
    if (diff === -2) return styles.left2;
    if (diff === 2) return styles.right2;
    if (diff < -2) return styles.hiddenLeft;
    if (diff > 2) return styles.hiddenRight;
    return styles.hidden;
  };

  const handleDeleteClick = (id: number, index: number, title: string) => {
    setActiveModal({ type: 'DELETE', id, index, movieTitle: title });
  };

  const handlePinClick = (id: number, index: number, title: string, isPinned?: boolean) => {
    if (isPinned) {
      onPin && onPin(id);
    } else {
      setActiveModal({ type: 'PIN', id, index, movieTitle: title });
    }
  };

  const handleConfirmAction = () => {
    if (!activeModal) return;
    if (activeModal.type === 'DELETE' && onDelete) {
      onDelete(activeModal.id, activeModal.index);
    } else if (activeModal.type === 'PIN' && onPin) {
      onPin(activeModal.id);
    }
    setActiveModal(null);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const getModalContent = () => {
    if (!activeModal) return null;
    if (activeModal.type === 'DELETE') {
      return {
        title: `'${activeModal.movieTitle}' 삭제하기`,
        description: (
          <>
            영화를 삭제하면 되돌릴 수 없으며,<br />
            해당 영화는 재추천되지 않습니다.<br />
            <span className={styles.promptDesc}>계속 진행하시겠습니까?</span>
          </>
        ),
        confirmText: '삭제'
      };
    }
    if (activeModal.type === 'PIN') {
      return {
        title: `'${activeModal.movieTitle}' 고정하기`,
        description: (
          <>
            이 영화를 고정하면 전시회가 재생성되어도<br />
            목록에서 사라지지 않고 유지됩니다.<br />
            <span className={styles.promptDesc}>이 영화를 고정하시겠습니까?</span>
          </>
        ),
        confirmText: '고정'
      };
    }
    return null;
  };

  const modalContent = getModalContent();

  return (
    <>
      <div className={styles.container}>
        {frames.map((frame, index) => {
          const positionClass = getFrameStyle(index);
          const movieTitle = frame.content || '영화';

          return (
            <div
              key={frame.id}
              className={`${styles.frame} ${positionClass}`} // ✅ frame이 가장 바깥 껍데기
              onClick={() => onSelect(index)}
            >
              {/* 1. 이미지 영역 (content) */}
              <div className={styles.content}>
                {frame.imageUrl ? (
                  <>
                    <img
                      src={frame.imageUrl}
                      alt={`Movie ${frame.id}`}
                      className={styles.posterImage}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: onPosterClick ? 'pointer' : 'default',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPosterClick) onPosterClick(frame.id);
                      }}
                    />
                  {/* hover 시 안내 텍스트 */}
                  <div className={styles.posterOverlay}>
                    클릭하면<br />영화 줄거리를 볼 수 있어요
                  </div>
                  </>
                ) : (
                  <div>{frame.content}</div>
                )}
              </div>
              {isEditMode && (
                <div className={styles.actions}>
                  <div className={styles.actionTitle}>{movieTitle}</div>

                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinClick(frame.id, index, movieTitle, frame.isPinned);
                      }}
                    >
                      {frame.isPinned ? '풀기' : '고정하기'}
                    </button>

                    <span className={styles.divider}>|</span>

                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(frame.id, index, movieTitle);
                      }}
                    >
                      삭제하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          className={`${styles.arrow} ${styles.prev}`}
          onClick={onPrev}
          disabled={activeIndex === 0}
        >
          &lt;
        </button>

        <button
          className={`${styles.arrow} ${styles.next}`}
          onClick={onNext}
          disabled={activeIndex === maxIndex || frames.length === 0}
        >
          &gt;
        </button>
      </div>

      {activeModal && modalContent && (
        <ConfirmModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmAction}
          title={modalContent.title}
          description={modalContent.description}
          confirmText={modalContent.confirmText}
        />
      )}
    </>
  );
};