import React, { useMemo } from 'react';
import styles from './Loading.module.css';

/**
 * 기본 사용
 * <Loading />
 * 
 * 커스텀 텍스트와 캐릭터 수
 * <Loading text="데이터 불러오는 중" characterCount={3} />
 * Props
 * text - 표시할 로딩 텍스트
 * character Count - 표시할 캐릭터 수 (1 ~ 11)
 */

// cara_head 폴더 내 이미지 목록
const CARA_IMAGES = [
  '/cara_head/bean-head.svg',
  '/cara_head/cloud-head.svg',
  '/cara_head/dog-head.svg',
  '/cara_head/ghost-head.svg',
  '/cara_head/glasses-head.svg',
  '/cara_head/heart-head-v2.svg',
  '/cara_head/jelly-head.svg',
  '/cara_head/lemon-head.svg',
  '/cara_head/olive-head.svg',
  '/cara_head/rice-head.svg',
  '/cara_head/star-head.svg',
];

// 배열에서 무작위로 n개를 선택하는 함수
const getRandomItems = <T,>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

interface LoadingProps {
  text?: string;
  characterCount?: number;
}

export const Loading: React.FC<LoadingProps> = ({
  text = '로딩 중',
  characterCount = 3  // 익스텐션은 공간이 좁으므로 기본값 3
}) => {
  // 컴포넌트 마운트 시 무작위 이미지 선택
  const randomImages = useMemo(
    () => getRandomItems(CARA_IMAGES, characterCount),
    [characterCount]
  );

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.characters}>
        {randomImages.map((image, index) => (
          <div
            key={index}
            className={styles.character}
            style={{
              animationDelay: `${index * 0.2}s`,
            }}
          >
            <img src={image} alt={`character-${index}`} className={styles.characterImage} />
          </div>
        ))}
      </div>
      <div className={styles.loadingText}>{text}</div>
    </div>
  );
};

export default Loading;
