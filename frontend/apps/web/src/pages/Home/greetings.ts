// 시간대별 인사말 데이터

type TimeSlot = 'morning' | 'lunch' | 'evening' | 'night' | 'dawn';

export interface Greeting {
  line1: string; // 첫 번째 줄: "{닉네임}님,"
  line2: string; // 두 번째 줄: 질문/인사
  line3: string; // 세 번째 줄: 마무리
}

// 인사말 데이터: [첫째줄, 둘째줄, 셋째줄]
const GREETINGS: Record<TimeSlot, [string, string, string][]> = {
  // 아침 (06:00 ~ 11:00)
  morning: [
    ['{nickname}님,', '좋은 아침이에요!', '영화 한 편 어때요?'],
    ['{nickname}님,', '상쾌한 아침!', '어떤 영화가 끌리세요?'],
    ['{nickname}님,', '모닝 무비 타임!', '추천해드릴게요'],
    ['{nickname}님,', '아침부터 영화라니', '멋진 하루예요!'],
    ['{nickname}님,', '기분 좋은 아침!', '영화 찾아드릴게요'],
    ['{nickname}님,', '눈 뜨자마자 영화?', '최고예요!'],
    ['{nickname}님,', '햇살 좋은 아침!', '영화 한 편 어때요?'],
    ['{nickname}님,', '브런치 무비 타임!', '뭐가 땡기세요?'],
    ['{nickname}님,', '상쾌한 아침이에요!', '영화 골라드릴게요'],
    ['{nickname}님,', '좋은 하루의 시작!', '영화와 함께해요'],
  ],

  // 점심 (11:00 ~ 14:00)
  lunch: [
    ['{nickname}님,', '점심시간이에요!', '영화 추천할까요?'],
    ['{nickname}님,', '밥보다 영화?', '좋은 선택이에요!'],
    ['{nickname}님,', '나른한 점심!', '영화로 채워볼까요?'],
    ['{nickname}님,', '좋은 오후 되세요!', '영화 한 편 어때요?'],
    ['{nickname}님,', '식후 영화 타임!', '뭐가 땡기세요?'],
    ['{nickname}님,', '런치 무비 타임!', '골라드릴게요'],
    ['{nickname}님,', '점심엔 영화!', '추천해드릴게요'],
    ['{nickname}님,', '한낮의 여유!', '영화 한 편 어때요?'],
    ['{nickname}님,', '특별한 점심!', '영화와 함께해요'],
    ['{nickname}님,', '점심 영화 타임!', '골라드릴게요'],
  ],

  // 저녁 (14:00 ~ 21:00)
  evening: [
    ['{nickname}님,', '하루 수고했어요.', '영화 한 편 어때요?'],
    ['{nickname}님,', '퇴근 후 여유!', '영화 추천할게요'],
    ['{nickname}님,', '저녁 노을과 함께', '영화 한 편 어때요?'],
    ['{nickname}님,', '피로를 풀어줄', '영화 찾아드릴게요'],
    ['{nickname}님,', '오늘 저녁은 영화!', '뭐가 끌리세요?'],
    ['{nickname}님,', '하루의 마무리는', '영화와 함께해요'],
    ['{nickname}님,', '굿이브닝!', '영화 골라드릴게요'],
    ['{nickname}님,', '저녁 무비 타임!', '추천해드릴게요'],
    ['{nickname}님,', '집에서 편하게', '영화 한 편 어때요?'],
    ['{nickname}님,', '저녁밥보다 맛있는', '영화 찾아드릴게요'],
  ],

  // 심야 (21:00 ~ 01:00)
  night: [
    ['{nickname}님,', '밤이 깊어가요.', '어떤 영화 볼까요?'],
    ['{nickname}님,', '심야 영화의 낭만!', '즐겨볼까요?'],
    ['{nickname}님,', '잠들기 전에', '영화 한 편 어때요?'],
    ['{nickname}님,', '고요한 밤이에요.', '영화 찾아드릴게요'],
    ['{nickname}님,', '밤은 영화를 위해', '존재하는 거예요'],
    ['{nickname}님,', '심야 상영관에', '오신 걸 환영해요!'],
    ['{nickname}님,', '이 밤의 끝을 잡고', '영화 한 편 어때요?'],
    ['{nickname}님,', '밤 감성에 맞는', '영화 골라드릴게요'],
    ['{nickname}님,', '오늘 밤 잠은', '좀 미뤄볼까요?'],
    ['{nickname}님,', '밤새 볼 영화', '추천해드릴까요?'],
  ],

  // 새벽 (01:00 ~ 06:00)
  dawn: [
    ['{nickname}님,', '이 시간에 영화라니', '진정한 영화광!'],
    ['{nickname}님,', '새벽 감성 충전!', '영화로 해볼까요?'],
    ['{nickname}님,', '잠이 안 오는 밤,', '영화가 답이에요'],
    ['{nickname}님,', '새벽의 고요함 속', '영화 한 편 어때요?'],
    ['{nickname}님,', '이 새벽을 함께할', '영화 찾아볼까요?'],
    ['{nickname}님,', '모두 잠든 시간!', '영화 타임이에요'],
    ['{nickname}님,', '새벽 감성에 맞는', '영화 골라드릴게요'],
    ['{nickname}님,', '해 뜨기 전에', '영화 한 편 어때요?'],
    ['{nickname}님,', '새벽 영화의 낭만', '아시는군요!'],
    ['{nickname}님,', '영화와 함께', '새벽을 맞이해요'],
  ],
};

// 비로그인 사용자용 기본 인사말
const DEFAULT_GREETINGS: Record<TimeSlot, [string, string, string][]> = {
  morning: [['안녕하세요,', '좋은 아침이에요!', '영화 한 편 어떠세요?']],
  lunch: [['안녕하세요,', '점심시간이에요!', '영화 추천해드릴까요?']],
  evening: [['안녕하세요,', '오늘 하루 수고했어요.', '영화 한 편 어때요?']],
  night: [['안녕하세요,', '밤이 깊어가요.', '어떤 영화가 끌리세요?']],
  dawn: [['안녕하세요,', '이 시간에 영화라니', '진정한 영화광이시네요!']],
};

/**
 * 현재 시간대를 반환합니다.
 */
function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 1) return 'night';
  return 'dawn'; // 01:00 ~ 06:00
}

/**
 * 배열에서 랜덤 요소를 선택합니다.
 */
function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 시간대와 닉네임에 맞는 인사말을 반환합니다.
 * @param nickname 사용자 닉네임 (없으면 기본 인사말 반환)
 * @returns 두 줄로 분리된 인사말 객체
 */
export function getGreeting(nickname?: string): Greeting {
  const timeSlot = getCurrentTimeSlot();

  if (!nickname) {
    const [line1, line2, line3] = getRandomItem(DEFAULT_GREETINGS[timeSlot]);
    return { line1, line2, line3 };
  }

  const [line1Template, line2Template, line3Template] = getRandomItem(GREETINGS[timeSlot]);
  return {
    line1: line1Template.replace(/{nickname}/g, nickname),
    line2: line2Template.replace(/{nickname}/g, nickname),
    line3: line3Template.replace(/{nickname}/g, nickname),
  };
}

/**
 * 시간대 정보를 반환합니다 (디버깅/테스트용)
 */
export function getTimeSlotInfo(): { slot: TimeSlot; hour: number } {
  return {
    slot: getCurrentTimeSlot(),
    hour: new Date().getHours(),
  };
}
