// apps/web/app/components/exhibition/TopControls.tsx
// 꾸미기 & 저장하기 버튼
// 나중에 꾸미기나 저장로직 props로 받게 하기 위해 분리

'use client';

interface TopControlsProps {
  onSave?: () => void;
  onDecorate?: () => void;
}

export const TopControls = ({ onSave, onDecorate }: TopControlsProps) => {
  return (
    <div className="exh-top-controls">
      <button className="control-btn" onClick={onSave}>전시회 저장하기</button>
      <button className="control-btn" onClick={onDecorate}>전시회 꾸미기</button>
    </div>
  );
};