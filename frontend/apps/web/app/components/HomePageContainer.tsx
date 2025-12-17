// app/(routes)/components/HomePageContainer.tsx

'use client'; 

import { Header, MainLayout, MainCarousel } from '@repo/ui'; 
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { TICKET_DATA } from '../../src/data/tickets'; // 데이터 임포트

// --- 고정 데이터 (API 미연동 상태) ---
const currentNickname = '길초'; 
const likeCount = 103; 
const curatorIntroText = "안녕하세요. MZ 큐레이터 김엠지예요. 밝고 도파민 터지는 영화만 추천해줄게요.";

export const HomePageContainer: React.FC = () => {
  const router = useRouter(); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalTickets = TICKET_DATA.length;
  const currentTicket = TICKET_DATA[currentIndex]; 

  const handleNext = () => {
    if (currentIndex < TICKET_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleTicketClick = (ticketId: number) => {
    router.push(`/exhibition?ticket=${ticketId}`); 
  };

  return (
    <MainLayout>
      <div className="header-outer-wrapper">
          <Header currentSection={currentTicket.curatorName} /> 
      </div>
      {/* 1. [가운데 정렬 구역] 텍스트 + 티켓 */}
      <div className="inner-container">
          <main className="cukee-main-content">
            <div className="home-upper-split">
                <div className="cukee-deco-box"></div>
                {/* 왼쪽 텍스트 구역 */}
                <div className="home-text-section">
                  <div>
                    <h1>
                      {currentNickname}님,<br/>어떤 영화를<br/>보고 싶나요?
                    </h1>
                    <p className="fixed-text">
                      당신을 위한 큐레이터가 대기 중이에요.
                    </p>
                  </div>
                  
                  {/* 카운터 */}
                  <p className="ticket-counter">
                    <span className="counter-current">
                      {(currentIndex + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="counter-total">
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
                }}>
                  <MainCarousel
                    tickets={TICKET_DATA}
                    currentIndex={currentIndex}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onTicketClick={handleTicketClick}
                  />
                </div>
            </div>
          </main>
      </div>


      {/* 2. [전체 너비 구역] 갈색 박스 */}
      <div className="curator-info-box">
          <div className="curator-content-wrapper">
              <h2 className="curator-name-display">
                {currentTicket.curatorName}
              </h2>
              
              <div className="curator-likes-info">
                <p style={{ margin: '0 0 4px 0' }}>♥  {likeCount}명의 유저가 이 전시회를 좋아해요.</p>
                <div className="curator-speech-bubble2">
                  <div className="curator-speech-bubble">
                    {curatorIntroText}
                  </div>
                </div>
              </div>
          </div>
      </div>

    </MainLayout>
  );
}