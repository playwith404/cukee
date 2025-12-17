// apps/web/app/components/ExhPageContainer.tsx
'use client';

import React, { useState } from 'react';
import { Header, MainLayout } from '@repo/ui';
import '../styles/exh.css';

// 컴포넌트 import
import { TopControls } from './exhibition/TopControls';
import { Gallery3D } from './exhibition/Gallery';
import { CuratorGuide } from './exhibition/CuratorGuide';
import { ActionBottomBar } from './exhibition/ActionBottomBar';

// Mock Data
const INITIAL_FRAMES = [
  { id: 1, content: 'Frame 1' },
  { id: 2, content: 'Frame 2' },
  { id: 3, content: 'Frame 3' },
  { id: 4, content: 'Frame 4' },
  { id: 5, content: 'Frame 5' },
];

export const ExhPageContainer: React.FC = () => {
  // === State 관리 ===
  const [frames, setFrames] = useState(INITIAL_FRAMES);
  
  // 초기 인덱스 계산
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  
  const [promptValue, setPromptValue] = useState('');

  // === Handlers (로직) ===
  const maxIndex = frames.length - 1;

  const handlePrev = () => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () => setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));

  const handleDelete = (frameId: number, currentIndex: number) => {
    if (frames.length <= 1) {
        alert("최소 1개의 액자는 남겨야 합니다.");
        return;
    }
    if (!window.confirm("삭제한 영화는 다시 추천받을 수 없습니다. 삭제하시겠습니까?")) {
        return;
    }

    const newFrames = frames.filter(frame => frame.id !== frameId);
    setFrames(newFrames);

    // 인덱스 보정 로직
    if (currentIndex < activeIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (currentIndex === activeIndex && currentIndex === frames.length - 1) {
      setActiveIndex(Math.max(0, activeIndex - 1));
    }
  };

  const handlePromptSubmit = () => {
    console.log("프롬프트 제출:", promptValue);
    // TODO: AI API 호출 등
  };

  // === Rendering ===
  return (
    <MainLayout>
      <div className="exh-container">
        <div className="header-outer-wrapper">
            <Header currentSection="romancerCukee" />
        </div>
        
        {/* 1. 상단 컨트롤 */}
        <TopControls 
            onSave={() => console.log('Save')} 
            onDecorate={() => console.log('Decorate')} 
        />

        {/* 2. 3D 갤러리 */}
        <Gallery3D 
            frames={frames}
            activeIndex={activeIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelect={setActiveIndex}
            onDelete={handleDelete}
        />

        {/* 3. 중간 캐릭터 영역 */}
        <CuratorGuide />

        {/* 4. 하단 바 */}
        <ActionBottomBar 
            promptValue={promptValue}
            setPromptValue={setPromptValue}
            onSubmit={handlePromptSubmit}
        />
      </div>
    </MainLayout>
  );
};