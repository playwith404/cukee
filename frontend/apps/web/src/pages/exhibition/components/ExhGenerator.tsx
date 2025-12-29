import { useState } from 'react';
import { ActionBottomBar } from './ActionBottomBar';
// ✅ 변경됨: 한 곳에서 함수와 타입을 모두 import
import { generateExhibition, type AIExhibitionResponse } from '../../../apis/ai';

interface ExhibitionGeneratorProps {
  currentTicketId: number;
  onSuccess: (data: AIExhibitionResponse) => void;
  
  // ▼▼▼ [추가] 부모(Exhibition.tsx)와 소통하기 위한 함수들 ▼▼▼
  onLoadingStart: () => void;         // "나 로딩 시작해요" 알림
  onError: (message: string) => void; // "에러 났어요" 알림
  isLoading: boolean;                 // 부모가 알려주는 현재 상태 (로딩중인지)
}

export const ExhibitionGenerator = ({ 
  currentTicketId, 
  onSuccess,
  onLoadingStart, // [추가]
  onError,        // [추가]
  isLoading       // [추가]
}: ExhibitionGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  
  // ❌ [삭제] 로딩 상태는 이제 부모가 관리하므로 로컬 state는 필요 없음
  // const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      // 빈 값일 때는 그냥 에러 메시지 띄우거나 무시
      onError("내용을 입력해주세요!"); 
      return;
    }

    // 1. 부모에게 "로딩 시작!" 알림 (이때 큐레이터가 말풍선 띄움 & 30초 타이머 시작)
    onLoadingStart(); 

    try {
      // 2. API 호출
      const data = await generateExhibition(prompt, currentTicketId);

      // 3. 성공 시 부모에게 데이터 전달
      onSuccess(data);
      setPrompt(''); // 입력창 비우기

    } catch (error: any) {
      console.error("API Error Detail:", error); // 개발자 확인용 로그

      let userMessage = "전시회를 생성하는 중에 문제가 생겼어요.";

      // 1. 서버가 명확한 에러 메시지를 보낸 경우 (예: "프롬프트가 너무 짧아요")
      if (error.response?.data?.message) {
        userMessage = error.response.data.message;
      } 
      // 2. 500 에러 (서버 내부 오류)인 경우 -> 친절하게 포장
      else if (error.response?.status === 500) {
        userMessage = "AI 서버가 잠시 응답하지 않네요 ㅠㅠ 잠시 후 다시 시도해주세요.";
      }
      // 3. 네트워크 연결 자체가 안 된 경우
      else if (error.code === 'ERR_NETWORK') {
        userMessage = "인터넷 연결을 확인해주세요.";
      }

      // 부모(큐레이터)에게 정제된 메시지 전달
      onError(userMessage);
    }
    // finally { setIsLoading(false) } -> 이것도 필요 없음 (부모가 상태 관리함)
  };

  return (
    <ActionBottomBar
      promptValue={prompt}
      setPromptValue={setPrompt}
      onSubmit={handleSubmit}
      isLoading={isLoading} // ✅ 부모에게서 받은 loading 상태를 그대로 전달
    />
  );
};