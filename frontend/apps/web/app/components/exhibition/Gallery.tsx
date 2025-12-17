// apps/web/app/components/exhibition/Gallery.tsx
'use client';

import React from 'react';

// Frame 타입 정의 (필요하면 types 폴더로 이동)
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
  onSelect: (index: number) => void; // 액자 클릭 시 중앙 이동
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

  // UI 로직: 인덱스에 따른 클래스 계산 (순수 시각적 로직이므로 여기 둠)
  const getFrameClass = (index: number) => {
    const diff = index - activeIndex;
    if (diff === 0) return 'center';
    if (diff === -1) return 'left-1';
    if (diff === 1) return 'right-1';
    if (diff === -2) return 'left-2';
    if (diff === 2) return 'right-2';
    return 'hidden';
  };

  return (
    <div className="exh-gallery-area">


      {frames.map((frame, index) => {
        const frameClass = getFrameClass(index);
        const isCenter = frameClass === 'center';

        return (
          <div 
            key={frame.id} 
            className={`poster-frame ${frameClass}`}
            onClick={() => onSelect(index)}
          >
            <div className="poster-content" />

            {/* 중앙일 때만 보이는 액션 */}
            <div 
                className="poster-actions" 
                style={{ opacity: isCenter ? 1 : 0, pointerEvents: isCenter ? 'auto' : 'none' }}
            >
              <span style={{ cursor: 'pointer' }}>고정하기 </span>| 
              <span 
                style={{ cursor: 'pointer' }} 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onDelete(frame.id, index);
                }}
              > 삭제하기</span>
            </div>
          </div>
        );
      })}
      <button className="nav-arrow prev" onClick={onPrev} disabled={activeIndex === 0}>
        &lt;
      </button>
      <button 
        className="nav-arrow next" 
        onClick={onNext} 
        disabled={activeIndex === maxIndex || frames.length === 0}
      >
        &gt;
      </button>
    </div>
  );
};