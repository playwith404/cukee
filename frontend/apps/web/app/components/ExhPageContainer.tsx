// apps/web/app/components/ExhPageContainer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header, MainLayout } from '@repo/ui';
// import '../styles/exh.css';
import styles from './ExhPageContainer.module.css';

import { TopControls } from './exhibition/TopControls';
import { Gallery3D } from './exhibition/Gallery';
import { CuratorGuide } from './exhibition/CuratorGuide';
import { ExhibitionGenerator } from './exhibition/ExhGenerator';
import { AIExhibitionResponse } from "../../src/apis/ai";
import { fetchTickets, Ticket } from '../../src/apis/tickets';

import { ExhibitionDetailResponse } from '../../src/apis/exhibition';
import { Frame } from './exhibition/Gallery';

const INITIAL_FRAMES = [
  { id: 1, content: 'Frame 1' },
  { id: 2, content: 'Frame 2' },
  { id: 3, content: 'Frame 3' },
  { id: 4, content: 'Frame 4' },
  { id: 5, content: 'Frame 5' },
];

export const ExhPageContainer: React.FC = () => {
  // === 1. 갤러리 관련 상태만 남음 (깔끔!) ===
  const [frames, setFrames] = useState<Frame[]>(INITIAL_FRAMES);
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [exhibitionTitle, setExhibitionTitle] = useState("나만의 전시회");

  // URL 파라미터에서 티켓 ID 가져오기
  const searchParams = useSearchParams();
  const ticketIdParam = searchParams.get('ticket');
  const currentTicketId = ticketIdParam ? parseInt(ticketIdParam, 10) : 1;

  // 티켓 정보 상태
  const [ticketInfo, setTicketInfo] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);

  // 티켓 정보 로드
  useEffect(() => {
    const loadTicketInfo = async () => {
      try {
        setLoadingTicket(true);
        const response = await fetchTickets();
        const ticket = response.data.find((t: Ticket) => t.id === currentTicketId);

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

  // === 2. 갤러리 조작 핸들러 ===
  const maxIndex = frames.length - 1;
  const handlePrev = () => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () => setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));

  const handleDelete = (frameId: number, currentIndex: number) => {
    setFrames((prev) => prev.filter((f) => f.id !== frameId));
    if (currentIndex >= frames.length - 1) {
      setActiveIndex(Math.max(0, frames.length - 2));
    }
  };

  // === 3. [핵심] AI가 생성 완료했을 때 호출될 함수 ===
  // 나중에 커스텀 훅으로 분리하기!!!!!!!!
  const handleExhibitionCreated = (data: AIExhibitionResponse) => {
    console.log("전시회 생성 완료~:", data);

    // TODO: 받아온 data.resultJson.movies를 가공해서 setFrames로 업데이트!
    // alert(`"${data.resultJson.title}" 전시회로 변경합니다.`);

    // 예시: setFrames(convertDataToFrames(data.resultJson.movies));

    // (1) 제목 업데이트
    setExhibitionTitle(data.resultJson.title);

    // (2) 영화 데이터 변환 (API 데이터 -> 갤러리 프레임 포맷)
    const newFrames: Frame[] = data.resultJson.movies.map((movie) => ({
      id: movie.movieId,
      // 멘트도 넣고, 이미지도 넣습니다. (없으면 없는대로 동작함)
      content: movie.curatorComment,
      imageUrl: movie.posterUrl ?? "https://via.placeholder.com/300x450?text=No+Image"
    }));

    // (3) 상태 업데이트 -> 화면이 자동으로 바뀜!
    if (newFrames.length > 0) {
      setFrames(newFrames);
      setActiveIndex(Math.floor(newFrames.length / 2)); // 다시 가운데 정렬: 3번 영화가 가운데로
    } else {
      alert("추천된 영화가 없습니다.");
    }

  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className="header-outer-wrapper">
          <Header
            currentSection={ticketInfo?.curatorName || "큐레이터"}
            exhibitionTitle={exhibitionTitle}
          // 나중에 여기에 onSelectExhibition={handleLoadExhibition} 이런 식으로 연결
          //드롭다운에서 전시회 선택하면 화면 전환하게
          />
        </div>
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
          characterImageUrl={ticketInfo?.characterImageUrl || '/cara/cara1.png'}
          curatorName={ticketInfo?.curatorName || 'MZ 큐레이터'}
          curatorMessage={ticketInfo?.curatorMessage || '안녕하세요! 당신을 위한 영화를 추천해드릴게요.'}
        />
        {/* 하단 입력바 (성공 시 handleExhibitionCreated 호출) */}
        <ExhibitionGenerator
          currentTicketId={currentTicketId}
          onSuccess={handleExhibitionCreated}
        />
      </div>
    </MainLayout>
  );
};