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
import { curateMovies, getMovieDetail } from '../../apis/ai'; // 영화 조회 API
import { fetchTickets, type Ticket, createExhibition, updateExhibition, getExhibitionById } from '../../apis/exhibition';

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
  const exhibitionIdParam = searchParams.get('exhibitionId'); // 전시회 ID 파라미터
  const currentTicketId = ticketIdParam ? parseInt(ticketIdParam, 10) : 1;
  // 예: ticket=1 -> /cara/cara1.png
  // 예: ticket=2 -> /cara/cara2.png
  const dynamicCharacterImage = `/cara/cara${currentTicketId}.png`;
  const dynamicTicketImage = `/ticket/ticket${currentTicketId}.png`;

  // === 3.  티켓 정보 상태 ===
  const [ticketInfo, setTicketInfo] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);

  // === 4. (추가) AI 상태 및 에러 메시지 관리 ===
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // === 5. 영화 상세 정보 상태 ===
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<{ title: string; detail: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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


  // [신규] 상태에 따른 큐레이터 멘트 결정 함수
  const getCuratorMessage = () => {
    if (loadingTicket) return "티켓 정보를 불러오는 중입니다...";

    // 영화 상세 정보가 로딩 중이면 표시
    if (loadingDetail) return "영화 정보를 불러오는 중...";

    // 영화 상세 정보가 있으면 표시
    if (selectedMovieDetail) {
      return `${selectedMovieDetail.title}\n\n${selectedMovieDetail.detail}`;
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

  // [신규] 티켓 정보를 불러오는 useEffect
  useEffect(() => {
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
              content: movie.title || `영화 ${movie.movieId || movie.id}`, // ✅ [수정] 제목이 있으면 제목 사용
              isPinned: movie.isPinned || false,
              imageUrl: movie.posterUrl
                ? `https://image.tmdb.org/t/p/w500${movie.posterUrl}`
                : "https://via.placeholder.com/300x450?text=No+Image",
              title: movie.title || `영화 ${movie.movieId}`
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
        const response = await curateMovies(currentTicketId, 5);

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

      // 티켓 ID를 전달하여 해당 티켓의 LORA 테마 사용
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
        movies: frames.map((frame: Frame, index: number) => ({
          movieId: frame.id,
          displayOrder: index,
          isPinned: frame.isPinned || false
        }))
      };

      if (exhibitionIdParam) {
        // ✅ [수정] 기존 전시회 업데이트 (PUT)
        const result = await updateExhibition(parseInt(exhibitionIdParam, 10), exhibitionData);
        console.log('전시회 업데이트 성공:', result);
        alert('전시회가 업데이트되었습니다!');
      } else {
        // [기존] 새 전시회 생성 (POST)
        const result = await createExhibition(exhibitionData);
        console.log('전시회 저장 성공:', result);
        alert('전시회가 저장되었습니다!');
      }
    } catch (error) {
      console.error('전시회 저장(수정) 실패:', error);
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
      alert("추천된 영화가 없습니다.");
    }
  };

  // [신규] 에러 핸들러 (Generator에서 호출)
  const handleAIError = (msg: string) => {
    setErrorMessage(msg);
    setAiStatus('error');
  };

  // 🚧 MainLayout이나 Header가 없으면 임시 div로 감싸세요.
  return (
    <div className={styles.container}>
      {/* 헤더 영역 (임시 구현) */}
      <Header
        currentSection={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || "큐레이터")}
        exhibitionTitle={exhibitionTitle}
      />

      <TopControls
        onSave={handleSave}
        onDecorate={() => console.log('Decorate')}
      />

      <Gallery3D
        frames={frames}
        activeIndex={activeIndex}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelect={setActiveIndex}
        onDelete={handleDelete}
        onPosterClick={handlePosterClick}
        onPin={handlePin}
      />

      <CuratorGuide
        // API에 이미지가 있으면 그걸 쓰고, 없으면 위에서 만든 규칙(cara + 번호)을 사용
        characterImageUrl={ticketInfo?.characterImageUrl || dynamicCharacterImage}

        curatorName={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || 'MZ 큐레이터')}
        // 여기서 상태에 따른 메시지를 주입합니다.
        curatorMessage={getCuratorMessage()}
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

      <ExhibitionGenerator
        // ✅ [수정] 티켓 정보가 로드되었다면 그 ID를 우선 사용 (저장된 전시회의 테마 유지)
        currentTicketId={ticketInfo?.id || currentTicketId}
        onSuccess={handleExhibitionCreated}
        // [신규] 하위 컴포넌트가 부모 상태를 바꿀 수 있게 props 전달
        onLoadingStart={() => {
          setAiStatus('loading');
          setSelectedMovieDetail(null);
          setAiCuratorComment("");
        }}
        onError={handleAIError}
        isLoading={aiStatus === 'loading' || aiStatus === 'delayed'}
        pinnedMovieIds={pinnedMovieIds} // [추가] 고정된 영화 목록 전달
      />
    </div>
  );
};