/**
 * Home.tsx
 *
 * 메인 홈 페이지 컴포넌트
 *
 * 주요 기능:
 * - 반응형 디자인 (Desktop/Tablet/Mobile)
 * - 티켓 캐러셀 표시
 * - 큐레이터 정보 표시
 * - 좋아요 기능
 * - viewAll 모드 (티켓만 보기)
 *
 * 반응형 처리:
 * - useResponsive 훅으로 디바이스 타입 감지
 * - 디바이스별로 다른 CSS 모듈 적용
 * - Desktop: Home.module.css
 * - Tablet: Home.tablet.module.css
 * - Mobile: Home.mobile.module.css
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainCarousel } from './MainCarousel';
import { Header } from '../../components/Header/Header';
import { fetchTickets, toggleTicketLike, type Ticket } from '../../apis/exhibition';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { FALLBACK_TICKETS } from './fallbackData';
import { HiHeart, HiOutlineHeart } from "react-icons/hi";
import { getGreeting } from './greetings';

// =============================================================================
// CSS 모듈 import (디바이스별 분리)
// =============================================================================
import desktopStyles from './Home.module.css';
import tabletStyles from './Home.tablet.module.css';
import mobileStyles from './Home.mobile.module.css';

// =============================================================================
// 상수 정의
// =============================================================================

/** 큐레이터 기본 소개 텍스트 (API에서 데이터가 없을 경우 사용) */
const curatorIntroText = "안녕하세요. MZ 큐레이터 김엠지예요. 밝고 도파민 터지는 영화만 추천해줄게요.";

// =============================================================================
// 메인 컴포넌트
// =============================================================================

/**
 * HomePage 컴포넌트
 *
 * 메인 홈 화면을 렌더링합니다.
 * 반응형으로 Desktop/Tablet/Mobile 각각 다른 스타일을 적용합니다.
 */
export default function HomePage() {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deviceType } = useResponsive();

  // ---------------------------------------------------------------------------
  // 반응형 스타일 선택
  // deviceType에 따라 적절한 CSS 모듈을 선택
  // ---------------------------------------------------------------------------
  const styles = deviceType === 'mobile'
    ? mobileStyles
    : deviceType === 'tablet'
      ? tabletStyles
      : desktopStyles;

  // ---------------------------------------------------------------------------
  // State 정의
  // ---------------------------------------------------------------------------

  /** 현재 선택된 티켓의 인덱스 */
  const [currentIndex, setCurrentIndex] = useState(0);

  /** 티켓 목록 데이터 */
  const [tickets, setTickets] = useState<Ticket[]>([]);

  /** 클릭 애니메이션 중인 티켓 ID (중복 클릭 방지용) */
  const [animatingTicketId, setAnimatingTicketId] = useState<number | null>(null);

  /** 뷰 모드: 'default' (기본) 또는 'viewAll' (티켓만 보기) */
  const [viewMode, setViewMode] = useState<'default' | 'viewAll'>('default');

  // ---------------------------------------------------------------------------
  // 파생 값 (Derived Values)
  // ---------------------------------------------------------------------------
  const nickname = user?.nickname;
  const totalTickets = tickets.length;
  const currentTicket = tickets[currentIndex];

  /** 시간대별 인사말 (컴포넌트 마운트 시 한 번만 생성) */
  const [greeting] = useState(() => getGreeting(nickname));

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * 티켓 데이터 로드
   * - API에서 티켓 목록을 가져옴
   * - 실패 시 FALLBACK_TICKETS 사용
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const ticketResponse = await fetchTickets();
        if (ticketResponse.data && ticketResponse.data.length > 0) {
          const fixedTickets = ticketResponse.data.map(t => ({
            ...t, characterImageUrl: t.characterImageUrl
          }));
          setTickets(fixedTickets);
        } else {
          setTickets(FALLBACK_TICKETS);
        }
      } catch (err) {
        setTickets(FALLBACK_TICKETS);
      }
    };
    loadData();
  }, []);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * 다음 티켓으로 이동
   * 마지막 티켓에서 첫 번째 티켓으로 순환
   */
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickets.length);
  };

  /**
   * 이전 티켓으로 이동
   * 첫 번째 티켓에서 마지막 티켓으로 순환
   */
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? tickets.length - 1 : prev - 1));
  };

  /**
   * 티켓 클릭 핸들러
   * - 애니메이션 후 전시회 상세 페이지로 이동
   * - 중복 클릭 방지
   * @param ticketId - 클릭된 티켓의 ID
   */
  const handleTicketClick = (ticketId: number) => {
    if (animatingTicketId !== null) return; // 애니메이션 중이면 무시
    setAnimatingTicketId(ticketId);
    setTimeout(() => {
      navigate(`/exhibition?ticket=${ticketId}`);
      setAnimatingTicketId(null);
    }, 500);
  };

  /**
   * 좋아요 토글 핸들러
   * - Optimistic Update 적용 (즉시 UI 반영 후 서버 동기화)
   * - 로그인 필수
   * @param e - 마우스 이벤트 (이벤트 버블링 방지용)
   */
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 유효성 검사
    if (!currentTicket) return;
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const ticketId = currentTicket.id;

    try {
      // Optimistic Update: 서버 응답 전에 UI 먼저 업데이트
      setTickets(prevTickets =>
        prevTickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              isLiked: !ticket.isLiked,
              likeCount: ticket.isLiked ? ticket.likeCount - 1 : ticket.likeCount + 1
            };
          }
          return ticket;
        })
      );

      // 서버 API 호출
      const result = await toggleTicketLike(ticketId);

      // 서버 응답으로 최종 상태 동기화
      if (result.success) {
        setTickets(prevTickets =>
          prevTickets.map(ticket => {
            if (ticket.id === ticketId) {
              return {
                ...ticket,
                isLiked: result.isLiked,
                likeCount: result.likeCount
              };
            }
            return ticket;
          })
        );
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      // 에러 시 롤백 로직 생략 (필요시 구현)
    }
  };

  /**
   * 뷰 모드 토글
   * 'default' <-> 'viewAll' 전환
   */
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'default' ? 'viewAll' : 'default');
  };

  // ---------------------------------------------------------------------------
  // 동적 스타일 계산
  // ---------------------------------------------------------------------------

  /**
   * 캐러셀 래퍼 인라인 스타일
   * - Desktop: absolute 포지션 (우측 하단 배치)
   * - Tablet/Mobile: CSS 클래스로 처리 (undefined 반환)
   */
  const carouselWrapperStyle = deviceType === 'desktop'
    ? {
      position: 'absolute' as const,
      right: '0',
      bottom: '-120px',
      zIndex: 20,
      transition: 'transform 0.6s ease',
    }
    : undefined;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={`${styles.killcho} ${viewMode === 'viewAll' ? styles.scrollLocked : ''}`}>

      {/* ===================================================================
          헤더 영역
          - viewAll 모드에서는 숨김 처리
          =================================================================== */}
      <div className={`${styles.headerWrapper} ${viewMode === 'viewAll' ? styles.hidden : ''}`}>
        <Header currentSection={currentTicket?.curatorName || '큐레이터'} />
      </div>

      {/* ===================================================================
          viewAll 모드 전용 헤더
          - 티켓 카운터 및 큐레이터 정보 표시
          =================================================================== */}
      <div className={`${styles.viewAllHeader} ${viewMode === 'viewAll' ? styles.visible : ''}`}>
        {/* 카운터: 현재 티켓 번호 / 전체 티켓 수 */}
        <div className={styles.centerCounter}>
          <span className={styles.bigCount}>{(currentIndex + 1).toString().padStart(2, '0')}</span>
          <span className={styles.smallCount}>/{totalTickets.toString().padStart(2, '0')}</span>
        </div>
        {/* 구분선 */}
        <div className={styles.separatorLine} />
        {/* 큐레이터 이름 및 메시지 */}
        <div className={styles.viewAllTextWrapper}>
          <h2 className={styles.viewAllCuratorName}>
            {currentTicket?.curatorName || '큐레이터'}
          </h2>
          <p className={styles.viewAllCuratorMessage}>
            {currentTicket?.curatorMessage || curatorIntroText}
          </p>
        </div>
      </div>

      {/* ===================================================================
          메인 컨텐츠 영역
          =================================================================== */}
      <div className={styles.innerContainer}>
        <main className={styles.mainContent}>
          <div className={styles.upperSplit}>

            {/* 데코 라인 (좌측 세로선)
                - decoBox: 일반 모드에서 보이는 라인
                - decoBoxFixed: viewAll 모드에서 고정되는 라인 */}
            <div className={`${styles.decoBox} ${viewMode ? styles.decoBoxHidden : ''}`} />
            <div className={`${styles.decoBoxFixed} ${viewMode ? styles.decoBoxFixedVisible : ''}`} />
            <div className={`${styles.decoBoxFixed} ${viewMode ? styles.decoBoxFixedFixedVisible : ''}`} />

            {/* 텍스트 섹션
                - viewAll 모드에서는 페이드 아웃 */}
            <div className={`${styles.textSection} ${viewMode === 'viewAll' ? styles.fadeOut : ''}`}>
              <div>
                {/* 인사말 타이틀 */}
                <h1 className={styles.title}>
                  {greeting.line1}<br />
                  {greeting.line2}<br />{' '}
                  {greeting.line3}
                </h1>
                {/* 서브 텍스트 */}
                <p className={styles.subText}>
                  당신을 위한 큐레이터가 대기 중이에요.
                </p>
              </div>

              {/* 티켓 카운터 (Desktop 전용, Tablet/Mobile에서는 CSS로 숨김) */}
              <p className={styles.ticketCounter}>
                <span className={styles.counterCurrent}>
                  {(currentIndex + 1).toString().padStart(2, '0')}
                </span>
                <span className={styles.counterTotal}>
                  /{totalTickets.toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* 캐러셀 영역 */}
            <div
              className={styles.carouselWrapper}
              style={carouselWrapperStyle}
            >
              <MainCarousel
                tickets={tickets}
                currentIndex={currentIndex}
                onNext={handleNext}
                onPrev={handlePrev}
                onTicketClick={handleTicketClick}
                animatingTicketId={animatingTicketId}
                viewMode={viewMode}
                onToggleViewMode={toggleViewMode}
                deviceType={deviceType}
              />
            </div>
          </div>
        </main>
      </div>

      {/* ===================================================================
          큐레이터 정보 영역 (하단 오버레이)
          - viewAll 모드에서는 숨김 처리
          =================================================================== */}
      <div className={`${styles.curatorBox} ${viewMode === 'viewAll' ? styles.curatorBoxMoved : ''}`}>
        <div className={styles.curatorContent}>
          {/* 큐레이터 이름 */}
          <h2 className={styles.curatorName}>
            {currentTicket?.curatorName || '큐레이터'}
          </h2>

          {/* 좋아요 및 메시지 영역 */}
          <div className={styles.curatorLikesInfo}>
            {/* 좋아요 버튼 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                cursor: 'pointer'
              }}
              onClick={handleLike}
            >
              {currentTicket?.isLiked ? (
                <HiHeart size={20} color="#ff4b4b" />
              ) : (
                <HiOutlineHeart size={20} color="#666" />
              )}
              <p style={{ margin: 0 }}>
                {currentTicket?.likeCount ?? 0}명의 유저가 이 전시회를 좋아해요.
              </p>
            </div>

            {/* 큐레이터 말풍선 메시지 */}
            <div className={styles.speechBubble}>
              {currentTicket?.curatorMessage || curatorIntroText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
