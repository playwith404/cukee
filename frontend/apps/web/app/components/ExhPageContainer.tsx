// apps/web/app/components/ExhPageContainer.tsx
'use client';

import React, { useState } from 'react';
import { Header, MainLayout } from '@repo/ui';
// import '../styles/exh.css';
import styles from './ExhPageContainer.module.css';

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
      {/* ✅ [변경] 문자열 "exh-container" 대신 
         모듈 객체 styles.container를 사용합니다. 
      */}
      <div className={styles.container}>
        
        {/* 헤더 위치 잡는 CSS도 모듈화했다면 styles.headerWrapper 등으로 변경 필요 */}
        <div className="header-outer-wrapper">
            <Header currentSection="romancerCukee" />
        </div>

        {/* 👇 자식 컴포넌트들 (TopControls, Gallery3D 등)은
          각자의 파일 안에서 자신의 module.css를 import하고 있을 것이므로
          여기서는 아무것도 건드릴 필요가 없습니다! (이게 모듈화의 장점)
        */}
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

        <ExhibitionGenerator 
            currentTicketId={currentTicketId}
            onSuccess={handleExhibitionCreated}
        />
      </div>
    </MainLayout>
  );
};