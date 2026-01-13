import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainCarousel } from './MainCarousel';
import { Header } from '../../components/Header/Header';
import { fetchTickets, toggleTicketLike, type Ticket } from '../../apis/exhibition';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Home.module.css';
import { FALLBACK_TICKETS } from './fallbackData';
import { HiHeart, HiOutlineHeart } from "react-icons/hi";

// --- 고정 데이터 ---
const curatorIntroText = "안녕하세요. MZ 큐레이터 김엠지예요. 밝고 도파민 터지는 영화만 추천해줄게요.";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingTicketId, setAnimatingTicketId] = useState<number | null>(null);

  // 뷰 모드 상태 관리
  const [viewMode, setViewMode] = useState<'default' | 'viewAll'>('default');
  
  // 왓챠 영화 제목 상태
  const [currentMovieTitle, setCurrentMovieTitle] = useState<string | null>(null);

  const nickname = user?.nickname;
  const totalTickets = tickets.length;
  const currentTicket = tickets[currentIndex];

  // [로직 1] 왓챠 현재 탭 제목 가져오기
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.url && activeTab.url.includes('watcha.com/contents')) {
          const rawTitle = activeTab.title || "";
          // " | 왓챠", " - 왓챠" 제거
          const cleanTitle = rawTitle.replace(/\s*[|\-]\s*왓챠.*$/, '').trim();
          if (cleanTitle) setCurrentMovieTitle(cleanTitle);
        }
      });
    }
  }, []);

  // 상수 정의
  const LINE_BREAK_LIMIT = 8; // 줄바꿈 기준 길이
  const RESIZE_LIMIT = 20;     // 폰트 줄임 기준 길이

  // 상태 변수 (JSX에서 사용)
  const isVeryLong = currentMovieTitle && currentMovieTitle.length > RESIZE_LIMIT;
  const isShortTitle = currentMovieTitle && currentMovieTitle.length <= LINE_BREAK_LIMIT;

  // ✅ [로직 2] 제목 렌더링 헬퍼 (긴 제목 줄바꿈 용)
  const renderSplitTitle = (title: string) => {
    // 10자 이하면 줄바꿈 없이 반환 (어차피 아래 JSX에서 처리함)
    if (title.length <= LINE_BREAK_LIMIT) {
      return <span>'{title}'</span>;
    }

    // 자연스러운 줄바꿈 로직 (공백 기준)
    const words = title.split(' ');
    let firstLine = words[0];
    let restStartIndex = 1;

    // 적절한 길이(10자 내외)에서 끊기
    for (let i = 1; i < words.length; i++) {
      if ((firstLine + " " + words[i]).length <= 10) {
        firstLine += " " + words[i];
        restStartIndex = i + 1;
      } else {
        break; 
      }
    }

    let secondLine = words.slice(restStartIndex).join(' ');

    // 띄어쓰기 없는 긴 단어 강제 절삭
    if (!secondLine && title.length > LINE_BREAK_LIMIT) {
       firstLine = title.slice(0, LINE_BREAK_LIMIT);
       secondLine = title.slice(LINE_BREAK_LIMIT);
    }

    // 긴 제목은 자체적으로 두 줄로 나눔
    return (
      <span>
        '{firstLine}<br />
        {secondLine}'
      </span>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickets.length);
  };

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

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTicket) return;
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const ticketId = currentTicket.id;
    try {
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

      const result = await toggleTicketLike(ticketId);
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
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'default' ? 'viewAll' : 'default');
  };

  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>티켓을 불러오는 중...</p>
        </div>
    );
  }

  return (
      <div className={`${styles.killcho} ${viewMode === 'viewAll' ? styles.scrollLocked : ''}`}>
        {/* 헤더 */}
        <div className={`${styles.headerWrapper} ${viewMode === 'viewAll' ? styles.hidden : ''}`}>
          <Header currentSection={currentTicket?.curatorName || '큐레이터'} />
        </div>

        {/* 뷰 모드 헤더 */}
        <div className={`${styles.viewAllHeader} ${viewMode === 'viewAll' ? styles.visible : ''}`}>
          <div className={styles.centerCounter}>
            <span className={styles.bigCount}>{(currentIndex + 1).toString().padStart(2, '0')}</span>
            <span className={styles.smallCount}>/{totalTickets.toString().padStart(2, '0')}</span>
          </div>
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
              <div className={`${styles.decoBox} ${viewMode ? styles.decoBoxHidden : ''}`} />
              <div className={`${styles.decoBoxFixed} ${viewMode ? styles.decoBoxFixedVisible : ''}`} />

              {/* 텍스트 섹션 */}
              <div className={`${styles.textSection} ${viewMode === 'viewAll' ? styles.fadeOut : ''}`}>
                <div>
                  {currentMovieTitle ? (
                    <>
                      {/* ✅ [수정] 제목 조건별 3줄 레이아웃 + 폰트 사이즈 조절 */}
                      <h1 
                        className={styles.title}
                        style={isVeryLong ? { fontSize: '70px', lineHeight: '1.2' } : undefined}
                      >
                        {isShortTitle ? (
                          // Case 1: 짧은 제목 -> 강제 3줄 (제목 / 영화에 / 관심...)
                          <>
                            '{currentMovieTitle}'<br />
                            영화에<br />
                            관심 있으신가요?
                          </>
                        ) : (
                          // Case 2: 긴 제목 -> 자동 3줄 (제목1 / 제목2'에 / 관심...)
                          <>
                            {renderSplitTitle(currentMovieTitle)}에<br />
                            관심 있으신가요?
                          </>
                        )}
                      </h1>
                      <p className={styles.subText}>
                        이 영화와 잘 어울리는 전시회를 소개합니다.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className={styles.title}>
                        {nickname ? `${nickname}님,` : '안녕하세요,'}<br />어떤 영화를<br />보고 싶나요?
                      </h1>
                      <p className={styles.subText}>
                        당신을 위한 큐레이터가 대기 중이에요.
                      </p>
                    </>
                  )}
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
                  onToggleViewMode={toggleViewMode}
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
              <div className={styles.speechBubble}>
                {currentTicket?.curatorMessage || curatorIntroText}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}