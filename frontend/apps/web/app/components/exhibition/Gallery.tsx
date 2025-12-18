// apps/web/app/components/exhibition/Gallery.tsx
'use client';

import React from 'react';
// 👇 CSS 모듈 import 확인
import styles from './Gallery.module.css';

export interface Frame {
  id: number;
  content: string;
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

  // 👇 현재 인덱스에 맞는 스타일 객체(클래스명)를 반환하는 함수
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
    // 👇 .exh-gallery-area 대신 styles.container 사용
    <div className={styles.container}>

      {frames.map((frame, index) => {
        // 1. 현재 액자의 위치 클래스 가져오기
        const positionClass = getFrameStyle(index);
        
        // 2. 중앙인지 확인 (객체 비교)
        const isCenter = positionClass === styles.center;

        return (
          <div 
            key={frame.id} 
            // 3. 템플릿 리터럴로 클래스 합치기
            className={`${styles.frame} ${positionClass}`}
            onClick={() => onSelect(index)}
          >
            {/* 내부 콘텐츠 */}
            <div className={styles.content} />

            {/* 하단 액션 버튼 (고정하기/삭제하기) */}
            <div 
                className={styles.actions} 
            >
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
                    e.stopPropagation(); // 부모(액자 선택) 클릭 방지
                    console.log('삭제 클릭됨'); // 디버깅용 로그
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