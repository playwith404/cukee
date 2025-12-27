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
import type { AIExhibitionResponse } from '../../apis/ai'; // 👈 경로 확인
import { curateMovies } from '../../apis/ai'; // 영화 조회 API
import { fetchTickets, type Ticket } from '../../apis/exhibition'; // 👈 경로 확인

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

  // === 2. URL 파라미터 (React Router 방식) ===
  const [searchParams] = useSearchParams(); // 👈 변경 포인트 2 (배열 반환됨)
  const ticketIdParam = searchParams.get('ticket');
  const currentTicketId = ticketIdParam ? parseInt(ticketIdParam, 10) : 1;
  // 예: ticket=1 -> /cara/cara1.png
  // 예: ticket=2 -> /cara/cara2.png
  const dynamicCharacterImage = `/cara/cara${currentTicketId}.png`;
  
  // === 3. 티켓 정보 상태 ===
  const [ticketInfo, setTicketInfo] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);

  useEffect(() => {
    const loadTicketInfo = async () => {
      try {
        setLoadingTicket(true);
        // API 호출 (가짜 데이터나 실제 API)
        const response = await fetchTickets();
        // response구조에 따라 .data가 없을수도 있으니 확인 필요
        const ticket = response.data?.find((t: Ticket) => t.id === currentTicketId);

        if (ticket) {
          setTicketInfo(ticket);
        }
      } catch (error) {
        console.error('티켓 정보 로드 실패:', error);
      } finally {
        setLoadingTicket(false);
      }
    };

    loadTicketInfo();
  }, [currentTicketId]);

  // === 티켓 선택 시 영화 자동 로드 ===
  useEffect(() => {
    const loadMovies = async () => {
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

  const handleExhibitionCreated = (data: AIExhibitionResponse) => {
    console.log("전시회 생성 완료:", data);

    setExhibitionTitle(data.resultJson.title);

    const newFrames: Frame[] = data.resultJson.movies.map((movie) => ({
      id: movie.movieId,
      content: movie.curatorComment,
      imageUrl: movie.posterUrl ?? "https://via.placeholder.com/300x450?text=No+Image"
    }));

    if (newFrames.length > 0) {
      setFrames(newFrames);
      setActiveIndex(Math.floor(newFrames.length / 2));
    } else {
      alert("추천된 영화가 없습니다.");
    }
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
        onSave={() => console.log('Save')}
        onDecorate={() => console.log('Decorate')}
      />

      <Gallery3D
        frames={frames}
        activeIndex={activeIndex}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelect={setActiveIndex}
        onDelete={handleDelete}
      />

      <CuratorGuide
        // API에 이미지가 있으면 그걸 쓰고, 없으면 위에서 만든 규칙(cara + 번호)을 사용
        characterImageUrl={ticketInfo?.characterImageUrl || dynamicCharacterImage}
        
        curatorName={loadingTicket ? "로딩 중..." : (ticketInfo?.curatorName || 'MZ 큐레이터')}
        curatorMessage={loadingTicket ? "티켓 정보를 불러오는 중입니다..." : (ticketInfo?.curatorMessage || '안녕하세요! 당신을 위한 영화를 추천해드릴게요.')}
      />

      <ExhibitionGenerator
        currentTicketId={currentTicketId}
        onSuccess={handleExhibitionCreated}
      />
    </div>
  );
};