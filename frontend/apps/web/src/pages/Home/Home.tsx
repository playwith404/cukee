import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@repo/ui';
import { MainCarousel } from './MainCarousel';
import { Header } from '../../components/Header/Header';
import { fetchTickets, type Ticket } from '../../apis/exhibition';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Home.module.css';
import { FALLBACK_TICKETS } from './fallbackData';

// --- 고정 데이터 ---
const likeCount = 103;
const curatorIntroText = "안녕하세요. MZ 큐레이터 김엠지예요. 밝고 도파민 터지는 영화만 추천해줄게요.";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingTicketId, setAnimatingTicketId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 뷰 모드 상태 관리
  const [viewMode, setViewMode] = useState<'default' | 'viewAll'>('default');

  const nickname = user?.nickname;
  const totalTickets = tickets.length;
  const currentTicket = tickets[currentIndex];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // const handleNext = () => {
  //   if (currentIndex < tickets.length - 1) setCurrentIndex(currentIndex + 1);
  // };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickets.length);
  };

  // const handlePrev = () => {
  //   if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  // };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? tickets.length - 1 : prev - 1));
  };

  const handleTicketClick = (ticketId: number) => {
    if (animatingTicketId !== null) return;
    setAnimatingTicketId(ticketId);
    setTimeout(() => {
      navigate(`/exhibition?ticket=${ticketId}`);
      setAnimatingTicketId(null);
    }, 500);
  };

  // 모드 토글 함수
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'default' ? 'viewAll' : 'default');
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>티켓을 불러오는 중...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={`${styles.killcho} ${viewMode === 'viewAll' ? styles.scrollLocked : ''}`}>
        {/* 헤더: viewAll 모드일 땐 숨김 */}
        <div className={`${styles.headerWrapper} ${viewMode === 'viewAll' ? styles.hidden : ''}`}>
          <Header currentSection={currentTicket?.curatorName || '큐레이터'} />
        </div>

        {/* 티켓만 보기 전용 헤더 (카운터) */}
        <div className={`${styles.viewAllHeader} ${viewMode === 'viewAll' ? styles.visible : ''}`}>
           {/* 1. 카운터 */}
           <div className={styles.centerCounter}>
              <span className={styles.bigCount}>{(currentIndex + 1).toString().padStart(2, '0')}</span>
              <span className={styles.smallCount}>/{totalTickets.toString().padStart(2, '0')}</span>
           </div>
           {/* 2. 큐레이터 이름 & 메시지 */}
           <div className={styles.separatorLine} />
           <div className={styles.viewAllTextWrapper}>
              <h2 className={styles.viewAllCuratorName}>
                {currentTicket?.curatorName || '큐레이터'}
              </h2>
              <p className={styles.viewAllCuratorMessage}>
                {currentTicket?.curatorMessage || curatorIntroText}
              </p>
           </div>
        </div>

        <div className={styles.innerContainer}>
          <main className={styles.mainContent}>
            <div className={styles.upperSplit}>
              {/* 데코박스 이원화 적용 */}
              <div className={`${styles.decoBox} ${viewMode ? styles.decoBoxHidden : ''}`} />
              <div className={`${styles.decoBoxFixed} ${viewMode ? styles.decoBoxFixedVisible : ''}`} />

              {/* 텍스트 섹션: viewAll 모드면 페이드 아웃 */}
              <div className={`${styles.textSection} ${viewMode === 'viewAll' ? styles.fadeOut : ''}`}>
                <div>
                  <h1 className={styles.title}>
                    {nickname ? `${nickname}님,` : '안녕하세요,'}<br />어떤 영화를<br />보고 싶나요?
                  </h1>
                  <p className={styles.subText}>
                    당신을 위한 큐레이터가 대기 중이에요.
                  </p>
                </div>

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
              <div style={{
                position: 'absolute',
                right: '0',
                bottom: '-120px',
                zIndex: 20,
                transition: 'transform 0.6s ease',
              }}>
                <MainCarousel
                  tickets={tickets}
                  currentIndex={currentIndex}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onTicketClick={handleTicketClick}
                  animatingTicketId={animatingTicketId}
                  viewMode={viewMode}
                  onToggleViewMode={toggleViewMode} // ✅ 함수 전달!
                />
              </div>
            </div>
          </main>
        </div>

        {/* 큐레이터 영역 */}
        <div className={`${styles.curatorBox} ${viewMode === 'viewAll' ? styles.curatorBoxMoved : ''}`}>
          <div className={styles.curatorContent}>
            <h2 className={styles.curatorName}>
              {currentTicket?.curatorName || '큐레이터'}
            </h2>
            <div className={styles.curatorLikesInfo}>
              <p style={{ margin: '0 0 4px 0' }}>♥ {likeCount}명의 유저가 이 전시회를 좋아해요.</p>
              <div className={styles.speechBubble}>
                {currentTicket?.curatorMessage || curatorIntroText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}