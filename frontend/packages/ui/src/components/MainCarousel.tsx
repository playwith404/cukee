import React, { useState } from "react";

interface TicketData {
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

  // 1. 현재(Main) - 2. 다음(Second) - 3. 다다음(Third) 순서로 정의
  const mainTicket = tickets[currentIndex % len];
  const secondTicket = tickets[(currentIndex + 1) % len];
  const thirdTicket = tickets[(currentIndex + 2) % len];

  if (!mainTicket) return null;

  // 애니메이션 핸들러
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

  return (
    <div className="mc-container">
      
      {/* 캐릭터 영역 (그대로 유지) */}
      <div className="mc-character-area">
        <img src={mainTicket.characterImageUrl || ''} alt="Character" className="mc-character-img"/>
      </div>

      {/* 티켓 뭉치 영역 */}
      <div className={`mc-ticket-cluster ${direction ? `slide-${direction}` : ''}`} onClick={() => onTicketClick(mainTicket.id)}>

        {/* [3번: Third] 제일 뒤, 제일 작음 */}
        {thirdTicket && (
          <div
            className={`mc-ticket-base mc-layer-third ${direction ? `animate-${direction}` : ''}`}
            style={{ width: `${thirdTicket.width}px`, height: `${thirdTicket.height}px` }}
          >
            <img src={thirdTicket.ticketImageUrl} alt="" className="mc-ticket-img" />
          </div>
        )}

        {/* [2번: Second] 중간 뒤, 중간 작음 */}
        {secondTicket && (
          <div
            className={`mc-ticket-base mc-layer-second ${direction ? `animate-${direction}` : ''}`}
            style={{ width: `${secondTicket.width}px`, height: `${secondTicket.height}px` }}
          >
            <img src={secondTicket.ticketImageUrl} alt="" className="mc-ticket-img" />
          </div>
        )}

        {/* [1번: Main] 제일 앞, 원본 크기 */}
        <div
          className={`mc-ticket-base mc-layer-main ${direction ? `animate-${direction}` : ''}`}
          style={{ width: `${mainTicket.width}px`, height: `${mainTicket.height}px` }}
        >
          <img
            src={mainTicket.ticketImageUrl}
            alt={mainTicket.title}
            className="mc-ticket-img"
          />
        </div>

      </div>

      {/* 버튼들 (< , >) */}
      <button className="mc-prev-btn" onClick={handlePrev}>
        &lt;
      </button>
      <button className="mc-next-btn" onClick={handleNext}>
        &gt;
      </button>

      
      <div className="mc-link-text" onClick={() => onTicketClick(mainTicket.id)}>
         티켓만 보기 &gt;
      </div>
    </div>
  );
};