// ==========================================
// 1. 타입 정의 (Types)
// ==========================================

// 요청 (Request)
export interface AIExhibitionRequest {
  prompt: string;
  ticketId: number;
}

// 내부 상세 데이터
export interface ExhibitionDesign {
  font: string;
  colorScheme: string;
  layoutType: string;
  frameStyle: string;
  background: string;
  backgroundImage: string;
}

export interface RecommendedMovie {
  movieId: number;
  curatorComment: string;
  posterUrl?: string;
}

// 응답 (Response)
export interface AIExhibitionResponse {
  resultJson: {
    title: string;
    design: ExhibitionDesign;
    movies: RecommendedMovie[];
    keywords: string[];
  };
}

// ==========================================
// 2. API 호출 함수 (Service Logic)
// ==========================================

// ✅ Vite 환경 변수 사용 (process.env -> import.meta.env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const generateExhibition = async (
  prompt: string,
  ticketId: number
): Promise<AIExhibitionResponse> => {
  
  const url = `${API_BASE_URL}/ai/generate`;

  const requestBody: AIExhibitionRequest = {
    prompt,
    ticketId,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 쿠키(세션) 포함 설정
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 400) throw new Error("프롬프트를 입력해주세요.");
      if (response.status === 401) throw new Error("로그인이 만료되었습니다.");
      if (response.status === 500) throw new Error("큐레이터 생성에 실패했습니다.");
      throw new Error(`알 수 없는 에러 발생: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};