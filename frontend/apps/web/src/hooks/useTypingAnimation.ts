import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../apis';

interface UseTypingAnimationOptions {
  /** 타이핑 속도 (ms) - 기본값 50ms */
  typingSpeed?: number;
  /** 고음 버전 사용 여부 */
  highPitch?: boolean;
  /** 사운드 활성화 여부 */
  soundEnabled?: boolean;
  /** 타이핑 완료 콜백 */
  onComplete?: () => void;
  /** 타이핑 중 실행 콜백 */
  onTyping?: (currentText: string, currentIndex: number) => void;
}

interface UseTypingAnimationReturn {
  /** 현재까지 타이핑된 텍스트 */
  displayText: string;
  /** 타이핑 진행 중 여부 */
  isTyping: boolean;
  /** 타이핑 완료 여부 */
  isComplete: boolean;
  /** 타이핑 시작 함수 */
  startTyping: (text: string) => void;
  /** 타이핑 중지 함수 */
  stopTyping: () => void;
  /** 타이핑 건너뛰기 (전체 텍스트 즉시 표시) */
  skipTyping: () => void;
  /** 리셋 함수 */
  reset: () => void;
}

/**
 * 타이핑 애니메이션 + Animalese 사운드 재생 훅
 */
export function useTypingAnimation(
  options: UseTypingAnimationOptions = {}
): UseTypingAnimationReturn {
  const {
    typingSpeed = 50,
    highPitch = false,
    soundEnabled = true,
    onComplete,
    onTyping,
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const fullTextRef = useRef('');
  const currentIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundsRef = useRef<(string | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isFetchingRef = useRef(false);

  // AudioContext 초기화
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Base64 오디오 재생
  const playSound = useCallback(async (base64Audio: string) => {
    if (!soundEnabled || !base64Audio) return;

    try {
      const audioContext = getAudioContext();

      // Base64 디코딩
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 오디오 버퍼 디코딩 및 재생
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [soundEnabled, getAudioContext]);

  // 사운드 배치 로드
  const fetchSounds = useCallback(async (text: string) => {
    if (!soundEnabled || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const response = await api.post('/animalese/batch', {
        text,
        high_pitch: highPitch,
      });
      soundsRef.current = response.data.sounds || [];
    } catch (error) {
      console.warn('Failed to fetch animalese sounds:', error);
      soundsRef.current = [];
    } finally {
      isFetchingRef.current = false;
    }
  }, [soundEnabled, highPitch]);

  // 타이핑 한 글자씩 진행
  const typeNextChar = useCallback(() => {
    if (currentIndexRef.current >= fullTextRef.current.length) {
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const nextIndex = currentIndexRef.current + 1;
    const nextText = fullTextRef.current.slice(0, nextIndex);

    setDisplayText(nextText);

    // 사운드 재생 (공백이 아닌 경우)
    const currentChar = fullTextRef.current[currentIndexRef.current];
    if (currentChar !== ' ' && currentChar !== '\n') {
      const sound = soundsRef.current[currentIndexRef.current];
      if (sound) {
        playSound(sound);
      }
    }

    onTyping?.(nextText, nextIndex);
    currentIndexRef.current = nextIndex;

    // 다음 글자 타이머 설정
    timerRef.current = setTimeout(typeNextChar, typingSpeed);
  }, [typingSpeed, onComplete, onTyping, playSound]);

  // 타이핑 시작
  const startTyping = useCallback(async (text: string) => {
    // 이전 타이핑 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    fullTextRef.current = text;
    currentIndexRef.current = 0;
    soundsRef.current = [];

    setDisplayText('');
    setIsTyping(true);
    setIsComplete(false);

    // 사운드 배치 로드 (비동기)
    if (soundEnabled) {
      fetchSounds(text);
    }

    // 타이핑 시작
    timerRef.current = setTimeout(typeNextChar, typingSpeed);
  }, [typingSpeed, soundEnabled, fetchSounds, typeNextChar]);

  // 타이핑 중지
  const stopTyping = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // 타이핑 건너뛰기
  const skipTyping = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDisplayText(fullTextRef.current);
    currentIndexRef.current = fullTextRef.current.length;
    setIsTyping(false);
    setIsComplete(true);
    onComplete?.();
  }, [onComplete]);

  // 리셋
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    fullTextRef.current = '';
    currentIndexRef.current = 0;
    soundsRef.current = [];
    setDisplayText('');
    setIsTyping(false);
    setIsComplete(false);
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    displayText,
    isTyping,
    isComplete,
    startTyping,
    stopTyping,
    skipTyping,
    reset,
  };
}

export default useTypingAnimation;
