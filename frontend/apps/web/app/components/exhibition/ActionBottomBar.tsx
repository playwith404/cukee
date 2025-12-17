// apps/web/app/components/exhibition/ActionBottomBar.tsx
// 꾸미기 모드 구현 장소
'use client';

interface ActionBottomBarProps {
  promptValue: string;
  setPromptValue: (val: string) => void;
  onSubmit: () => void;
}

export const ActionBottomBar = ({ promptValue, setPromptValue, onSubmit }: ActionBottomBarProps) => {
  return (
    <div className="exh-bottom-bar">
      <div className="prompt-input-wrapper">
        <input 
          type="text" 
          className="prompt-input" 
          placeholder="cukee 프롬프트 입력하기"
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        <button className="prompt-submit-btn" onClick={onSubmit}>→</button>
      </div>

      <div className="bottom-actions">
        <button className="action-chip">조금 더 감동적인 영화를 원해!</button>
        <button className="action-chip">영화 개수를 좀 더 늘려줘!</button>
      </div>
    </div>
  );
};