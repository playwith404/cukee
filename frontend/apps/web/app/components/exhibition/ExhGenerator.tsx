// apps/web/app/components/exhibition/ExhGenerator.tsx
'use client';

import React, { useState } from 'react';
import { ActionBottomBar } from './ActionBottomBar';
import { generateExhibition } from '../../services/aiService';
import { AIExhibitionResponse } from '../../../src/apis/ai';


interface ExhibitionGeneratorProps {
  currentTicketId: number;
  onSuccess: (data: AIExhibitionResponse) => void; // 부모에게 결과를 전달할 콜백
}
// 전시생성) 통신 & 에러처리 & 로딩관리
export const ExhibitionGenerator = ({ currentTicketId, onSuccess }: ExhibitionGeneratorProps) => {
  
  // 사용자의 입력을 저장할 상태
  const [prompt, setPrompt] = useState('');
  // 로딩 상태 (버튼 비활성화용)
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => { 
    //전송 버튼 클릭 시 실행될 함수
    if (!prompt.trim()) {
        alert("내용을 입력해주세요!");
        return;
    }
    //로딩시작
    setIsLoading(true);
    try {
      // 1. API 호출 (여기서 알아서 처리)
      const data = await generateExhibition(prompt, currentTicketId);
      
      // 2. 성공 시 부모: ExhPageContainer 에게 데이터 전달
      onSuccess(data);
      
      setPrompt(''); // 입력창 비우기
    } catch (error: any) {
      alert(error.message || "생성 중 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  // UI 컴포넌트(ActionBottomBar)에는 필요한 값만 넘겨줍니다.
  return (
    <ActionBottomBar 
      promptValue={prompt}
      setPromptValue={setPrompt}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
};