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
  // === 1. 갤러리 관련 상태 ===
  const [frames, setFrames] = useState(INITIAL_FRAMES);
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // [복구] 전시회 꾸미기 상태 관리
  const [isDecorateMode, setIsDecorateMode] = useState(false);
  const [bgStyle, setBgStyle] = useState('1');
  const [frameStyle, setFrameStyle] = useState('default');
  const [cookieStyle, setCookieStyle] = useState('default');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  // 티켓 ID
  const currentTicketId = 123;

  // === 2. 갤러리 조작 핸들러 ===
  const maxIndex = frames.length - 1;
  const handlePrev = () => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () => setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));

  const handleDelete = (frameId: number, currentIndex: number) => {
    // 삭제 로직 기존 유지
  };

  // === 3. [핵심] AI가 생성 완료했을 때 호출될 함수 ===
  const handleExhibitionCreated = (data: AIExhibitionResponse) => {
    console.log("AI 생성이 완료되어 부모가 데이터를 받았습니다:", data);
  };

  return (
    <MainLayout>
      {/* [수정] 배경 스타일에 따라 클래스 및 인라인 스타일 적용 */}
      <div
        className={`exh-container bg-style-${bgStyle}`}
        style={bgStyle === '5' && customBgImage ? { backgroundImage: `url(${customBgImage})` } : {}}
      >
        <div className="header-outer-wrapper">
          <Header currentSection="romancerCukee" />
        </div>
        <TopControls
          onSave={() => console.log('Save')}
          onDecorate={() => setIsDecorateMode(!isDecorateMode)}
          isDecorateMode={isDecorateMode}
        />
        <Gallery3D
          frames={frames}
          activeIndex={activeIndex}
          onPrev={handlePrev}
          onNext={handleNext}
          onSelect={setActiveIndex}
          onDelete={handleDelete}
          frameStyle={frameStyle}
        />

        <CuratorGuide cookieStyle={cookieStyle} />

        <ExhibitionGenerator
          currentTicketId={currentTicketId}
          onSuccess={handleExhibitionCreated}
          isDecorateMode={isDecorateMode}
          onSaveDecorate={() => setIsDecorateMode(false)}
          onBgStyleChange={setBgStyle}
          onFrameStyleChange={setFrameStyle}
          onCookieStyleChange={setCookieStyle}
          onCustomBgImageChange={setCustomBgImage}
          currentStyles={{ bgStyle, frameStyle, cookieStyle }}
        />
      </div>
    </MainLayout>
  );
};