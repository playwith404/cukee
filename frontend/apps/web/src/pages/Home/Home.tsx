import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@repo/ui';
import { MainCarousel } from './MainCarousel';
import { Header } from '../../components/Header/Header';
import { fetchTickets, type Ticket } from '../../apis/exhibition';
import { useAuth } from '../../contexts/AuthContext'; // ✅ [변경] useAuth 사용
import styles from './Home.module.css';

// ✅ [변경] 방금 만든 파일에서 데이터를 가져옵니다.
import { FALLBACK_TICKETS } from './fallbackData';

// --- 고정 데이터 ---
const likeCount = 103;
const curatorIntroText = "안녕하세요. MZ 큐레이터 김엠지예요. 밝고 도파민 터지는 영화만 추천해줄게요.";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ [변경] Context에서 user 정보 가져오기
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const nickname = user?.nickname;

  // 에러 로깅/표시용
  const [error, setError] = useState<string | null>(null);

  const totalTickets = tickets.length;
  const currentTicket = tickets[currentIndex];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 티켓 데이터만 가져오기 (사용자 정보는 Context가 관리)
        const ticketResponse = await fetchTickets();

        // 티켓 데이터 설정
        if (ticketResponse.data && ticketResponse.data.length > 0) {
          const fixedTickets = ticketResponse.data.map(t => ({
            ...t,
            characterImageUrl: t.characterImageUrl
          }));
          setTickets(fixedTickets);
        } else {
          console.warn("서버 데이터 없음. 임시 데이터 사용.");
          setError("데이터를 불러오지 못해 임시 데이터를 표시합니다.");
          setTickets(FALLBACK_TICKETS);
        }

      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError("서버 연결에 실패하여 임시 데이터를 표시합니다.");
        setTickets(FALLBACK_TICKETS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ... (이하 나머지 코드는 동일합니다)

  const handleNext = () => {
    if (currentIndex < tickets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTicketClick = (ticketId: number) => {
    navigate(`/exhibition?ticket=${ticketId}`);
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
      <div className={styles.killcho}>
        <div className={styles.headerWrapper}>
          <Header currentSection={currentTicket?.curatorName || '큐레이터'} />
        </div>

        {/* 에러 메시지 표시 (토스트 스타일) */}
        {error && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className={styles.innerContainer}>
          <main className={styles.mainContent}>
            <div className={styles.upperSplit}>
              <div className={styles.decoBox}></div>

              <div className={styles.textSection}>
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

              <div style={{
                position: 'absolute',
                right: '0',
                bottom: '-120px',
                zIndex: 20,
              }}>
                <MainCarousel
                  tickets={tickets}
                  currentIndex={currentIndex}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onTicketClick={handleTicketClick}
                />
              </div>
            </div>
          </main>
        </div>

        <div className={styles.curatorBox}>
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