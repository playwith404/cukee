import React, { useState } from 'react';
import { ActionBottomBar } from './ActionBottomBar';
// ✅ 변경됨: 한 곳에서 함수와 타입을 모두 import
// AIExhibitionResponse 앞에 'type'을 붙여주세요!
import { generateExhibition, type AIExhibitionResponse } from '../../../apis/ai';

interface ExhibitionGeneratorProps {
  currentTicketId: number;
  onSuccess: (data: AIExhibitionResponse) => void;
}

export const ExhibitionGenerator = ({ currentTicketId, onSuccess }: ExhibitionGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => { 
    if (!prompt.trim()) {
        alert("내용을 입력해주세요!");
        return;
    }
    
    setIsLoading(true);
    try {
      // apis/ai.ts 에 있는 함수 호출
      const data = await generateExhibition(prompt, currentTicketId);
      
      onSuccess(data);
      setPrompt(''); 

    } catch (error: any) {
      alert(error.message || "생성 중 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionBottomBar 
      promptValue={prompt}
      setPromptValue={setPrompt}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
};