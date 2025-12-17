'use client';

import React, { useState } from 'react';
import { Header, MainLayout } from '@repo/ui';
import '../styles/exh.css';

// 기존 MOCK_FRAMES를 객체 배열로 변경하여 id 부여 (삭제를 위해 필수)
const INITIAL_FRAMES = [
  { id: 1, content: 'Frame 1' },
  { id: 2, content: 'Frame 2' },
  { id: 3, content: 'Frame 3' },
  { id: 4, content: 'Frame 4' },
  { id: 5, content: 'Frame 5' },
];

export const ExhPageContainer: React.FC = () => {
  // 1. MOCK_FRAMES를 상태로 관리하여 동적으로 변경 가능하도록 수정
  const [frames, setFrames] = useState(INITIAL_FRAMES);

  // 액자 개수가 변경될 수 있으므로, 초기 인덱스는 2 (5개일 때 가운데)
  // 1개만 남으면 0, 4개면 2, 5개면 2가 되도록 중앙 인덱스를 계산합니다.
  const initialIndex = frames.length > 0 ? Math.floor(frames.length / 2) : 0;
  
  // activeIndex를 중앙 인덱스로 설정
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [promptValue, setPromptValue] = useState('');
  
  // 현재 배열의 최대 인덱스
  const maxIndex = frames.length - 1;

  // 이전 버튼 (동적 길이 처리)
  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // 다음 버튼 (동적 길이 처리)
  const handleNext = () => {
    // maxIndex가 0보다 작으면 (빈 배열) 다음으로 갈 수 없음
    setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
  };

  // 2. 액자 삭제 함수 추가
  const handleDelete = (frameId: number, currentIndex: number) => {
    if (frames.length <= 1) {
        alert("최소 1개의 액자는 남겨야 합니다.");
        return;
    }
    // confirm() 경고창 추가
    const isConfirmed = window.confirm(
        "삭제한 영화는 다시 추천받을 수 없습니다. 삭제하시겠습니까?"
    );

    // 사용자가 '취소'를 누르면 함수 종료
    if (!isConfirmed) {
        return;
    }
    // 해당 ID를 제외한 새 배열 생성
    const newFrames = frames.filter(frame => frame.id !== frameId);
    setFrames(newFrames);

    // 액자가 삭제되었을 때 activeIndex 재조정
    // 1) 삭제된 액자가 중앙 인덱스보다 앞에 있으면 인덱스를 1 줄임
    // 2) 삭제 후 새 배열의 최대 인덱스를 초과하는 경우, 최대 인덱스로 이동
    if (currentIndex < activeIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (currentIndex === activeIndex && currentIndex === frames.length - 1) {
      // 마지막 액자가 삭제되었을 경우 (예: 5개 중 4번째 액자가 삭제되어 4개가 남았을 때)
      setActiveIndex(Math.max(0, activeIndex - 1));
    }
  };


  // 인덱스 차이에 따라 CSS 클래스 부여 (3D 효과 핵심)
  // [수정 불필요] 이 함수는 현재 배열에 대한 상대 인덱스만 계산하므로 그대로 둡니다.
  const getFrameClass = (index: number) => {
    const diff = index - activeIndex;
    if (diff === 0) return 'center';
    if (diff === -1) return 'left-1';
    if (diff === 1) return 'right-1';
    if (diff === -2) return 'left-2';
    if (diff === 2) return 'right-2';
    return 'hidden';
  };

  return (
    <MainLayout>
      <div className="exh-container">
        {/* 1. Header 영역 (sticky) */}
        <div className="header-outer-wrapper">
            <Header currentSection="romancerCukee" />
        </div>
        
        {/* 2. 상단 버튼 (저장/꾸미기) */}
        <div className="exh-top-controls">
          <button className="control-btn">전시회 저장하기</button>
          <button className="control-btn">전시회 꾸미기</button>
        </div>

        {/* 3. 3D 포스터 갤러리 */}
        <div className="exh-gallery-area">
          {/* 이전/다음 버튼 비활성화 처리 추가 */}
          <button className="nav-arrow prev" onClick={handlePrev} disabled={activeIndex === 0}>&lt;</button>

          {/* MOCK_FRAMES 대신 frames 상태 사용 */}
          {frames.map((frame, index) => (
            <div 
              key={frame.id} 
              className={`poster-frame ${getFrameClass(index)}`}
              onClick={() => setActiveIndex(index)} // 클릭 시 해당 포스터가 중앙으로
            >
              <div className="poster-content" />

              {/* 중앙에 왔을 때만 보이는 액션 텍스트 */}
              {/* 3. 삭제하기 버튼에 handleDelete 함수 연결 */}
              {getFrameClass(index) === 'center' && (
                <div className="poster-actions">
                  <span style={{cursor: 'pointer'}}>고정하기 </span>| 
                  <span 
                    style={{cursor: 'pointer'}} 
                    onClick={(e) => { 
                        e.stopPropagation(); // 액자 클릭 이벤트 방지
                        handleDelete(frame.id, index);
                    }}
                  > 삭제하기</span>
                </div>
              )}
               {/* 중앙이 아니면 렌더링하지 않거나, 투명도만 0 처리 */}
               {getFrameClass(index) !== 'center' && (
                   <div className="poster-actions" style={{ opacity: 0 }}>고정하기 | 삭제하기</div>
               )}
            </div>
          ))}

          {/* 이전/다음 버튼 비활성화 처리 추가 */}
          <button className="nav-arrow next" onClick={handleNext} disabled={activeIndex === maxIndex || frames.length === 0}>&gt;</button>
        </div>

        {/* 4. 캐릭터 & 말풍선 인터랙션 영역 (이하 동일) */}
        <div className="middle-interaction-area">
          <div className="character-wrapper">
            <img src="/cara/c1.png" alt="MZ Curator" className="character-img" />
          </div>

          <div className="bubble-wrapper">
            <p className="like-info">♥ 103 명의 유저가 이 쿠키를 좋아해요.</p>
            <div className="curator-speech-bubble">
              안녕, 길초! MZ 큐레이터 김엠지 예요.<br />
              짧고 도파민 터지는 맛도리 영화만 추천해줄게요.
            </div>
          </div>

          {/* <div className="ticket"></div> */}
          {/* 나중에 티켓 영역 */}
        </div>

        {/* 5. 하단 검은색 바 (프롬프트 입력) (이하 동일) */}
        <div className="exh-bottom-bar">
          <div className="prompt-input-wrapper">
            <input 
              type="text" 
              className="prompt-input" 
              placeholder="cukee 프롬프트 입력하기"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
            />
            <button className="prompt-submit-btn">→</button>
          </div>

          <div className="bottom-actions">
            <button className="action-chip">조금 더 감동적인 영화를 원해!</button>
            <button className="action-chip">영화 개수를 좀 더 늘려줘!</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};