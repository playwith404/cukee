import styles from './Gallery3D.module.css';

export interface Frame {
  id: number;
  content?: string;
  imageUrl?: string;
}

interface Gallery3DProps {
  frames: Frame[];
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: number, index: number) => void;
  onSelect: (index: number) => void;
}

export const Gallery3D = ({
  frames,
  activeIndex,
  onPrev,
  onNext,
  onDelete,
  onSelect
}: Gallery3DProps) => {
  const maxIndex = frames.length - 1;

  const getFrameStyle = (index: number) => {
    const diff = index - activeIndex;

    if (diff === 0) return styles.center;
    if (diff === -1) return styles.left1;
    if (diff === 1) return styles.right1;
    if (diff === -2) return styles.left2;
    if (diff === 2) return styles.right2;

    return styles.hidden;
  };

  return (
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
                  {frame.content || `영화 ID: ${frame.id}`}
                </div>
              )}
            </div>

            {/* 하단 액션 버튼 */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
              >
                고정하기
              </button>
              <span className={styles.divider}>|</span>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('삭제 클릭됨');
                  onDelete(frame.id, index);
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
  );
};