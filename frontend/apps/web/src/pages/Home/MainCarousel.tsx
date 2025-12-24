// apps/web/src/pages/Home/MainCarousel.tsx

import React, { useState } from "react";
// 👇 CSS Module 임포트 (파일 경로는 같은 폴더 가정)
import styles from "./Carousel.module.css";

// 타입 정의 (필요하다면 types.ts로 분리해도 되지만, 일단 여기에 둠)
export interface TicketData {
  id: number;
  title: string;
  curatorName: string;
  tags: string[];
  ticketImageUrl: string;
  characterImageUrl: string | null;
  width: number;
  height: number;
}

interface MainCarouselProps {
  tickets: TicketData[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onTicketClick: (ticketId: number) => void;
}

export const MainCarousel: React.FC<MainCarouselProps> = ({
  tickets,
  currentIndex,
  onNext,
  onPrev,
  onTicketClick
}) => {
  const len = tickets.length;
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  if (len === 0) return null;

  // 1. 현재(Main) - 2. 다음(Second) - 3. 다다음(Third) 순서
  const mainTicket = tickets[currentIndex % len];
  const secondTicket = tickets[(currentIndex + 1) % len];
  const thirdTicket = tickets[(currentIndex + 2) % len];

  if (!mainTicket) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    setDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      onNext();
      setIsAnimating(false);
      setDirection(null);
    }, 500);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    setDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      onPrev();
      setIsAnimating(false);
      setDirection(null);
    }, 500);
  };

  // 방향에 따른 애니메이션 클래스 매핑 함수
  const getAnimationClass = () => {
    if (!direction) return '';
    return direction === 'left' ? styles.animateLeft : styles.animateRight;
  };

  const animClass = getAnimationClass();

  return (
    <div className={styles.container}>
      
      {/* 캐릭터 영역 */}
      <div className={styles.characterArea}>
        {mainTicket.characterImageUrl && (
          <img 
            src={mainTicket.characterImageUrl} 
            alt="Character" 
            className={styles.characterImg}
          />
        )}
      </div>

      {/* 티켓 뭉치 영역 */}
      <div 
        className={styles.ticketCluster} 
        onClick={() => onTicketClick(mainTicket.id)}
      >
        {/* [3번: Third] 제일 뒤 */}
        {thirdTicket && (
          <div
            className={`${styles.ticketBase} ${styles.layerThird} ${animClass}`}
            style={{ width: `${thirdTicket.width}px`, height: `${thirdTicket.height}px` }}
          >
            <img src={thirdTicket.ticketImageUrl} alt="" className={styles.ticketImg} />
          </div>
        )}

        {/* [2번: Second] 중간 */}
        {secondTicket && (
          <div
            className={`${styles.ticketBase} ${styles.layerSecond} ${animClass}`}
            style={{ width: `${secondTicket.width}px`, height: `${secondTicket.height}px` }}
          >
            <img src={secondTicket.ticketImageUrl} alt="" className={styles.ticketImg} />
          </div>
        )}

        {/* [1번: Main] 제일 앞 */}
        <div
          className={`${styles.ticketBase} ${styles.layerMain} ${animClass}`}
          style={{ width: `${mainTicket.width}px`, height: `${mainTicket.height}px` }}
        >
          <img
            src={mainTicket.ticketImageUrl}
            alt={mainTicket.title}
            className={styles.ticketImg}
          />
        </div>
      </div>

      {/* 버튼들 (< , >) */}
      <button className={styles.prevBtn} onClick={handlePrev}>
        &lt;
      </button>
      <button className={styles.nextBtn} onClick={handleNext}>
        &gt;
      </button>

      {/* 링크 텍스트 */}
      <div className={styles.linkText} onClick={() => onTicketClick(mainTicket.id)}>
         티켓만 보기 &gt;
      </div>
    </div>
  );
};