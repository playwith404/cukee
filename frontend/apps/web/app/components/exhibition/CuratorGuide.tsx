// apps/web/app/components/exhibition/CuratorGuide.tsx
'use client';
import styles from './CuratorGuide.module.css';

interface CuratorGuideProps {
    likeCount?: number;
    message?: React.ReactNode; // 줄바꿈 등을 위해 Node 허용
}

export const CuratorGuide = ({ 
    likeCount = 103, 
    message = <>안녕, 길초! MZ 큐레이터 김엠지 예요.<br />짧고 도파민 터지는 맛도리 영화만 추천해줄게요.</> 
}: CuratorGuideProps) => {
  return (
    <div className={styles.container}>
      
      {/* 캐릭터 영역 */}
      <div className={styles.charWrapper}>
        <img 
            src="/cara/c1.png" 
            alt="MZ Curator" 
            className={styles.charImg} 
        />
      </div>

      {/* 말풍선 및 좋아요 정보 영역 */}
      <div className={styles.bubbleWrapper}>
        <p className={styles.likeInfo}>
            ♥ {likeCount} 명의 유저가 이 쿠키를 좋아해요.
        </p>
        
        <div className={styles.bubble}>
          {message}
        </div>
      </div>
      
      {/* 나중에 티켓 컴포넌트 추가 공간 */}
      {/* <div className="ticket-deco"></div> */}
    </div>
  );
};