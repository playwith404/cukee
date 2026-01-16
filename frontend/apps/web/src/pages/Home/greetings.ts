// 시간대별 인사말 데이터

type TimeSlot = 'morning' | 'lunch' | 'evening' | 'night' | 'dawn';

export interface Greeting {
  line1: string; // 첫 번째 줄: "{닉네임}님," 또는 인사말
  line2: string; // 두 번째 줄: 메시지
}

// 인사말 데이터: [첫째줄 (닉네임 포함), 둘째줄 (메시지)]
const GREETINGS: Record<TimeSlot, [string, string][]> = {
  // 아침 (06:00 ~ 11:00)
  morning: [
    ['좋은 아침이에요, {nickname}님!', '오늘 하루를 함께 시작할 영화 한 편 어때요?'],
    ['{nickname}님,', '모닝커피와 함께 가벼운 영화 어떠세요?'],
    ['상쾌한 아침이에요, {nickname}님!', '기분 좋은 영화로 시작해볼까요?'],
    ['{nickname}님,', '아침부터 영화라니 여유로운 하루군요!'],
    ['{nickname}님의', '오늘 하루 에너지가 될 영화를 찾아드릴게요'],
    ['햇살 좋은 아침이에요, {nickname}님!', '어떤 영화가 끌리세요?'],
    ['{nickname}님,', '눈 뜨자마자 영화? 최고의 선택이에요'],
    ['{nickname}님을 위한', '아침 영화 추천, 시작합니다'],
    ['{nickname}님,', '브런치 무비 타임 어때요?'],
    ['{nickname}님,', '아침 공기처럼 상쾌한 영화 찾아드릴게요'],
  ],

  // 점심 (11:00 ~ 14:00)
  lunch: [
    ['{nickname}님, 점심시간이에요!', '영화 한 편 추천해드릴까요?'],
    ['{nickname}님,', '밥보다 영화? 좋은 선택이에요'],
    ['{nickname}님,', '점심 먹으면서 볼 영화 골라드릴게요'],
    ['{nickname}님의 오후를', '기분 좋게 만들 영화 어때요?'],
    ['{nickname}님,', '식후 영화 한 편의 여유 누려보세요'],
    ['나른한 점심이에요, {nickname}님!', '영화로 채워볼까요?'],
    ['{nickname}님,', '런치 타임 무비 뭐가 땡기세요?'],
    ['{nickname}님, 점심시간 짧아요?', '딱 맞는 영화 찾아드릴게요'],
    ['{nickname}님,', '오늘 점심은 영화와 함께하시는군요!'],
    ['{nickname}님,', '한낮의 영화 타임 시작해볼까요?'],
  ],

  // 저녁 (14:00 ~ 21:00)
  evening: [
    ['{nickname}님, 오늘 하루 수고했어요.', '영화 한 편 어때요?'],
    ['{nickname}님,', '퇴근 후의 완벽한 보상 영화 추천해드릴게요'],
    ['{nickname}님,', '저녁 노을과 함께 볼 영화 찾아볼까요?'],
    ['{nickname}님,', '하루의 피로를 풀어줄 영화가 필요하신가요?'],
    ['{nickname}님,', '저녁 시간 어떤 영화와 함께하실래요?'],
    ['{nickname}님,', '집에서 편하게 오늘 저녁은 영화예요'],
    ['{nickname}님,', '저녁밥보다 맛있는 영화 추천해드릴게요'],
    ['{nickname}님,', '하루 끝 영화 한 편으로 마무리해볼까요?'],
    ['굿이브닝, {nickname}님!', '오늘 밤의 영화를 골라드릴게요'],
    ['{nickname}님, 저녁 데이트?', '혼자만의 시간? 영화로 채워요'],
  ],

  // 심야 (21:00 ~ 01:00)
  night: [
    ['{nickname}님, 밤이 깊어가요.', '어떤 영화가 끌리세요?'],
    ['{nickname}님,', '심야 영화의 낭만 즐겨볼까요?'],
    ['{nickname}님,', '잠들기 전 영화 한 편 어때요?'],
    ['{nickname}님,', '고요한 밤 몰입하기 좋은 영화 찾아드릴게요'],
    ['{nickname}님,', '밤은 영화를 위해 존재하는 거예요'],
    ['{nickname}님,', '심야 상영관에 오신 걸 환영해요'],
    ['{nickname}님,', '이 밤의 끝을 잡고 영화 한 편 어때요?'],
    ['{nickname}님,', '늦은 밤 감성에 맞는 영화 골라드릴게요'],
    ['{nickname}님,', '오늘 밤 잠은 좀 미뤄도 될 것 같아요'],
    ['{nickname}님,', '밤새 볼 영화 추천해드릴까요?'],
  ],

  // 새벽 (01:00 ~ 06:00)
  dawn: [
    ['{nickname}님,', '이 시간에 영화라니 진정한 영화광이시네요'],
    ['{nickname}님,', '새벽 감성 충전 영화로 해볼까요?'],
    ['{nickname}님,', '잠이 안 오는 밤 영화가 답이에요'],
    ['{nickname}님,', '새벽의 고요함 속에서 볼 영화 추천해드릴게요'],
    ['{nickname}님,', '이 새벽을 함께할 영화 찾아볼까요?'],
    ['모두 잠든 시간이에요, {nickname}님!', '당신만의 영화 타임이에요'],
    ['{nickname}님,', '새벽 감성에 스며들 영화 골라드릴게요'],
    ['{nickname}님,', '해 뜨기 전에 영화 한 편 어때요?'],
    ['{nickname}님,', '새벽 영화의 낭만을 아시는군요'],
    ['{nickname}님,', '오늘 밤은 영화와 함께 새벽을 맞이해요'],
  ],
};

// 비로그인 사용자용 기본 인사말
const DEFAULT_GREETINGS: Record<TimeSlot, [string, string][]> = {
  morning: [['좋은 아침이에요!', '오늘 하루를 함께 시작할 영화 한 편 어때요?']],
  lunch: [['점심시간이에요!', '영화 한 편 추천해드릴까요?']],
  evening: [['오늘 하루 수고했어요.', '영화 한 편 어때요?']],
  night: [['밤이 깊어가요.', '어떤 영화가 끌리세요?']],
  dawn: [['이 시간에 영화라니', '진정한 영화광이시네요']],
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
    const [line1, line2] = getRandomItem(DEFAULT_GREETINGS[timeSlot]);
    return { line1, line2 };
  }

  const [line1Template, line2Template] = getRandomItem(GREETINGS[timeSlot]);
  return {
    line1: line1Template.replace(/{nickname}/g, nickname),
    line2: line2Template.replace(/{nickname}/g, nickname),
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
