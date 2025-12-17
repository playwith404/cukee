// apps/web/app/components/ExhPageContainer.tsx
'use client';

import React, { useState } from 'react';
import { Header, MainLayout } from '@repo/ui';
import '../styles/exh.css';

import { TopControls } from './exhibition/TopControls';
import { Gallery3D } from './exhibition/Gallery';
import { CuratorGuide } from './exhibition/CuratorGuide';
// [변경] ActionBottomBar 대신 ExhibitionGenerator를 가져옵니다.
import { ExhibitionGenerator } from './exhibition/ExhGenerator';
import { AIExhibitionResponse } from '../types/ai';

const INITIAL_FRAMES = [
  { id: 1, content: 'Frame 1' },
  { id: 2, content: 'Frame 2' },
  { id: 3, content: 'Frame 3' },
  { id: 4, content: 'Frame 4' },
  { id: 5, content: 'Frame 5' },
];

export const ExhPageContainer: React.FC = () => {
  // === 1. 갤러리 관련 상태만 남음 (깔끔!) ===
  const [frames, setFrames] = useState(INITIAL_FRAMES);
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  
  // 티켓 ID
  const currentTicketId = 123; 

  // === 2. 갤러리 조작 핸들러 ===
  const maxIndex = frames.length - 1;
  const handlePrev = () => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () => setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));

  const handleDelete = (frameId: number, currentIndex: number) => {
      // (삭제 로직 기존과 동일... 생략)
  };

  // === 3. [핵심] AI가 생성 완료했을 때 호출될 함수 ===
  const handleExhibitionCreated = (data: AIExhibitionResponse) => {
    console.log("AI 생성이 완료되어 부모가 데이터를 받았습니다:", data);
    
    // TODO: 받아온 data.resultJson.movies를 가공해서 setFrames로 업데이트!
    // alert(`"${data.resultJson.title}" 전시회로 변경합니다.`);
    
    // 예시: setFrames(convertDataToFrames(data.resultJson.movies));
  };

  return (
    <MainLayout>
      <div className="exh-container">
        <div className="header-outer-wrapper">
            <Header currentSection="romancerCukee" />
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

        <CuratorGuide />

        {/* [변경] 하단바 자리에 Generator를 배치 
            이제 여기서는 prompt나 loading을 신경 안 써도 됨.
            오직 "결과가 나오면(onSuccess) 무엇을 할지"만 정하면 됨.
        */}
        <ExhibitionGenerator 
            currentTicketId={currentTicketId}
            onSuccess={handleExhibitionCreated}
        />
      </div>
    </MainLayout>
  );
};