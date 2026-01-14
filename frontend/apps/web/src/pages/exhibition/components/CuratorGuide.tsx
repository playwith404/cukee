import React, { useEffect, useRef, useState } from 'react';
import styles from './CuratorGuide.module.css';
import { HiHeart, HiOutlineHeart } from "react-icons/hi";
import { useTypingAnimation } from '../../../hooks/useTypingAnimation';

interface CuratorGuideProps {
  characterImageUrl?: string;
  curatorName?: string;
  curatorMessage?: string;
  likeCount?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
  message?: React.ReactNode;
  /** 타이핑 애니메이션 활성화 여부 (기본값: true) */
  enableTyping?: boolean;
  /** 타이핑 속도 ms (기본값: 50ms) */
  typingSpeed?: number;
  /** Animalese 사운드 활성화 여부 (기본값: true) */
  enableSound?: boolean;
  /** 타이핑 완료 콜백 */
  onTypingComplete?: () => void;
  isDecorateMode?: boolean;
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
  likeCount = 0,
  isLiked = false,
  onToggleLike,
  enableTyping = true,
  typingSpeed = 50,
  enableSound = true,
  onTypingComplete,
  isDecorateMode = false,
}) => {
  const prevMessageRef = useRef<string | undefined>(undefined);
  const [hasInteracted, setHasInteracted] = useState(false);

  const {
    displayText,
    isTyping,
    startTyping,
    skipTyping,
    reset,
  } = useTypingAnimation({
    typingSpeed,
    soundEnabled: enableSound && hasInteracted,
    onComplete: onTypingComplete,
  });

  // 사용자 상호작용 감지 (AudioContext 활성화를 위해 필요)
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      // 이벤트 리스너 제거
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // 메시지 변경 감지 및 타이핑 시작
  useEffect(() => {
    if (!enableTyping || !curatorMessage) {
      reset();
      return;
    }

    // 메시지가 변경되었을 때만 타이핑 시작
    if (curatorMessage !== prevMessageRef.current) {
      prevMessageRef.current = curatorMessage;
      startTyping(curatorMessage);
    }
  }, [curatorMessage, enableTyping, startTyping, reset]);

  // 클릭 시 타이핑 건너뛰기
  const handleBubbleClick = () => {
    if (isTyping) {
      skipTyping();
    }
  };

  // 표시할 메시지 결정
  const getDisplayMessage = () => {
    if (!enableTyping) {
      return curatorMessage || <>message 데이터가 없을 때 보여줄<br />기본값 멘트입니다. 데헷~</>;
    }

    if (!curatorMessage) {
      return <>message 데이터가 없을 때 보여줄<br />기본값 멘트입니다. 데헷~</>;
    }

    // 타이핑 중이거나 완료된 경우 displayText 사용
    const textToShow = displayText || '';

    // 줄바꿈 처리
    return textToShow.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // 커서 표시 (타이핑 중일 때)
  const renderCursor = () => {
    if (!enableTyping || !isTyping) return null;
    return <span className={styles.cursor}>|</span>;
  };

  // 2. 글자 수 계산 로직 (전체 메시지 길이 기준)
  const textLength = curatorMessage ? curatorMessage.length : 0;

  // 3. 사이즈 결정
  const fontSize = getBubbleFontSize(textLength);

  return (
    <div className={`${styles.container} ${isDecorateMode ? styles.moveUp : ''}`}>
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
        <div className={styles.likeInfo} onClick={onToggleLike} style={{ cursor: 'pointer' }}>
          {isLiked ? (
            <HiHeart className={styles.heartIcon} color="#FF6B6B" size={20} />
          ) : (
            <HiOutlineHeart className={styles.heartIcon} color="#666" size={20} />
          )}
          <span className={styles.likeCount}>{likeCount} 명의 유저가 이 쿠키를 좋아해요.</span>
        </div>

        <div
          className={styles.bubble}
          style={{ fontSize: fontSize, cursor: isTyping ? 'pointer' : 'default' }}
          onClick={handleBubbleClick}
          title={isTyping ? "클릭하여 건너뛰기" : undefined}
        >
          {getDisplayMessage()}
          {renderCursor()}
        </div>
      </div>
    </div>
  );
};
