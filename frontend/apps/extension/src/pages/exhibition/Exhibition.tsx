import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './Exhibition.module.css';

// 컴포넌트 import (TopControls, Decorate 제거됨)
import { Header } from '../../components/Header/Header';
import { Gallery3D, type Frame } from './components/Gallery3D';
import { CuratorGuide } from './components/CuratorGuide';
import { ExhibitionGenerator } from './components/ExhGenerator';

// API import (createExhibition, update 등 저장 관련 API 제거)
import type { AIExhibitionResponse } from '../../apis/ai';
import { curateMovies, getMovieDetail, clearMovieDetailCache } from '../../apis/ai';
import { fetchTickets, type Ticket, getExhibitionById, toggleTicketLike } from '../../apis/exhibition';
import type { CukeeStyle } from '../../types/cukee';

// 타입 정의
type AIStatus = 'idle' | 'loading' | 'delayed' | 'error';

const INITIAL_FRAMES = [
  { id: 1, content: 'Frame 1' },
  { id: 2, content: 'Frame 2' },
  { id: 3, content: 'Frame 3' },
  { id: 4, content: 'Frame 4' },
  { id: 5, content: 'Frame 5' },
];

export const Exhibition = () => {
  // === 1. 갤러리 및 기본 상태 ===
  const [frames, setFrames] = useState<Frame[]>(INITIAL_FRAMES);
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [exhibitionTitle, setExhibitionTitle] = useState("나만의 전시회");
  const [aiCuratorComment, setAiCuratorComment] = useState("");

  // === 2. URL 파라미터 처리 ===
  const [searchParams] = useSearchParams();
  const ticketIdParam = searchParams.get('ticket');
  const exhibitionIdParam = searchParams.get('exhibitionId');

  const currentTicketId = ticketIdParam ? parseInt(ticketIdParam, 10) : 1;
  const dynamicTicketImage = `/ticket/ticket${currentTicketId}.png`;

  // ID가 있으면 "불러온 전시회" (ReadOnly)
  const isReadOnly = !!exhibitionIdParam;

  // === 3. 티켓 및 영화 정보 상태 ===
  const [ticketInfo, setTicketInfo] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<{ title: string; detail: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // === 4. AI 상태 관리 ===
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // === 5. 스타일 상태 (저장은 안 되지만, 불러온 전시회의 스타일을 보여주기 위해 state는 유지) ===
  const [cukeeId, setCukeeId] = useState<string>(`c${currentTicketId}`);
  const [cukeeStyle, setCukeeStyle] = useState<CukeeStyle>('line'); // 기본값
  const [frameStyle, setFrameStyle] = useState<'none' | 'basic' | 'frame2'>('basic'); // 기본값

  // 10초 지연 감지
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (aiStatus === 'loading') {
      timer = setTimeout(() => setAiStatus('delayed'), 10000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [aiStatus]);

  // 티켓 ID 변경 시 캐릭터 ID 동기화
  useEffect(() => {
    if (currentTicketId) setCukeeId(`c${currentTicketId}`);
  }, [currentTicketId]);

  // 전시회 데이터 로드 (스타일 & 영화 목록)
  useEffect(() => {
    if (exhibitionIdParam) {
      setFrameStyle('none'); // 불러오는 중엔 깔끔하게
    }
    if (!exhibitionIdParam) return;

    const loadExhibitionStyle = async () => {
      try {
        const data = await getExhibitionById(parseInt(exhibitionIdParam, 10));
        if (data) {
          const savedCukeeNo = data.ticketGroupId || data.ticket_group_id;
          if (savedCukeeNo) setCukeeId(`c${savedCukeeNo}`);
          
          const design = data.design || data;
          setCukeeStyle(design.cukeeStyle || '1');
          setFrameStyle(design.frameStyle || 'none');
          // 배경 설정 등 필요한 경우 추가
        }
      } catch (err) {
        console.error("스타일 로드 실패:", err);
      }
    };
    loadExhibitionStyle();
  }, [exhibitionIdParam]);

  // 큐레이터 멘트 로직
  const getCuratorMessage = () => {
    if (loadingTicket) return "티켓 정보를 불러오는 중입니다...";
    if (loadingDetail) return "영화 정보를 불러오는 중...";
    if (selectedMovieDetail) return `${selectedMovieDetail.title}\n\n${selectedMovieDetail.detail}`;
    if (exhibitionIdParam && aiStatus === 'idle') return `${exhibitionTitle}`;

    switch (aiStatus) {
      case 'loading': return "AI가 전시회를 구상하고 있어요! 잠시만 기다려주세요...";
      case 'delayed': return "AI가 평소보다 깊게 고민하고 있어요. 조금만 더 기다려주세요!";
      case 'error': return errorMessage || "오류가 발생했습니다.";
      case 'idle':
      default: return aiCuratorComment || ticketInfo?.curatorMessage || '안녕하세요! 영화를 추천해드릴게요.';
    }
  };

  // 페이지 이탈 시 캐시 삭제
  useEffect(() => {
    if (isReadOnly) return;
    const handleBeforeUnload = () => navigator.sendBeacon('/api/ai/cache', '');
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearMovieDetailCache().catch(console.error);
    };
  }, [isReadOnly]);

  // 데이터 로딩 (티켓 정보 & 전시회 정보)
  useEffect(() => {
    setSelectedMovieDetail(null);
    setAiCuratorComment("");
    setErrorMessage("");
    setAiStatus('idle');

    const loadTicketInfo = async () => {
      try {
        setLoadingTicket(true);
        if (exhibitionIdParam) {
          // 저장된 전시회 불러오기
          const exhibition = await getExhibitionById(parseInt(exhibitionIdParam, 10));
          if (exhibition.title) setExhibitionTitle(exhibition.title);
          
          if (exhibition.ticketId) {
            const ticketsResponse = await fetchTickets();
            const ticket = ticketsResponse.data.find((t: Ticket) => t.id === exhibition.ticketId);
            if (ticket) setTicketInfo(ticket);
          }

          if (exhibition.movies && exhibition.movies.length > 0) {
            const exhibitionFrames = exhibition.movies.map((movie: any) => ({
              id: movie.movieId || movie.id,
              content: `Movie ${movie.movieId || movie.id}`,
              isPinned: movie.isPinned || false,
              imageUrl: movie.posterUrl ? `https://image.tmdb.org/t/p/w500${movie.posterUrl}` : "",
              title: movie.title || `영화`,
              personaSummary: movie.personaSummary || null
            }));
            setFrames(exhibitionFrames);
            setActiveIndex(Math.floor(exhibitionFrames.length / 2));
          }
        } else if (currentTicketId) {
          // 새 전시회 (티켓 기반)
          const response = await fetchTickets();
          const ticket = response.data.find((t: Ticket) => t.id === currentTicketId);
          setTicketInfo(ticket || response.data[0] || null);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoadingTicket(false);
      }
    };
    loadTicketInfo();
  }, [currentTicketId, exhibitionIdParam]);

  // 자동 영화 추천 로드 (새 전시회일 때만)
  useEffect(() => {
    const loadMovies = async () => {
      if (exhibitionIdParam) return;
      try {
        const adultExclude = localStorage.getItem('adultExclude') === 'true';
        const response = await curateMovies(currentTicketId, 5, adultExclude);
        if (response.movies?.length > 0) {
          const newFrames: Frame[] = response.movies.map((movie) => ({
            id: movie.movieId,
            content: movie.title,
            imageUrl: movie.posterUrl.startsWith('http') ? movie.posterUrl : `https://image.tmdb.org/t/p/w500${movie.posterUrl}`
          }));
          setFrames(newFrames);
          setActiveIndex(Math.floor(newFrames.length / 2));
        }
      } catch (error) { console.error('영화 로드 실패:', error); }
    };
    loadMovies();
  }, [currentTicketId]);

  const pinnedMovieIds = frames.filter(f => f.isPinned).map(f => f.id);

  // 핸들러들
  const maxIndex = frames.length - 1;
  const handlePrev = () => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () => setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));

  const handleDelete = (frameId: number, currentIndex: number) => {
    setFrames((prev) => prev.filter((f) => f.id !== frameId));
    if (currentIndex >= frames.length - 1) setActiveIndex(Math.max(0, frames.length - 2));
  };

  const handlePin = (frameId: number) => {
    setFrames((prev) => prev.map((frame) => frame.id === frameId ? { ...frame, isPinned: !frame.isPinned } : frame));
  };

  const handlePosterClick = async (frameId: number) => {
    try {
      setLoadingDetail(true);
      if (isReadOnly) {
        const frame = frames.find(f => f.id === frameId);
        if (frame && (frame as any).personaSummary) {
          setSelectedMovieDetail({ title: (frame as any).title || '', detail: (frame as any).personaSummary });
          return;
        }
      }
      const response = await getMovieDetail(frameId, currentTicketId);
      setSelectedMovieDetail({ title: response.title, detail: response.detail });
    } catch (error) {
      setSelectedMovieDetail({ title: '오류', detail: '정보를 불러오지 못했습니다.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExhibitionCreated = (data: AIExhibitionResponse) => {
    setAiStatus('idle');
    setExhibitionTitle(data.resultJson.title);
    setAiCuratorComment(data.resultJson.curatorComment || "");

    const newFrames: Frame[] = data.resultJson.movies.map((movie) => ({
      id: movie.movieId,
      content: movie.title,
      imageUrl: movie.posterUrl ?? "https://via.placeholder.com/300x450"
    }));

    if (newFrames.length > 0) {
      setFrames((prevFrames) => {
        const pinnedFrames = prevFrames.filter((f) => f.isPinned);
        const pinnedIds = new Set(pinnedMovieIds);
        const pureNewFrames = newFrames.filter(nf => !pinnedIds.has(nf.id));
        return [...pinnedFrames, ...pureNewFrames].slice(0, 5);
      });
      setActiveIndex(Math.floor(newFrames.length / 2));
    }
  };

  const handleLikeToggle = async () => {
    if (!ticketInfo) return;
    const previousTicketInfo = { ...ticketInfo };
    const newIsLiked = !ticketInfo.isLiked;
    setTicketInfo({ ...ticketInfo, isLiked: newIsLiked, likeCount: newIsLiked ? ticketInfo.likeCount + 1 : ticketInfo.likeCount - 1 });

    try {
      const updatedTicket = await toggleTicketLike(ticketInfo.id);
      setTicketInfo(prev => prev ? { ...prev, isLiked: updatedTicket.isLiked, likeCount: updatedTicket.likeCount } : null);
    } catch (error) {
      setTicketInfo(previousTicketInfo);
    }
  };

  return (
    <div className={styles.container}>
      <Header
        currentSection={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || "큐레이터")}
        exhibitionTitle={exhibitionTitle}
      />

      {/* 갤러리 영역 (TopControls 제거됨) */}
      <div className={`${styles.galleryWrapper} ${isReadOnly ? styles.moveDown : ''}`}>
        <Gallery3D
          frames={frames}
          activeIndex={activeIndex}
          frameStyle={frameStyle}
          onPrev={handlePrev}
          onNext={handleNext}
          onSelect={setActiveIndex}
          onPosterClick={handlePosterClick}
          onDelete={isReadOnly ? undefined : handleDelete}
          onPin={isReadOnly ? undefined : handlePin}
        />
      </div>

      <CuratorGuide
        characterImageUrl={`/cara_style/${cukeeId}/${cukeeStyle}.png`}
        curatorName={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || 'MZ 큐레이터')}
        curatorMessage={getCuratorMessage()}
        likeCount={ticketInfo?.likeCount || 0}
        isLiked={ticketInfo?.isLiked || false}
        onToggleLike={handleLikeToggle}
      />

      <div className={styles.ticketWrapper}>
        <img
          src={ticketInfo?.ticketImageUrl || dynamicTicketImage}
          alt="Ticket"
          className={styles.ticketImage}
        />
      </div>

      {/* 꾸미기 모드 관련 prop 제거 & 항상 렌더링 */}
      <ExhibitionGenerator
        currentTicketId={currentTicketId}
        onSuccess={handleExhibitionCreated}
        onLoadingStart={() => {
          setAiStatus('loading');
          setSelectedMovieDetail(null);
          setAiCuratorComment("");
        }}
        onError={(msg) => { setErrorMessage(msg); setAiStatus('error'); }}
        isLoading={aiStatus === 'loading' || aiStatus === 'delayed'}
        pinnedMovieIds={pinnedMovieIds}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};