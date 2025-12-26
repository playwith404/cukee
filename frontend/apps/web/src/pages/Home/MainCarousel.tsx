// apps/web/src/pages/Home/MainCarousel.tsx
// 티켓 캐러셀 컴포넌트 - 티켓 슬라이드 애니메이션 및 큐레이터 캐릭터 표시

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Carousel.module.css";

// =============================================================================
// 타입 정의
// =============================================================================

/** 티켓 데이터 인터페이스 */
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

/** 캐러셀 컴포넌트 Props */
interface MainCarouselProps {
  tickets: TicketData[];        // 전체 티켓 목록
  currentIndex: number;         // 현재 선택된 티켓 인덱스
  onNext: () => void;           // 다음 티켓으로 이동 콜백
  onPrev: () => void;           // 이전 티켓으로 이동 콜백
  onTicketClick: (ticketId: number) => void;  // 티켓 클릭 시 콜백
}

/** 슬라이드 위치 타입 - 각 티켓의 화면상 위치 */
type SlidePosition = 'main' | 'second' | 'third' | 'hidden-left' | 'hidden-right';

/** 개별 슬라이드 정보 */
interface TicketSlide {
  ticket: TicketData;
  position: SlidePosition;
  id: number;  // React key용 고유 ID
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

export const MainCarousel: React.FC<MainCarouselProps> = ({
  tickets,
  currentIndex,
  onNext,
  onPrev,
  onTicketClick
}) => {
  const len = tickets.length;

  // ---------------------------------------------------------------------------
  // 상태 관리
  // ---------------------------------------------------------------------------
  const [isAnimating, setIsAnimating] = useState(false);  // 애니메이션 진행 중 여부
  const [slides, setSlides] = useState<TicketSlide[]>([]); // 현재 표시 중인 슬라이드 목록
  const [displayedCharacter, setDisplayedCharacter] = useState<string | null>(null); // 표시 중인 캐릭터 이미지
  const [characterFading, setCharacterFading] = useState(false); // 캐릭터 페이드 애니메이션 상태
  const [shakeDirection, setShakeDirection] = useState<'left' | 'right' | null>(null); // 경계 도달 시 흔들림 방향
  const isInitialMount = useRef(true); // 초기 마운트 여부 추적

  // ---------------------------------------------------------------------------
  // 경계 체크 - 첫/마지막 티켓 여부
  // ---------------------------------------------------------------------------
  const isFirstTicket = currentIndex === 0;
  const isLastTicket = currentIndex === len - 1;

  // ---------------------------------------------------------------------------
  // 슬라이드 생성 함수
  // - 현재 인덱스 기준으로 main, second, third 위치의 슬라이드 생성
  // - 마지막 티켓 근처에서는 남은 티켓 수에 따라 슬라이드 수 조절
  // ---------------------------------------------------------------------------
  const createDefaultSlides = useCallback((idx: number): TicketSlide[] => {
    if (len === 0) return [];

    const slides: TicketSlide[] = [
      { ticket: tickets[idx], position: 'main', id: tickets[idx].id },
    ];

    // 다음 티켓이 있으면 second 위치에 추가
    if (idx + 1 < len) {
      slides.push({ ticket: tickets[idx + 1], position: 'second', id: tickets[idx + 1].id });
    }

    // 그 다음 티켓이 있으면 third 위치에 추가
    if (idx + 2 < len) {
      slides.push({ ticket: tickets[idx + 2], position: 'third', id: tickets[idx + 2].id });
    }

    return slides;
  }, [tickets, len]);

  // ---------------------------------------------------------------------------
  // 초기 마운트 시 슬라이드 및 캐릭터 설정
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (len > 0 && isInitialMount.current) {
      setSlides(createDefaultSlides(currentIndex));
      setDisplayedCharacter(tickets[currentIndex]?.characterImageUrl || null);
      isInitialMount.current = false;
    }
  }, [len, currentIndex, createDefaultSlides, tickets]);

  // ---------------------------------------------------------------------------
  // currentIndex 변경 시 슬라이드 동기화 (애니메이션 완료 후)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isAnimating && !isInitialMount.current && len > 0) {
      setSlides(createDefaultSlides(currentIndex));
      setDisplayedCharacter(tickets[currentIndex]?.characterImageUrl || null);
    }
  }, [currentIndex, isAnimating, createDefaultSlides, len, tickets]);

  if (len === 0) return null;

  // ---------------------------------------------------------------------------
  // 다음(→) 버튼 핸들러
  // - 마지막 티켓이면 흔들림 애니메이션
  // - 그 외에는 슬라이드를 왼쪽으로 이동
  // ---------------------------------------------------------------------------
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || len <= 1) return;

    // 마지막 티켓 도달 시 흔들림 피드백
    if (isLastTicket) {
      setShakeDirection('right');
      setTimeout(() => setShakeDirection(null), 400);
      return;
    }

    setIsAnimating(true);

    // 1단계: 새로 들어올 티켓이 있으면 화면 밖 오른쪽에 배치
    const nextThirdIndex = currentIndex + 3;
    const hasEnteringTicket = nextThirdIndex < len;

    if (hasEnteringTicket) {
      const enteringTicket = tickets[nextThirdIndex];
      setSlides(prev => [
        ...prev,
        { ticket: enteringTicket, position: 'hidden-right', id: enteringTicket.id + 1000 }
      ]);
    }

    // 2단계: 다음 프레임에서 모든 슬라이드 위치 변경 (CSS transition 트리거)
    // - main → hidden-left (왼쪽으로 퇴장)
    // - second → main (메인으로 승격)
    // - third → second
    // - hidden-right → third (새 티켓 등장)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCharacterFading(true); // 캐릭터 페이드 아웃 시작
        setSlides(prev => {
          const slideCount = prev.length;
          return prev.map((slide, idx) => {
            if (idx === 0) return { ...slide, position: 'hidden-left' };
            if (idx === 1) return { ...slide, position: 'main' };
            if (idx === 2) return { ...slide, position: 'second' };
            if (idx === 3 && slideCount === 4) return { ...slide, position: 'third' };
            return slide;
          });
        });
      });
    });

    // 캐릭터 이미지 교체 (페이드 중간 시점)
    const nextCharacter = tickets[currentIndex + 1]?.characterImageUrl || null;
    setTimeout(() => {
      setDisplayedCharacter(nextCharacter);
      setCharacterFading(false); // 페이드 인
    }, 200);

    // 3단계: 애니메이션 완료 후 상태 정리
    setTimeout(() => {
      onNext(); // 부모 컴포넌트에 인덱스 변경 알림
      setIsAnimating(false);
    }, 450);
  };

  // ---------------------------------------------------------------------------
  // 이전(←) 버튼 핸들러
  // - 첫 번째 티켓이면 흔들림 애니메이션
  // - 그 외에는 슬라이드를 오른쪽으로 이동
  // ---------------------------------------------------------------------------
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || len <= 1) return;

    // 첫 번째 티켓 도달 시 흔들림 피드백
    if (isFirstTicket) {
      setShakeDirection('left');
      setTimeout(() => setShakeDirection(null), 400);
      return;
    }

    setIsAnimating(true);

    // 1단계: 이전 티켓을 화면 밖 왼쪽에 배치
    const prevIndex = currentIndex - 1;
    const enteringTicket = tickets[prevIndex];

    setSlides(prev => [
      { ticket: enteringTicket, position: 'hidden-left', id: enteringTicket.id + 2000 },
      ...prev
    ]);

    // 2단계: 다음 프레임에서 모든 슬라이드 위치 변경
    // - hidden-left → main (새 티켓이 메인으로)
    // - main → second
    // - second → third
    // - third → hidden-right (오른쪽으로 퇴장)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCharacterFading(true);
        setSlides(prev => {
          const slideCount = prev.length;
          return prev.map((slide, idx) => {
            if (idx === 0) return { ...slide, position: 'main' };
            if (idx === 1) return { ...slide, position: 'second' };
            if (idx === 2) return { ...slide, position: 'third' };
            if (idx >= 3 && slideCount > 3) return { ...slide, position: 'hidden-right' };
            return slide;
          });
        });
      });
    });

    // 캐릭터 이미지 교체
    const prevCharacter = enteringTicket?.characterImageUrl || null;
    setTimeout(() => {
      setDisplayedCharacter(prevCharacter);
      setCharacterFading(false);
    }, 200);

    // 3단계: 애니메이션 완료 후 상태 정리
    setTimeout(() => {
      onPrev();
      setIsAnimating(false);
    }, 450);
  };

  // ---------------------------------------------------------------------------
  // 슬라이드 위치에 따른 CSS 클래스 반환
  // ---------------------------------------------------------------------------
  const getPositionClass = (position: SlidePosition): string => {
    switch (position) {
      case 'main':
        return styles.layerMain;
      case 'second':
        return styles.layerSecond;
      case 'third':
        return styles.layerThird;
      case 'hidden-left':
        return styles.layerHiddenLeft;
      case 'hidden-right':
        return styles.layerHiddenRight;
      default:
        return '';
    }
  };

  const mainTicket = tickets[currentIndex];

  // ---------------------------------------------------------------------------
  // 렌더링
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      {/* 큐레이터 캐릭터 이미지 */}
      <div className={styles.characterArea}>
        {displayedCharacter && (
          <img
            src={displayedCharacter}
            alt="Character"
            className={`${styles.characterImg} ${characterFading ? styles.characterFading : ''}`}
          />
        )}
      </div>

      {/* 티켓 슬라이드 영역 */}
      <div
        className={`${styles.ticketCluster} ${shakeDirection === 'left' ? styles.shakeLeft : ''} ${shakeDirection === 'right' ? styles.shakeRight : ''}`}
        onClick={() => mainTicket && onTicketClick(mainTicket.id)}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`${styles.ticketBase} ${getPositionClass(slide.position)}`}
            style={{
              width: `${slide.ticket.width}px`,
              height: `${slide.ticket.height}px`
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
      <button className={styles.prevBtn} onClick={handlePrev} disabled={isAnimating}>
        &lt;
      </button>
      <button className={styles.nextBtn} onClick={handleNext} disabled={isAnimating}>
        &gt;
      </button>

      {/* 티켓 상세 페이지 링크 */}
      <div className={styles.linkText} onClick={() => mainTicket && onTicketClick(mainTicket.id)}>
        티켓만 보기 &gt;
      </div>
    </div>
  );
};
