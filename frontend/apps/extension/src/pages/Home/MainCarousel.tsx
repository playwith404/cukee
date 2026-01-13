import React, { useState, useEffect, useCallback } from "react";
import styles from "./Carousel.module.css";

// =============================================================================
// 타입 정의
// =============================================================================

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
  animatingTicketId: number | null;
  viewMode: 'default' | 'viewAll';
  onToggleViewMode: () => void;
}

type SlidePosition = 'main' | 'second' | 'third' | 'fourth' | 'fifth' | 'hidden-left' | 'hidden-right';

interface TicketSlide {
  ticket: TicketData;
  position: SlidePosition;
  id: number;
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export const MainCarousel: React.FC<MainCarouselProps> = ({
  tickets,
  currentIndex,
  onNext,
  onPrev,
  onTicketClick,
  animatingTicketId,
  viewMode,
  onToggleViewMode
}) => {
  const len = tickets.length;

  const [isAnimating, setIsAnimating] = useState(false);
  const [slides, setSlides] = useState<TicketSlide[]>([]);
  
  // ---------------------------------------------------------------------------
  // [핵심 수정] 캐릭터 크로스페이드를 위한 2개의 상태
  // ---------------------------------------------------------------------------
  const [activeChar, setActiveChar] = useState<string | null>(null);   // 현재 보여질 캐릭터
  const [fadingChar, setFadingChar] = useState<string | null>(null);   // 사라질(이전) 캐릭터
  const [triggerAnim, setTriggerAnim] = useState(false);               // 애니메이션 트리거
  
  // const [shakeDirection, setShakeDirection] = useState<'left' | 'right' | null>(null);

  const mainTicket = tickets[currentIndex];
  const isClickAnimating = mainTicket && animatingTicketId === mainTicket.id;
  
  // 클릭 시 활성화된(밝은) 캐릭터 이미지 URL
  const activeCharacterUrl = activeChar 
    ? activeChar.replace('h_cara', 'cara') 
    : null;

  // const isFirstTicket = currentIndex === 0;
  // const isLastTicket = currentIndex === len - 1;

  // ---------------------------------------------------------------------------
  // 슬라이드 생성 함수
  // ---------------------------------------------------------------------------
  // const createDefaultSlides = useCallback((idx: number): TicketSlide[] => {
  //   if (len === 0) return [];

  //   const slides: TicketSlide[] = [
  //     { ticket: tickets[idx], position: 'main', id: tickets[idx].id },
  //   ];

  //   //const limit = viewMode === 'viewAll' ? 4 : 2;
  //   const limit = 5;

  //   for (let i = 1; i <= limit; i++) {
  //     if (idx + i < len) {
  //       let pos: SlidePosition = 'second';
  //       if (i === 2) pos = 'third';
  //       if (i === 3) pos = 'fourth';
  //       if (i === 4) pos = 'fifth';
  //       if (i === 5) pos = 'hidden-right';

  //       slides.push({ ticket: tickets[idx + i], position: pos, id: tickets[idx + i].id });
  //     }
  //   }
  //   return slides;
  // }, [tickets, len]);
  const createDefaultSlides = useCallback((idx: number): TicketSlide[] => {
    if (len === 0) return [];

    const slides: TicketSlide[] = [];

    // 1. 왼쪽 대기 (Previous) - [수정] 0번보다 작아지면 마지막 번호로 (순환)
    const prevIdx = (idx - 1 + len) % len;
    slides.push({ 
        ticket: tickets[prevIdx], 
        position: 'hidden-left', 
        // 🚨 주의: 티켓 개수가 적으면 키가 겹칠 수 있으니 position을 섞어 키를 만듭니다
        id: tickets[prevIdx].id 
    });

    // 2. 현재 메인 (Main)
    slides.push({ ticket: tickets[idx], position: 'main', id: tickets[idx].id });

    // 3. 오른쪽 대기 (Next 1~5)
    const limit = 5; 

    for (let i = 1; i <= limit; i++) {
      // ⭐️ [핵심] 배열 길이를 넘어가면 다시 0, 1, 2... 로 돌아가는 공식
      const nextIdx = (idx + i) % len;

      let pos: SlidePosition = 'second';
      if (i === 2) pos = 'third';
      if (i === 3) pos = 'fourth';
      if (i === 4) pos = 'fifth';
      if (i === 5) pos = 'hidden-right';

      slides.push({ ticket: tickets[nextIdx], position: pos, id: tickets[nextIdx].id });
    }
    return slides;
  }, [tickets, len]);

  // ---------------------------------------------------------------------------
  // [핵심 수정] 이미지 프리로딩 및 상태 교체 로직
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (len > 0) {
      setSlides(createDefaultSlides(currentIndex));
      
      const nextCharUrl = tickets[currentIndex]?.characterImageUrl || null;

      // 이미지가 실제로 바뀌었을 때만 로직 실행
      if (nextCharUrl !== activeChar) {
        
        // 1. 이미지가 존재한다면 '미리 로딩(Preload)'을 시도합니다.
        //    (로딩 없이 바로 띄우면 이미지가 안 뜬 상태로 페이드인되어 깜빡거림)
        if (nextCharUrl) {
            const img = new Image();
            img.src = nextCharUrl;
            
            // 로딩이 완료되면 교체 진행
            img.onload = () => {
                setFadingChar(activeChar); // 기존 이미지를 '퇴장' 상태로
                setActiveChar(nextCharUrl); // 새 이미지를 '입장' 상태로
                setTriggerAnim(true);       // 애니메이션 시작

                // 애니메이션 시간(0.4s) 후 정리
                setTimeout(() => {
                    setFadingChar(null);
                    setTriggerAnim(false);
                }, 400);
            };
        } else {
            // 새 이미지가 null인 경우 (바로 삭제)
            setFadingChar(activeChar);
            setActiveChar(null);
            setTriggerAnim(true);
            setTimeout(() => {
                setFadingChar(null);
                setTriggerAnim(false);
            }, 400);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len, currentIndex, tickets]); // activeChar는 의존성에서 뺍니다 (무한루프 방지)

  if (len === 0) return null;

  // ---------------------------------------------------------------------------
  // 이벤트 핸들러
  // ---------------------------------------------------------------------------
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || len <= 1) return;

    // if (isLastTicket) {
    //   setShakeDirection('right');
    //   setTimeout(() => setShakeDirection(null), 400);
    //   return;
    // }

    setIsAnimating(true);
    onNext();
    setTimeout(() => setIsAnimating(false), 450); 
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || len <= 1) return;

    // if (isFirstTicket) {
    //   setShakeDirection('left');
    //   setTimeout(() => setShakeDirection(null), 400);
    //   return;
    // }

    setIsAnimating(true);
    onPrev();
    setTimeout(() => setIsAnimating(false), 450);
  };

  const getPositionClass = (position: SlidePosition): string => {
    switch (position) {
      case 'main': return styles.layerMain;
      case 'second': return styles.layerSecond;
      case 'third': return styles.layerThird;
      case 'fourth': return styles.layerFourth;
      case 'fifth': return styles.layerFifth;
      case 'hidden-left': return styles.layerHiddenLeft;
      case 'hidden-right': return styles.layerHiddenRight;
      default: return '';
    }
  };

  return (
    <div className={`${styles.container} ${viewMode === 'viewAll' ? styles.viewAllMode : ''}`}>
      <div className={styles.responsiveBackDrop}></div>
      {/* [캐릭터 영역 수정]
         activeChar(입장)와 fadingChar(퇴장) 두 개의 이미지를 동시에 렌더링합니다.
      */}
      <div 
        className={styles.characterArea}
        style={{ 
            opacity: viewMode === 'viewAll' ? 0 : 1, 
            transition: 'opacity 0.4s ease' 
        }}
      >
        {/* 1. 사라지는 캐릭터 (fadingChar) */}
        {fadingChar && (
          <img
            src={fadingChar}
            alt="Character Fading Out"
            className={`${styles.characterImg} ${styles.fadeOut}`}
          />
        )}

        {/* 2. 나타나는 캐릭터 (activeChar) */}
        {activeChar && (
          <img
            src={activeChar}
            alt="Character Fading In"
            className={`${styles.characterImg} ${triggerAnim ? styles.fadeIn : ''}`}
            // 애니메이션 중이 아닐 때는 항상 100% 보이게 설정
            style={{ opacity: (!fadingChar && !triggerAnim) ? 1 : undefined }}
          />
        )}

        {/* 3. 클릭 시 강조되는 캐릭터 */}
        {activeCharacterUrl && (
          <img
            src={activeCharacterUrl}
            alt="Character Active"
            className={styles.characterImg}
            style={{
              zIndex: 20, 
              transition: 'opacity 0.2s ease-in-out',
              opacity: isClickAnimating ? 1 : 0,
            }}
          />
        )}
      </div>

      {/* 티켓 슬라이드 영역 */}
      <div className={`${styles.ticketCluster} ${viewMode === 'viewAll' ? styles.clusterExpanded : ''}`}>
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`${styles.ticketBase} ${getPositionClass(slide.position)}`}
            onClick={() => onTicketClick(slide.ticket.id)}
            style={{
              aspectRatio: `${slide.ticket.width} / ${slide.ticket.height}`
            }}
          >
            <img
              src={slide.ticket.ticketImageUrl}
              alt={slide.ticket.title}
              className={styles.ticketImg}
            />
          </div>
        ))}
      </div>

      {/* 네비게이션 버튼 */}
      <button className={styles.prevBtn} onClick={handlePrev} disabled={isAnimating || isClickAnimating}>
        &lt;
      </button>
      <button className={styles.nextBtn} onClick={handleNext} disabled={isAnimating || isClickAnimating}>
        &gt;
      </button>

      {/* 티켓만 보기 버튼 */}
      {viewMode === 'default' && (
        <div 
          className={styles.linkText} 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleViewMode(); 
          }}
        >
          티켓만 보기 &gt;
        </div>
      )}

      {viewMode === 'viewAll' && (
         <div 
           className={styles.backButtonFixed}
           onClick={(e) => { e.stopPropagation(); onToggleViewMode(); }}
         >
            &lt; 돌아가기
         </div>
      )}

    </div>
  );
};