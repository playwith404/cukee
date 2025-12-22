// apps/web/app/services/aiService.ts
// import { AIExhibitionRequest, AIExhibitionResponse } from "../types/ai";
import { AIExhibitionRequest, AIExhibitionResponse } from "../../src/apis/ai";

// 백엔드 기본 주소 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const generateExhibition = async (
  prompt: string,
  ticketId: number
): Promise<AIExhibitionResponse> => {

  const url = `${API_BASE_URL}/ai/generate`;
  
  // 요청 바디 생성
  const requestBody: AIExhibitionRequest = {
    prompt,
    ticketId
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      //브라우저가 'session' 쿠키를 백엔드로 같이 보냅니다.
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    // 에러 핸들링 (명세서 기준)
    if (!response.ok) {
      if (response.status === 400) throw new Error("프롬프트를 입력해주세요.");
      if (response.status === 401) throw new Error("로그인이 만료되었습니다.");
      if (response.status === 500) throw new Error("큐레이터 생성에 실패했습니다.");
      throw new Error(`알 수 없는 에러 발생: ${response.status}`);
    }

    // 성공 시 데이터 반환
    return await response.json();

  } catch (error) {
    console.error("API Error:", error);
    throw error; // 에러를 페이지로 던져서 거기서 alert 등을 띄우게 함
  }
};