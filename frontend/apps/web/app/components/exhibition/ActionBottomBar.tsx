// apps/web/app/components/exhibition/ActionBottomBar.tsx
// 꾸미기 모드 구현 장소
'use client';

interface ActionBottomBarProps {
  promptValue: string;
  setPromptValue: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean; // [추가] 로딩 상태
}

export const ActionBottomBar = ({ promptValue, setPromptValue, onSubmit, isLoading }: ActionBottomBarProps) => {
  
  const handleChipClick = (text: string) => {
    setPromptValue(text);
    // 전송 구현 시 아래 주석 해제
    // onSubmit(); 
  };

  return (
    <div className="exh-bottom-bar"
    >
      <div className="prompt-input-wrapper">
        <input 
          type="text" 
          className="prompt-input" 
          placeholder={isLoading ? "큐키가 전시회를 생성중이에요..." : "cukee 프롬프트 입력하기"}
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSubmit()}
          disabled={isLoading} // 전송 중엔 입력 불가
        />
        <button 
            className="prompt-submit-btn" 
            onClick={onSubmit}
            disabled={isLoading || !promptValue.trim()} // 빈 값이거나 로딩중이면 비활성
            style={{ 
              opacity: (isLoading || !promptValue.trim()) ? 0.5 : 1,
               
            }}
        >
          {isLoading ? '...' : '→'}
        </button>
      </div>

      <div className="bottom-actions">
        <button 
            className="action-chip" 
            onClick={() => handleChipClick("조금 더 감동적인 영화를 원해!")}
        >
            조금 더 감동적인 영화를 원해!
        </button>
        <button 
            className="action-chip" 
            onClick={() => handleChipClick("영화 개수를 좀 더 늘려줘!")}
        >
            영화 개수를 좀 더 늘려줘!
        </button>
      </div>
    </div>
  );
};