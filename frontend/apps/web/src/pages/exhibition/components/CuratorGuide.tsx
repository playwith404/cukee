import React from 'react';
import styles from './CuratorGuide.module.css';

interface CuratorGuideProps {
    characterImageUrl?: string;
    curatorName?: string;
    curatorMessage?: string;
    likeCount?: number;
    message?: React.ReactNode;
}

export const CuratorGuide: React.FC<CuratorGuideProps> = ({
    characterImageUrl = '/cara/cara1.png', // public 폴더 기준 경로
    curatorName = 'MZ 큐레이터',
    curatorMessage,
    likeCount = 103,
    message
}) => {
  const displayMessage = curatorMessage || message || <>안녕, 길초! MZ 큐레이터 김엠지 예요.<br />짧고 도파민 터지는 맛도리 영화만 추천해줄게요.</>;

  return (
    <div className={styles.container}>
      {/* 캐릭터 영역 */}
      <div className={styles.charWrapper}>
        <img
            src={characterImageUrl}
            alt={curatorName}
            className={styles.charImg}
        />
      </div>

      {/* 말풍선 및 좋아요 정보 영역 */}
      <div className={styles.bubbleWrapper}>
        <p className={styles.likeInfo}>
            ♥ {likeCount} 명의 유저가 이 쿠키를 좋아해요.
        </p>

        <div className={styles.bubble}>
          {displayMessage}
        </div>
      </div>
    </div>
  );
};