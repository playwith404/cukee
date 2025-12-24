import React from 'react';
import styles from './ActionBottomBar.module.css';

interface ActionBottomBarProps {
  promptValue: string;
  setPromptValue: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const ActionBottomBar = ({ promptValue, setPromptValue, onSubmit, isLoading }: ActionBottomBarProps) => {
  
  const handleChipClick = (text: string) => {
    setPromptValue(text);
  };

  return (
    <div className={styles.container}>
      <div className={styles.promptWrapper}>
        <input 
          type="text" 
          className={styles.input}
          placeholder={isLoading ? "큐키가 전시회를 생성중이에요..." : "cukee 프롬프트 입력하기"}
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSubmit()}
          disabled={isLoading}
        />
        <button 
            className={styles.submitBtn}
            onClick={onSubmit}
            disabled={isLoading || !promptValue.trim()}
            style={{ 
              opacity: (isLoading || !promptValue.trim()) ? 0.5 : 1,
            }}
        >
          {isLoading ? '...' : '→'}
        </button>
      </div>

      <div className={styles.actions}>
        <button 
            className={styles.chip}
            onClick={() => handleChipClick("조금 더 감동적인 영화를 원해!")}
        >
            조금 더 감동적인 영화를 원해!
        </button>
        <button 
            className={styles.chip} 
            onClick={() => handleChipClick("영화 개수를 좀 더 늘려줘!")}
        >
            영화 개수를 좀 더 늘려줘!
        </button>
      </div>
    </div>
  );
};