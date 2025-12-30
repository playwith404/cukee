import React from 'react';
import styles from './CuratorGuide.module.css';

interface CuratorGuideProps {
    characterImageUrl?: string;
    curatorName?: string;
    curatorMessage?: string;
    likeCount?: number;
    message?: React.ReactNode;
}

// 1. 폰트 사이즈 계산 함수 추가 
const getBubbleFontSize = (length: number) => {
  if (length > 80) return '15px';
  if (length > 50) return '20px';
  return '23px'; // 기본 사이즈
};

export const CuratorGuide: React.FC<CuratorGuideProps> = ({
    characterImageUrl = '/cara/cara1.png', // public 폴더 기준 경로
    curatorName = 'MZ 큐레이터',
    curatorMessage,
    likeCount = 103,
}) => {
  const displayMessage = curatorMessage || <>message 데이터가 없을 때 보여줄<br />기본값 멘트입니다. 데헷~</>;
  
  // 2. 글자 수 계산 로직
  // curatorMessage가 문자열이면 길이를 재고, 없으면(기본 멘트면) 0으로 처리해서 기본 사이즈 적용
  const textLength = curatorMessage ? curatorMessage.length : 0;
  
  // 3. 사이즈 결정
  const fontSize = getBubbleFontSize(textLength);

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

        <div className={styles.bubble} style={{ fontSize: fontSize }}>
          {displayMessage}
        </div>
      </div>
    </div>
  );
};