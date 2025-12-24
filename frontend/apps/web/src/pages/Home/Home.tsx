// apps/web/src/pages/Home/Home.tsx (상단 import 부분만 수정)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@repo/ui';
import { MainCarousel } from './MainCarousel';
import { Header } from '../../components/Header/Header';

// ❌ 수정 전: import { fetchTickets, Ticket } from '../../apis/tickets';
// ✅ 수정 후: tickets.ts를 삭제하고 통합했으므로 exhibition에서 가져옵니다.
// 'type' 키워드를 명시적으로 붙여줍니다.
import { fetchTickets, type Ticket } from '../../apis/exhibition';

import styles from './Home.module.css';
// --- 고정 데이터 ---
const currentNickname = '길초';
const likeCount = 103;
const curatorIntroText = "안녕하세요. MZ 큐레이터 김엠지예요. 밝고 도파민 터지는 영화만 추천해줄게요.";

export default function HomePage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalTickets = tickets.length;
  const currentTicket = tickets[currentIndex];

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const response = await fetchTickets();
        setTickets(response.data);
        setError(null);
      } catch (err) {
        console.error('티켓 로드 실패:', err);
        setError('티켓을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

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

  if (error || tickets.length === 0) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>{error || '티켓이 없습니다.'}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.headerWrapper}>
        <Header currentSection={currentTicket?.curatorName || '큐레이터'} />
      </div>

      <div className={styles.innerContainer}>
        <main className={styles.mainContent}>
          <div className={styles.upperSplit}>
            <div className={styles.decoBox}></div>

            <div className={styles.textSection}>
              <div>
                <h1 className={styles.title}>
                  {currentNickname}님,<br />어떤 영화를<br />보고 싶나요?
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
              {/* 이제 같은 폴더의 MainCarousel을 사용합니다 */}
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
              {curatorIntroText}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}