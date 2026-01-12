import { createRoot } from 'react-dom/client';
import { useState } from 'react';

// --- 스타일: 버튼 & 컨테이너 ---
const styles = {
  floatingButton: {
    position: 'fixed' as const,
    bottom: '30px',
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '30px',
    zIndex: 999999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    outline: 'none', // 클릭 시 테두리 제거
  },
  overlayContainer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iframeWrapper: {
    width: '1440px',
    height: '900px',
    border: 'none',
    borderRadius: '16px',
    backgroundColor: 'transparent',
    transform: 'scale(0.7)',
    transformOrigin: 'center center',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  }
};

function ContentApp() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  const appUrl = chrome.runtime.getURL('index.html');

  return (
    <>
      <style>{`
        /* Shadow DOM 내부용 리셋 CSS (웹사이트 스타일 무시) */
        button:hover { transform: scale(1.1); }
        button:active { transform: scale(0.95); }
      `}</style>
      
      <button 
        style={styles.floatingButton} 
        onClick={toggleOpen}
      >
        🍪
      </button>

      {isOpen && (
        <div style={styles.overlayContainer} onClick={toggleOpen}>
          <div onClick={(e) => e.stopPropagation()}>
            <iframe 
              src={appUrl} 
              style={styles.iframeWrapper}
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </>
  );
}

// --- 안전하게 주입하기 (Shadow DOM 사용) ---
const hostDiv = document.createElement('div');
hostDiv.id = 'cukee-extension-host';
// 사이트 UI에 영향 안 주게 호스트 자체를 초기화
hostDiv.style.cssText = "position: relative; z-index: 2147483647;"; 

document.body.appendChild(hostDiv);

// Shadow DOM 생성 (Open 모드)
const shadowRoot = hostDiv.attachShadow({ mode: 'open' });

// Shadow DOM 안에 리액트 렌더링
createRoot(shadowRoot).render(<ContentApp />);

console.log("🍪 Cukee 확장프로그램이 Shadow DOM에 주입되었습니다!");