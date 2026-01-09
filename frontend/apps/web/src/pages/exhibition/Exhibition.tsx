import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // 👈 변경 포인트 1
//import { Header, MainLayout } from '@repo/ui'; // 🚧 UI 패키지 경로 확인 필요 (일단 주석 or 로컬 경로)
import styles from './Exhibition.module.css'; // ExhPageContainer.module.css 이름 변경 추천
import { Header } from '../../components/Header/Header';

// 하위 컴포넌트 import
import { TopControls } from './components/TopControls';
import { Gallery3D, type Frame } from './components/Gallery3D';
import { CuratorGuide } from './components/CuratorGuide';
import { ExhibitionGenerator } from './components/ExhGenerator';

// API 타입 import (경로는 프로젝트 구조에 맞게 수정)
import type { AIExhibitionResponse } from '../../apis/ai';
import { curateMovies, getMovieDetail, clearMovieDetailCache } from '../../apis/ai'; // 영화 조회 API
import { fetchTickets, type Ticket, createExhibition, getExhibitionById, toggleTicketLike } from '../../apis/exhibition';

import { ExhibitionDecorate } from './ExhibitionDecorate';
import type { CukeeStyle } from '../../types/cukee';

// AI 진행 상태 타입 정의 
type AIStatus = 'idle' | 'loading' | 'delayed' | 'error';

const INITIAL_FRAMES = [
  { id: 1, content: 'Frame 1' },
  { id: 2, content: 'Frame 2' },
  { id: 3, content: 'Frame 3' },
  { id: 4, content: 'Frame 4' },
  { id: 5, content: 'Frame 5' },
];

export const Exhibition = () => {
  // === 1. 갤러리 관련 상태 ===
  const [frames, setFrames] = useState<Frame[]>(INITIAL_FRAMES);
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [exhibitionTitle, setExhibitionTitle] = useState("나만의 전시회");
  const [aiCuratorComment, setAiCuratorComment] = useState("");

  // === 2. URL 파라미터 (React Router 방식) ===
  const [searchParams] = useSearchParams(); // 👈 변경 포인트 2 (배열 반환됨)
  const ticketIdParam = searchParams.get('ticket');
  console.log('ticketIdParam:', ticketIdParam);
  const exhibitionIdParam = searchParams.get('exhibitionId'); // 전시회 ID 파라미터
  const currentTicketId = ticketIdParam ? parseInt(ticketIdParam, 10) : 1;
  // 예: ticket=1 -> /cara/cara1.png
  // 예: ticket=2 -> /cara/cara2.png
  //const dynamicCharacterImage = `/cara/cara${currentTicketId}.png`;
  const dynamicTicketImage = `/ticket/ticket${currentTicketId}.png`;


  // [핵심 논리] ID가 존재하면 "불러온 전시회"이므로 수정 불가(ReadOnly) 모드.
  const isReadOnly = !!exhibitionIdParam;
  console.log("ReadOnly 모드 여부:", isReadOnly);

  // === 3.  티켓 정보 상태 ===
  const [ticketInfo, setTicketInfo] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);

  // === 4. (추가) AI 상태 및 에러 메시지 관리 ===
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // === 5. 영화 상세 정보 상태 ===
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<{ title: string; detail: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // === 6. 하단 바 모드 관리(프롬프트 & 꾸미기)===
  const [bottomMode, setBottomMode] = useState<'action' | 'decorate'>('action');

  // 큐키 스타일 상태 선언
  const [cukeeId, setCukeeId] = useState<string>(`c${currentTicketId}`);
  const [cukeeStyle, setCukeeStyle] = useState<CukeeStyle>('line');

  // 프레임 스타일 상태 선언 (기본값이 프레임이 있는 버전이므로 'basic' 혹은 'default'로 설정)
  const [frameStyle, setFrameStyle] = useState<'none' | 'basic'>('basic');

  // 배경 스타일 상태 선언
  const [bgStyle, setBgStyle] = useState<string>('none');

  // [신규] 10초 지연 감지 타이머 로직
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (aiStatus === 'loading') {
      timer = setTimeout(() => {
        setAiStatus('delayed');
      }, 10000);
    }

    return () => {
      // timer가 존재할 때만 clear하도록 안전장치 추가
      if (timer) clearTimeout(timer);
    };
  }, [aiStatus]);

  // 티켓 ID가 바뀔 때 cukeeId도 동기화
  useEffect(() => {
    if (currentTicketId) {
      setCukeeId(`c${currentTicketId}`);
    }
  }, [currentTicketId]);

  // [수정] DB에서 기존 설정을 불러오는 로직 (스타일 연동)
  useEffect(() => {
    if (!exhibitionIdParam) return;

    // 전시회 상세 정보를 가져올 때 사용자가 저장했던 스타일(cukeeStyle)을 세팅
    const loadExhibitionStyle = async () => {
      try {
        const data = await getExhibitionById(parseInt(exhibitionIdParam, 10));
        if (data.cukeeStyle) {
          setCukeeStyle(data.cukeeStyle);
        }
      } catch (err) {
        console.error("스타일 로드 실패:", err);
      }
    };
    loadExhibitionStyle();
  }, [exhibitionIdParam]);

  // [신규] 상태에 따른 큐레이터 멘트 결정 함수
  const getCuratorMessage = () => {
    if (loadingTicket) return "티켓 정보를 불러오는 중입니다...";

    // 영화 상세 정보가 로딩 중이면 표시
    if (loadingDetail) return "영화 정보를 불러오는 중...";

    // 영화 상세 정보가 있으면 표시
    if (selectedMovieDetail) {
      return `${selectedMovieDetail.title}\n\n${selectedMovieDetail.detail}`;
    }
    // 저장된 전시회 불러왔을 때 큐레이터 멘트 
    // 저장된 전시회(ID가 있음)이고, AI가 작업 중이 아니라면 제목 표시
    if (exhibitionIdParam && aiStatus === 'idle') {
      return `${exhibitionTitle}`;
    }

    switch (aiStatus) {
      case 'loading':
        return "AI가 전시회를 구상하고 있어요! 잠시만 기다려주세요...";
      case 'delayed':
        return "AI가 평소보다 깊게 고민하고 있어요. 조금만 더 기다려주세요!";
      case 'error':
        return errorMessage || "프롬프트를 보내는데 실패했어요! 다시 시도해주세요.";
      case 'idle':
      default:
        // AI가 생성한 코멘트가 있으면 최우선으로 보여줌
        if (aiCuratorComment) return aiCuratorComment;
        // 기본 멘트 (API에서 받아온 것 or 기본값)
        return ticketInfo?.curatorMessage || '안녕하세요! 당신을 위한 영화를 추천해드릴게요.';
    }
  };

  // [신규] 페이지 이탈 시 캐시 삭제 (새 전시회 모드에서만)
  useEffect(() => {
    // 저장된 전시회(ReadOnly)에서는 캐시 삭제 불필요
    if (isReadOnly) return;

    const handleBeforeUnload = () => {
      // 동기적으로 sendBeacon 사용 (페이지 언로드 시에도 안정적으로 전송)
      navigator.sendBeacon('/api/ai/cache', '');
    };

    // beforeunload 이벤트는 페이지를 떠날 때(새로고침, 탭 닫기, 다른 URL 이동) 발생
    window.addEventListener('beforeunload', handleBeforeUnload);

    // cleanup: 컴포넌트 언마운트 시 (React Router로 다른 페이지 이동)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 컴포넌트 언마운트 시에도 캐시 삭제 시도
      clearMovieDetailCache().catch(console.error);
    };
  }, [isReadOnly]);

  // [신규] 티켓 정보를 불러오는 useEffect
  useEffect(() => {
    setSelectedMovieDetail(null); // 영화 상세정보(줄거리) 초기화
    setAiCuratorComment("");      // AI 멘트 초기화
    setErrorMessage("");          // 에러 메시지 초기화
    setAiStatus('idle');          // AI 상태 초기화

    const loadTicketInfo = async () => {

      if (exhibitionIdParam) {
        // 전시회 ID가 있으면 전시회 데이터 로드
        try {
          setLoadingTicket(true);
          const exhibition = await getExhibitionById(parseInt(exhibitionIdParam, 10));

          console.log('전시회 로드된 데이터:', exhibition);

          // 전시회 제목 설정
          if (exhibition.title) {
            setExhibitionTitle(exhibition.title);
          }

          // 티켓 정보 로드 (exhibition의 ticketId 사용)
          if (exhibition.ticketId) {
            const ticketsResponse = await fetchTickets();
            const ticket = ticketsResponse.data.find((t: Ticket) => t.id === exhibition.ticketId);
            if (ticket) {
              setTicketInfo(ticket);
              console.log('티켓 정보 설정:', ticket);
            }
          }

          // 영화 데이터 설정 (movies 배열이 있을 경우)
          if (exhibition.movies && exhibition.movies.length > 0) {
            const exhibitionFrames = exhibition.movies.map((movie: any) => ({
              id: movie.movieId || movie.id,
              content: `Movie ${movie.movieId || movie.id}`,
              isPinned: movie.isPinned || false,
              imageUrl: movie.posterUrl
                ? `https://image.tmdb.org/t/p/w500${movie.posterUrl}`
                : "https://via.placeholder.com/300x450?text=No+Image",
              title: movie.title || `영화 ${movie.movieId}`,
              personaSummary: movie.personaSummary || null  // DB에서 가져온 AI 영화 소개
            }));
            setFrames(exhibitionFrames);
            setActiveIndex(Math.floor(exhibitionFrames.length / 2));
            console.log('영화 프레임 설정:', exhibitionFrames);
          }

          console.log('전시회 로드 성공:', exhibition);
        } catch (error) {
          console.error('전시회 로드 실패:', error);
        } finally {
          setLoadingTicket(false);
        }
      } else if (currentTicketId) {
        // 티켓 ID만 있으면 티켓 정보 로드 (기존 로직)
        try {
          setLoadingTicket(true);
          const response = await fetchTickets();
          const tickets = response.data;
          const ticket = tickets.find((t: Ticket) => t.id === currentTicketId);

          if (ticket) {
            setTicketInfo(ticket);
          } else {
            console.warn(`Ticket with id ${currentTicketId} not found, using default`);
            setTicketInfo(tickets[0] || null);
          }
        } catch (error) {
          console.error('티켓 정보 불러오기 실패:', error);
        } finally {
          setLoadingTicket(false);
        }
      }
    };

    loadTicketInfo();
  }, [currentTicketId, exhibitionIdParam]);

  // === 티켓 선택 시 영화 자동 로드 ===
  useEffect(() => {
    const loadMovies = async () => {
      // 전시회 ID가 있으면 영화를 자동으로 로드하지 않음 (이미 위에서 로드했으므로)
      if (exhibitionIdParam) return;

      try {
        const adultExclude = localStorage.getItem('adultExclude') === 'true';
        const response = await curateMovies(currentTicketId, 5, adultExclude);

        if (response.movies && response.movies.length > 0) {
          const newFrames: Frame[] = response.movies.map((movie) => ({
            id: movie.movieId,
            content: movie.title,
            imageUrl: movie.posterUrl.startsWith('http')
              ? movie.posterUrl
              : `https://image.tmdb.org/t/p/w500${movie.posterUrl}`
          }));

          setFrames(newFrames);
          setActiveIndex(Math.floor(newFrames.length / 2));
        }
      } catch (error) {
        console.error('영화 로드 실패:', error);
      }
    };

    loadMovies();
  }, [currentTicketId]);

  // === 고정된 영화 ID 목록 계산 ===
  const pinnedMovieIds = frames.filter(f => f.isPinned).map(f => f.id);

  // === 4. 핸들러들 ===
  const maxIndex = frames.length - 1;
  const handlePrev = () => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () => setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));

  const handleDelete = (frameId: number, currentIndex: number) => {
    setFrames((prev) => prev.filter((f) => f.id !== frameId));
    if (currentIndex >= frames.length - 1) {
      setActiveIndex(Math.max(0, frames.length - 2));
    }
  };

  // === 영화 포스터 클릭 핸들러 ===
  const handlePosterClick = async (frameId: number) => {
    try {
      setLoadingDetail(true);

      // 저장된 전시회인 경우: DB에서 가져온 personaSummary 사용
      if (isReadOnly) {
        const frame = frames.find(f => f.id === frameId);
        if (frame && (frame as any).personaSummary) {
          setSelectedMovieDetail({
            title: (frame as any).title || '',
            detail: (frame as any).personaSummary
          });
          return;
        }
      }

      // 새 전시회: Redis 캐시 확인 후 LLM 생성 (backend에서 처리)
      const response = await getMovieDetail(frameId, currentTicketId);

      setSelectedMovieDetail({
        title: response.title,
        detail: response.detail
      });
    } catch (error) {
      console.error('영화 상세 정보 로드 실패:', error);
      setSelectedMovieDetail({
        title: '오류',
        detail: '영화 정보를 불러오는데 실패했습니다.'
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // === 전시회 저장 핸들러 ===
  const handleSave = async () => {
    try {
      const exhibitionData = {
        title: exhibitionTitle || `전시회 ${new Date().toLocaleDateString()}`,
        isPublic: true,
        ticketId: currentTicketId, // 티켓 ID 추가
        // --- 디자인 요소 추가 ---
        backgroundStyle: bgStyle,   // 예: 'pink', 'pattern'
        frameStyle: frameStyle,     // 'none' 또는 'basic'
        cukeeStyle: cukeeStyle,     // 'line', 'noline', 'unbalance'
        movies: frames.map((frame: Frame, index: number) => ({
          movieId: frame.id,
          displayOrder: index,
          isPinned: frame.isPinned || false
        }))
      };

      const result = await createExhibition(exhibitionData);
      console.log('전시회 저장 성공:', result);
      alert('전시회가 저장되었습니다!');
    } catch (error) {
      console.error('전시회 저장 실패:', error);
      alert('전시회 저장에 실패했습니다. 로그인이 필요할 수 있습니다.');
    }
  };

  // === 영화 고정 핸들러 ===
  const handlePin = (frameId: number) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === frameId
          ? { ...frame, isPinned: !frame.isPinned }
          : frame
      )
    );
  };

  const handleExhibitionCreated = (data: AIExhibitionResponse) => {
    setAiStatus('idle'); // ai 상태 초기화
    console.log("전시회 생성 완료:", data);

    setExhibitionTitle(data.resultJson.title);
    setAiCuratorComment(data.resultJson.curatorComment || "");

    const newFrames: Frame[] = data.resultJson.movies.map((movie) => ({
      id: movie.movieId,
      content: movie.title, // ✅ [수정] curatorComment 대신 title 사용
      imageUrl: movie.posterUrl ?? "https://via.placeholder.com/300x450?text=No+Image"
    }));

    if (newFrames.length > 0) {
      // 🚨 [핵심 로직] 고정된 영화는 유지하고, 새로운 결과와 합치기 (Merge)
      setFrames((prevFrames) => {
        const pinnedFrames = prevFrames.filter((f) => f.isPinned);

        // 고정된 영화들의 ID 집합
        const pinnedIds = new Set(pinnedMovieIds);

        // AI가 준 결과 중, 이미 고정된 영화와 중복되는게 있다면 제외 (중복 방지)
        const pureNewFrames = newFrames.filter(nf => !pinnedIds.has(nf.id));

        // 최종 합치기: [고정된 영화들] + [AI가 새로 준 영화들]
        // 순서는 고정된 게 먼저 오게 하거나, AI 결과를 뒤에 붙이는 식 등 기획에 따라 조정 가능
        // 여기서는 "고정된 것 먼저 + 나머지 채우기"로 구현
        const mergedFrames = [...pinnedFrames, ...pureNewFrames];

        // 만약 합쳤는데 5개가 넘으면? (혹시 모를 에러 방지)
        return mergedFrames.slice(0, 5);
      });

      // 인덱스 초기화 (처음이나 중간으로)
      setActiveIndex(Math.floor(newFrames.length / 2));
    } else {
      // 영화가 없더라도 큐레이터 코멘트가 있으면 (가드레일 차단 등) 알림 띄우지 않음
      if (!data.resultJson.curatorComment) {
        alert("추천된 영화가 없습니다.");
      }
    }
  };

  // [신규] 에러 핸들러 (Generator에서 호출)
  const handleAIError = (msg: string) => {
    setErrorMessage(msg);
    setAiStatus('error');
  };

  // [신규] 좋아요 토글 핸들러 (낙관적 업데이트)
  const handleLikeToggle = async () => {
    // 1. 현재 티켓 정보가 없으면 중단
    if (!ticketInfo) return;

    // 2. 로그인 여부 체크 (간단히 localStorage 토큰 존재 여부 확인)
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    // 3. 현재 상태 저장 (롤백용)
    const previousTicketInfo = { ...ticketInfo };

    // 4. 낙관적 업데이트 (UI 즉시 반영)
    const newIsLiked = !ticketInfo.isLiked;
    const newLikeCount = newIsLiked
      ? ticketInfo.likeCount + 1
      : Math.max(0, ticketInfo.likeCount - 1);

    setTicketInfo({
      ...ticketInfo,
      isLiked: newIsLiked,
      likeCount: newLikeCount,
    });

    try {
      // 5. API 호출
      const updatedTicket = await toggleTicketLike(ticketInfo.id);

      // 6. 서버 응답으로 최종 상태 동기화 (확실하게)
      setTicketInfo(prev => prev ? {
        ...prev,
        isLiked: updatedTicket.isLiked,
        likeCount: updatedTicket.likeCount
      } : null);

    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      // 7. 실패 시 롤백
      setTicketInfo(previousTicketInfo);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 🚧 MainLayout이나 Header가 없으면 임시 div로 감싸세요.
  return (
    <div className={styles.container}>
      {/* 헤더 영역 */}
      <Header
        currentSection={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || "큐레이터")}
        exhibitionTitle={exhibitionTitle}
      />

      {/*  1. 저장된 전시회(isReadOnly)라면 상단 컨트롤(저장/꾸미기) 숨기기 */}
      {!isReadOnly && (
        <TopControls
          onSave={handleSave}
          onDecorate={() => setBottomMode('decorate')}
        />
      )}

      {/* 갤러리 영역 */}
      <div className={`${styles.galleryWrapper} ${isReadOnly ? styles.moveDown : ''}`}>
        <Gallery3D
          frames={frames}
          activeIndex={activeIndex}
          frameStyle={frameStyle} // 👈 추가
          onPrev={handlePrev}
          onNext={handleNext}
          onSelect={setActiveIndex}
          onPosterClick={handlePosterClick}
          onDelete={isReadOnly ? undefined : handleDelete}
          onPin={isReadOnly ? undefined : handlePin}
        />
      </div>

      <CuratorGuide
        // API에 이미지가 있으면 그걸 쓰고, 없으면 위에서 만든 규칙(cara + 번호)을 사용
        //characterImageUrl={ticketInfo?.characterImageUrl || dynamicCharacterImage}

        // [중요] 여기서 사용자가 선택한 스타일이 적용된 이미지를 보여줍니다.
        characterImageUrl={`/cara_style/${cukeeId}/${cukeeStyle}.png`}

        curatorName={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || 'MZ 큐레이터')}
        // 여기서 상태에 따른 메시지를 주입합니다.
        curatorMessage={getCuratorMessage()}

        // [신규] 좋아요 정보 전달
        likeCount={ticketInfo?.likeCount || 0}
        isLiked={ticketInfo?.isLiked || false}
        onToggleLike={handleLikeToggle}
      />

      {/* 오른쪽 하단 티켓 이미지 영역 */}
      <div className={styles.ticketWrapper}>
        <img
          // API에 티켓 이미지가 있다면 그걸 쓰고, 없으면 로컬 파일 규칙 사용
          src={ticketInfo?.ticketImageUrl || dynamicTicketImage}
          alt="Ticket"
          className={styles.ticketImage}
        />
      </div>

      {/* ✅ [수정] 조건문(!isReadOnly) 제거 -> 항상 렌더링하되 isReadOnly prop 전달 */}
      {bottomMode === 'action' && (
        <ExhibitionGenerator
          currentTicketId={currentTicketId}
          onSuccess={handleExhibitionCreated}
          onLoadingStart={() => {
            setAiStatus('loading');
            setSelectedMovieDetail(null);
            setAiCuratorComment("");
          }}
          onError={handleAIError}
          isLoading={aiStatus === 'loading' || aiStatus === 'delayed'}
          pinnedMovieIds={pinnedMovieIds}
          isReadOnly={isReadOnly}
        />
      )}

      {bottomMode === 'decorate' && (
        <ExhibitionDecorate
          onClose={() => setBottomMode('action')}
          ticketId={currentTicketId}
          cukeeStyle={cukeeStyle}
          onChangeCukeeStyle={setCukeeStyle}
          frameStyle={frameStyle}
          onChangeFrameStyle={setFrameStyle}
          bgStyle={bgStyle}
          onChangeBgStyle={setBgStyle}
        />
      )}
    </div>
  );
};