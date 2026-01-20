/**
 * MainCarousel.tsx
 *
 * 메인 캐러셀 컴포넌트
 *
 * 주요 기능:
 * - 티켓 카드 스택 형태의 캐러셀
 * - 캐릭터 이미지 크로스페이드 애니메이션
 * - 좌/우 네비게이션
 * - viewAll 모드 (티켓만 보기)
 *
 * 반응형 처리:
 * - deviceType prop으로 디바이스 타입 전달받음
 * - 디바이스별로 다른 CSS 모듈 적용
 * - Desktop: Carousel.module.css
 * - Tablet: Carousel.tablet.module.css
 * - Mobile: Carousel.mobile.module.css
 *
 * 슬라이드 구조:
 * - main: 현재 메인 티켓 (가장 앞)
 * - second ~ fifth: 뒤쪽으로 겹쳐진 티켓들
 * - hidden-left/right: 화면 밖 대기 티켓
 */

import React, { useState, useEffect, useCallback } from "react";
import type { DeviceType } from "../../hooks/useResponsive";

// =============================================================================
// CSS 모듈 import (디바이스별 분리)
// =============================================================================
import desktopStyles from "./Carousel.module.css";
import tabletStyles from "./Carousel.tablet.module.css";
import mobileStyles from "./Carousel.mobile.module.css";

// =============================================================================
// 타입 정의
// =============================================================================

/**
 * 티켓 데이터 인터페이스
 */
export interface TicketData {
  /** 티켓 고유 ID */
  id: number;
  /** 티켓 제목 */
  title: string;
  /** 큐레이터 이름 */
  curatorName: string;
  /** 태그 목록 */
  tags: string[];
  /** 티켓 이미지 URL */
  ticketImageUrl: string;
  /** 캐릭터 이미지 URL (없을 수 있음) */
  characterImageUrl: string | null;
  /** 티켓 이미지 너비 */
  width: number;
  /** 티켓 이미지 높이 */
  height: number;
}

/**
 * MainCarousel 컴포넌트 Props
 */
interface MainCarouselProps {
  /** 티켓 데이터 배열 */
  tickets: TicketData[];
  /** 현재 선택된 티켓 인덱스 */
  currentIndex: number;
  /** 다음 티켓으로 이동 핸들러 */
  onNext: () => void;
  /** 이전 티켓으로 이동 핸들러 */
  onPrev: () => void;
  /** 티켓 클릭 핸들러 */
  onTicketClick: (ticketId: number) => void;
  /** 클릭 애니메이션 중인 티켓 ID */
  animatingTicketId: number | null;
  /** 현재 뷰 모드 ('default' 또는 'viewAll') */
  viewMode: 'default' | 'viewAll';
  /** 뷰 모드 토글 핸들러 */
  onToggleViewMode: () => void;
  /** 현재 디바이스 타입 */
  deviceType: DeviceType;
}

/**
 * 슬라이드 위치 타입
 * - main: 메인 (가장 앞)
 * - second ~ fifth: 뒤쪽 레이어
 * - hidden-left/right: 화면 밖 대기
 */
type SlidePosition = 'main' | 'second' | 'third' | 'fourth' | 'fifth' | 'hidden-left' | 'hidden-right';

/**
 * 슬라이드 아이템 인터페이스
 */
interface TicketSlide {
  /** 티켓 데이터 */
  ticket: TicketData;
  /** 슬라이드 위치 */
  position: SlidePosition;
  /** 티켓 ID (React key용) */
  id: number;
}

// =============================================================================
// 메인 컴포넌트
// =============================================================================

/**
 * MainCarousel 컴포넌트
 *
 * 티켓 카드들을 스택 형태로 표시하는 캐러셀입니다.
 * 캐릭터 이미지의 크로스페이드 애니메이션을 지원합니다.
 */
export const MainCarousel: React.FC<MainCarouselProps> = ({
  tickets,
  currentIndex,
  onNext,
  onPrev,
  onTicketClick,
  animatingTicketId,
  viewMode,
  onToggleViewMode,
  deviceType
}) => {
  // ---------------------------------------------------------------------------
  // 반응형 스타일 선택
  // ---------------------------------------------------------------------------
  const styles = deviceType === 'mobile'
    ? mobileStyles
    : deviceType === 'tablet'
      ? tabletStyles
      : desktopStyles;

  /** 티켓 총 개수 */
  const len = tickets.length;

  // ---------------------------------------------------------------------------
  // State 정의
  // ---------------------------------------------------------------------------

  /** 슬라이드 전환 애니메이션 진행 중 여부 */
  const [isAnimating, setIsAnimating] = useState(false);

  /** 현재 렌더링할 슬라이드 배열 */
  const [slides, setSlides] = useState<TicketSlide[]>([]);

  // ---------------------------------------------------------------------------
  // 캐릭터 크로스페이드 애니메이션 상태
  // - 두 개의 캐릭터 이미지를 동시에 렌더링하여 부드러운 전환 효과 구현
  // ---------------------------------------------------------------------------

  /** 현재 보여질 캐릭터 이미지 URL */
  const [activeChar, setActiveChar] = useState<string | null>(null);

  /** 사라질(이전) 캐릭터 이미지 URL */
  const [fadingChar, setFadingChar] = useState<string | null>(null);

  /** 크로스페이드 애니메이션 트리거 */
  const [triggerAnim, setTriggerAnim] = useState(false);

  // ---------------------------------------------------------------------------
  // 파생 값 (Derived Values)
  // ---------------------------------------------------------------------------

  /** 현재 메인 티켓 */
  const mainTicket = tickets[currentIndex];

  /** 현재 티켓이 클릭 애니메이션 중인지 여부 */
  const isClickAnimating = mainTicket && animatingTicketId === mainTicket.id;

  /**
   * 클릭 시 활성화되는 밝은 캐릭터 이미지 URL
   * - 'h_cara'를 'cara'로 변환하여 밝은 버전 사용
   */
  const activeCharacterUrl = activeChar
    ? activeChar.replace('h_cara', 'cara')
    : null;

  // ---------------------------------------------------------------------------
  // 슬라이드 생성 함수
  // ---------------------------------------------------------------------------

  /**
   * 현재 인덱스 기준으로 슬라이드 배열 생성
   *
   * 슬라이드 구조:
   * 1. hidden-left: 왼쪽 대기 (이전 티켓)
   * 2. main: 현재 메인 티켓
   * 3. second ~ fifth: 오른쪽 뒤 티켓들
   * 4. hidden-right: 오른쪽 대기 티켓
   *
   * @param idx - 현재 티켓 인덱스
   * @returns 슬라이드 배열
   */
  const createDefaultSlides = useCallback((idx: number): TicketSlide[] => {
    if (len === 0) return [];

    const slides: TicketSlide[] = [];

    // 1. 왼쪽 대기 (Previous) - 순환 처리
    const prevIdx = (idx - 1 + len) % len;
    slides.push({
      ticket: tickets[prevIdx],
      position: 'hidden-left',
      id: tickets[prevIdx].id
    });

    // 2. 현재 메인 (Main)
    slides.push({
      ticket: tickets[idx],
      position: 'main',
      id: tickets[idx].id
    });

    // 3. 오른쪽 레이어들 (second ~ hidden-right)
    const limit = 5;
    for (let i = 1; i <= limit; i++) {
      const nextIdx = (idx + i) % len;

      // 위치 결정
      let pos: SlidePosition = 'second';
      if (i === 2) pos = 'third';
      if (i === 3) pos = 'fourth';
      if (i === 4) pos = 'fifth';
      if (i === 5) pos = 'hidden-right';

      slides.push({
        ticket: tickets[nextIdx],
        position: pos,
        id: tickets[nextIdx].id
      });
    }

    return slides;
  }, [tickets, len]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * 슬라이드 및 캐릭터 이미지 업데이트
   *
   * - currentIndex 변경 시 슬라이드 재생성
   * - 캐릭터 이미지 변경 시 크로스페이드 애니메이션 실행
   * - 이미지 프리로딩으로 부드러운 전환 보장
   */
  useEffect(() => {
    if (len > 0) {
      // 슬라이드 배열 업데이트
      setSlides(createDefaultSlides(currentIndex));

      const nextCharUrl = tickets[currentIndex]?.characterImageUrl || null;

      // 이미지가 실제로 바뀌었을 때만 애니메이션 실행
      if (nextCharUrl !== activeChar) {
        if (nextCharUrl) {
          // 새 이미지 프리로딩
          const img = new Image();
          img.src = nextCharUrl;

          // 로딩 완료 후 크로스페이드 실행
          img.onload = () => {
            setFadingChar(activeChar);    // 기존 이미지 → 퇴장
            setActiveChar(nextCharUrl);   // 새 이미지 → 입장
            setTriggerAnim(true);         // 애니메이션 시작

            // 애니메이션 완료 후 정리 (0.4초)
            setTimeout(() => {
              setFadingChar(null);
              setTriggerAnim(false);
            }, 400);
          };
        } else {
          // 새 이미지가 없는 경우 (캐릭터 제거)
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
  }, [len, currentIndex, tickets]); // activeChar 의존성 제외 (무한루프 방지)

  // ---------------------------------------------------------------------------
  // Early Return
  // ---------------------------------------------------------------------------

  // 티켓이 없으면 렌더링하지 않음
  if (len === 0) return null;

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * 다음 버튼 클릭 핸들러
   * - 애니메이션 중이면 무시
   * - 450ms 동안 추가 클릭 방지
   */
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || len <= 1) return;

    setIsAnimating(true);
    onNext();
    setTimeout(() => setIsAnimating(false), 450);
  };

  /**
   * 이전 버튼 클릭 핸들러
   * - 애니메이션 중이면 무시
   * - 450ms 동안 추가 클릭 방지
   */
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating || len <= 1) return;

    setIsAnimating(true);
    onPrev();
    setTimeout(() => setIsAnimating(false), 450);
  };

  /**
   * 슬라이드 위치에 해당하는 CSS 클래스 반환
   * @param position - 슬라이드 위치
   * @returns CSS 클래스명
   */
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={`${styles.container} ${viewMode === 'viewAll' ? styles.viewAllMode : ''}`}>

      {/* 반응형 배경 (viewAll 모드에서 사용) */}
      <div className={styles.responsiveBackDrop}></div>

      {/* ===================================================================
          캐릭터 영역
          - 크로스페이드 애니메이션을 위해 두 개의 이미지 동시 렌더링
          - Mobile/Tablet에서는 CSS로 숨김 처리
          - viewAll 모드에서는 투명도 0으로 숨김
          =================================================================== */}
      <div
        className={styles.characterArea}
        style={{
          opacity: viewMode === 'viewAll' ? 0 : 1,
          transition: 'opacity 0.4s ease'
        }}
      >
        {/* 1. 사라지는 캐릭터 (페이드 아웃) */}
        {fadingChar && (
          <img
            src={fadingChar}
            alt="Character Fading Out"
            className={`${styles.characterImg} ${styles.fadeOut}`}
          />
        )}

        {/* 2. 나타나는 캐릭터 (페이드 인) */}
        {activeChar && (
          <img
            src={activeChar}
            alt="Character Fading In"
            className={`${styles.characterImg} ${triggerAnim ? styles.fadeIn : ''}`}
            style={{ opacity: (!fadingChar && !triggerAnim) ? 1 : undefined }}
          />
        )}

        {/* 3. 클릭 시 강조되는 밝은 캐릭터 */}
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

      {/* ===================================================================
          티켓 슬라이드 영역
          - 스택 형태로 티켓들 배치
          - viewAll 모드에서는 펼쳐진 형태로 표시
          =================================================================== */}
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

      {/* ===================================================================
          네비게이션 버튼
          - 애니메이션 중이거나 클릭 애니메이션 중이면 비활성화
          =================================================================== */}
      <button
        className={styles.prevBtn}
        onClick={handlePrev}
        disabled={isAnimating || isClickAnimating}
      >
        &lt;
      </button>
      <button
        className={styles.nextBtn}
        onClick={handleNext}
        disabled={isAnimating || isClickAnimating}
      >
        &gt;
      </button>

      {/* ===================================================================
          모드 전환 버튼
          - default 모드: "티켓만 보기" 링크 표시
          - viewAll 모드: "돌아가기" 버튼 표시
          - 태블릿/모바일 모드에서는 표시하지 않음
          =================================================================== */}
      {viewMode === 'default' && deviceType !== 'tablet' && deviceType !== 'mobile' && (
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

      {viewMode === 'viewAll' && deviceType !== 'tablet' && deviceType !== 'mobile' && (
        <div
          className={styles.backButtonFixed}
          onClick={(e) => {
            e.stopPropagation();
            onToggleViewMode();
          }}
        >
          &lt; 돌아가기
        </div>
      )}
    </div>
  );
};
