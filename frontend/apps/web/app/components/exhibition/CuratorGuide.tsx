// apps/web/app/components/exhibition/CuratorGuide.tsx
'use client';

interface CuratorGuideProps {
    likeCount?: number;
    message?: React.ReactNode; // 줄바꿈 등을 위해 Node 허용
}

export const CuratorGuide = ({ 
    likeCount = 103, 
    message = <>안녕, 길초! MZ 큐레이터 김엠지 예요.<br />짧고 도파민 터지는 맛도리 영화만 추천해줄게요.</> 
}: CuratorGuideProps) => {
  return (
    <div className="middle-interaction-area">
      <div className="character-wrapper">
        {/* 이미지 경로는 props로 받아도 되고 고정해도 됨 */}
        <img src="/cara/c1.png" alt="MZ Curator" className="character-img" />
      </div>

      <div className="bubble-wrapper">
        <p className="like-info">♥ {likeCount} 명의 유저가 이 쿠키를 좋아해요.</p>
        <div className="curator-speech-bubble">
          {message}
        </div>
      </div>
      
      {/* 나중에 티켓 컴포넌트 추가 공간 */}
      {/* <div className="ticket-deco"></div> */}
    </div>
  );
};