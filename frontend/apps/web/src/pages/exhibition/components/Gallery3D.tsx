import React, { useState } from 'react';
import styles from './Gallery3D.module.css';

export interface Frame {
  id: number;
  content?: string;
  imageUrl?: string;
  isPinned?: boolean;
}

interface Gallery3DProps {
  frames: Frame[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: number, index: number) => void;
  onSelect: (index: number) => void;
  onPosterClick?: (id: number) => void;
  onPin?: (id: number) => void;
}

// ✅ [신규] 삭제 확인 모달 컴포넌트
interface DeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  movieTitle: string; // [추가] 영화 제목
}

const DeleteModal: React.FC<DeleteModalProps> = ({ onClose, onConfirm, movieTitle }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.glassModal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>{movieTitle} 삭제하기</h2>
        <p className={styles.modalDesc}>
          영화를 삭제하면 되돌릴 수 없으며,<br />
          해당 영화는 재추천되지 않습니다.<br />
          <span className={styles.promptDesc}>계속 진행하시겠습니까?</span>
        </p>

        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>
            취소
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

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
  // ✅ [상태 추가] 삭제할 대상 정보 저장 (null이면 모달 닫힘)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; index: number } | null>(null);

  const maxIndex = frames.length - 1;

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

  // ✅ [핸들러] 삭제 버튼 클릭 시 실행 (모달 열기)
  const handleDeleteClick = (id: number, index: number) => {
    setDeleteTarget({ id, index });
  };

  // ✅ [핸들러] 모달에서 '삭제' 확인 클릭 시 실행
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id, deleteTarget.index); // 실제 삭제 함수 호출
      setDeleteTarget(null); // 모달 닫기 및 초기화
    }
  };

  // ✅ [핸들러] 모달 닫기
  const handleCloseModal = () => {
    setDeleteTarget(null);
  };

  return (
  <>
    <div className={styles.container}>
      {frames.map((frame, index) => {
        const positionClass = getFrameStyle(index);

        return (
          <div
            key={frame.id}
            className={`${styles.frame} ${positionClass}`}
            onClick={() => onSelect(index)}
          >
            {/* 내부 콘텐츠 */}
            <div className={styles.content}>
              {frame.imageUrl ? (
                <img
                  src={frame.imageUrl}
                  alt={`Movie ${frame.id}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: onPosterClick ? 'pointer' : 'default',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPosterClick) {
                      onPosterClick(frame.id);
                    }
                  }}
                />
              ) : (
                <div>{frame.content}</div>
              )}
            </div>

            {/* 하단 액션 버튼 */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPin) {
                    onPin(frame.id);
                  }
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
                  handleDeleteClick(frame.id, index);
                }}
              >
                삭제하기
              </button>
            </div>
          </div>
        );
      })}

      {/* 네비게이션 화살표 */}
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

    {/* 삭제 모달 */}
    {deleteTarget && (
      <DeleteModal
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        movieTitle={frames[deleteTarget.index]?.content || '영화'}
      />
    )}
  </>
);
}