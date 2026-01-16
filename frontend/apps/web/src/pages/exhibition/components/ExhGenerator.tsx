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
  pinnedMovieIds?: number[];          // [추가] 고정된 영화 ID 목록
  isReadOnly: boolean; // 👈 [추가] 읽기 전용 모드
}

export const ExhibitionGenerator = ({
  currentTicketId,
  onSuccess,
  onLoadingStart, // [추가]
  onError,        // [추가]
  isLoading,       // [추가]
  pinnedMovieIds = [], // [추가] 기본값 빈 배열
  isReadOnly // 👈 [추가] 받아오기
}: ExhibitionGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [bottomMode, setBottomMode] = useState<'action' | 'decorate'>('action');


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
      // 2. API 호출 (pinnedMovieIds 추가)
      const isAdultAllowed = localStorage.getItem('isAdultAllowed') === 'true';
      const data = await generateExhibition(prompt, currentTicketId, pinnedMovieIds, isAdultAllowed);

      // 3. 성공 시 부모에게 데이터 전달
      onSuccess(data);
      setPrompt(''); // 입력창 비우기

    } catch (error: any) {
      console.error("API Error Detail:", error);

      let userMessage = "전시회를 생성하는 중에 문제가 생겼어요.";

      // 에러 상태 코드 추출 (편의상 변수에 담음)
      const status = error.response?.status;

      // 1. [신규] 504 에러 (시간 초과) 처리
      if (status === 504) {
        userMessage = "AI가 너무 깊게 고민하다가 응답 시간을 초과했어요. 다시 시도해주세요!";
      }
      // 2. 500 에러 (서버 내부 오류)
      else if (status === 500) {
        userMessage = "AI 서버가 잠시 응답하지 않네요 ㅠㅠ 잠시 후 다시 시도해주세요.";
      }
      // 3. 서버가 보낸 커스텀 메시지가 있는 경우
      else if (error.response?.data?.message) {
        userMessage = error.response.data.message;
      }
      // 4. 인터넷 연결 끊김
      else if (error.code === 'ERR_NETWORK') {
        userMessage = "인터넷 연결을 확인해주세요.";
      }

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
      isReadOnly={isReadOnly} // 👈 [추가] 자식에게 전달
      mode={bottomMode}
      onCloseDecorate={() => setBottomMode('action')}
      onOpenDecorate={() => setBottomMode('decorate')}
    />
  );
};