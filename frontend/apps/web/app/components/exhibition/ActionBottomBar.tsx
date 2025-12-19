// apps/web/app/components/exhibition/ActionBottomBar.tsx
import React, { useRef, useState } from 'react';

interface ActionBottomBarProps {
  promptValue: string;
  setPromptValue: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDecorateMode?: boolean;
  onSaveDecorate?: () => void;
  onBgStyleChange?: (style: string) => void;
  onFrameStyleChange?: (style: string) => void;
  onCookieStyleChange?: (style: string) => void;
  onCustomBgImageChange?: (img: string | null) => void;
  currentStyles?: {
    bgStyle: string;
    frameStyle: string;
    cookieStyle: string;
  };
}

export const ActionBottomBar = ({
  promptValue,
  setPromptValue,
  onSubmit,
  isLoading,
  isDecorateMode,
  onSaveDecorate,
  onBgStyleChange,
  onFrameStyleChange,
  onCookieStyleChange,
  onCustomBgImageChange,
  currentStyles
}: ActionBottomBarProps) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleChipClick = (text: string) => {
    setPromptValue(text);
  };

  const triggerAnim = (id: string) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCustomBgImageChange?.(reader.result as string);
        onBgStyleChange?.('5');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`exh-bottom-bar ${isDecorateMode ? 'expanded' : ''}`}>
      {/* 타이틀은 내부로 이동함 */}

      <div className={`prompt-input-wrapper ${isDecorateMode ? 'expanded' : ''}`}>
        {!isDecorateMode ? (
          <>
            <input
              type="text"
              className="prompt-input"
              placeholder={isLoading ? "큐키가 전시회를 생성중이에요..." : "cukee 프롬프트 입력하기"}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSubmit()}
              disabled={isLoading}
            />
            <button
              className="prompt-submit-btn"
              onClick={onSubmit}
              disabled={isLoading || !promptValue.trim()}
              style={{ opacity: (isLoading || !promptValue.trim()) ? 0.5 : 1 }}
            >
              {isLoading ? '...' : '→'}
            </button>
          </>
        ) : (
          <div className="decorate-options-content">
            {/* [변경] 타이틀을 내부로 이동 (이미지 명세 반영) */}
            <div className="deco-mode-header-inner">
              ♡ 전시회 꾸미기 ♡
            </div>
            {/* [이미지 1] 배경 스타일 */}
            <div className="option-row">
              <span className="option-label">♥ 배경 스타일</span>
              <div className="chip-group">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={`bg-${num}`}
                    className={`style-chip bg-chip-${num} ${currentStyles?.bgStyle === String(num) ? 'active' : ''}`}
                    onClick={() => onBgStyleChange?.(String(num))}
                  />
                ))}
                <button
                  className={`style-chip photo-chip ${currentStyles?.bgStyle === '5' ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  사진 삽입
                </button>
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            </div>

            {/* [이미지 0] 액자 스타일 */}
            <div className="option-row">
              <span className="option-label">♥ 액자 스타일</span>
              <div className="chip-group">
                {['none', 'default'].map((type) => (
                  <button
                    key={`frame-${type}`}
                    className={`style-chip text-chip ${currentStyles?.frameStyle === type ? 'active' : ''}`}
                    onClick={() => onFrameStyleChange?.(type)}
                  >
                    {type === 'none' ? 'none' : '액자'}
                  </button>
                ))}
              </div>
            </div>

            {/* [이미지 2] 큐키 스타일 */}
            <div className="option-row">
              <span className="option-label">♥ 큐키 스타일</span>
              <div className="chip-group">
                {['default', 'none', 'unbalance'].map((type) => (
                  <button
                    key={`cookie-${type}`}
                    className={`style-chip text-chip ${currentStyles?.cookieStyle === type ? 'active' : ''}`}
                    onClick={() => onCookieStyleChange?.(type)}
                  >
                    {type === 'default' ? '선' : type === 'none' ? '선 X' : '언밸런스'}
                  </button>
                ))}
              </div>
            </div>

            {/* [수정] 네모 박스 형태의 저장 체크 버튼 (새로운 이미지 적용) */}
            <button className="deco-save-btn-box" onClick={onSaveDecorate}>
              <img src="/save_check_new.png" alt="저장" />
            </button>
          </div>
        )}
      </div>

      {!isDecorateMode && (
        <div className="bottom-actions">
          <button className="action-chip" onClick={() => handleChipClick("조금 더 감동적인 영화를 원해!")}>
            조금 더 감동적인 영화를 원해!
          </button>
          <button className="action-chip" onClick={() => handleChipClick("영화 개수를 좀 더 늘려줘!")}>
            영화 개수를 좀 더 늘려줘!
          </button>
        </div>
      )}
    </div>
  );

};