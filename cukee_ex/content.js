// content.js
(() => {
    // 1. 큐키 플로팅 버튼 생성 (기존과 동일)
    const existingFab = document.getElementById('qooky-fab-btn');
    if (existingFab) existingFab.remove(); // 중복 방지

    const fab = document.createElement('div');
    fab.innerText = '🍪'; 
    fab.id = 'qooky-fab-btn';
    
    Object.assign(fab.style, {
        position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
        borderRadius: '50%', backgroundColor: '#FF3366', color: 'white', fontSize: '30px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: '999999', transition: 'transform 0.2s'
    });

    fab.onmouseover = () => fab.style.transform = 'scale(1.1)';
    fab.onmouseout = () => fab.style.transform = 'scale(1.0)';

    // 2. 오버레이 iframe 생성 (기존과 동일)
    const existingIframe = document.getElementById('qooky-overlay-frame');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('app.html');
    iframe.id = 'qooky-overlay-frame';
    
    Object.assign(iframe.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '900px', height: '600px', border: 'none', borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: '999998',
        display: 'none', backgroundColor: 'transparent'
    });

    document.body.appendChild(fab);
    document.body.appendChild(iframe);

    // 3. 제목 추출 함수 (핵심 기능 강화!)
    function getMovieTitle() {
        // 우선순위 1: 메타 태그 (가장 정확함)
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) {
            return ogTitle.content.replace(' | 왓챠', '').trim();
        }

        // 우선순위 2: 화면의 큰 제목 (H1 태그)
        const h1 = document.querySelector('h1');
        if (h1) {
            return h1.innerText.trim();
        }

        // 우선순위 3: 브라우저 탭 제목 (보조 수단)
        return document.title.split(' | ')[0].trim();
    }

    // 4. 클릭 이벤트
    let isOpen = false;
    // content.js 의 클릭 이벤트 부분 수정

    fab.addEventListener('click', () => {
        isOpen = !isOpen;
        
        if (isOpen) {
            iframe.style.display = 'block';
            fab.innerText = '❌';
            
            // [수정됨] 상세 페이지인지 체크
            if (window.location.href.includes('/contents/')) {
                // 영화 상세 페이지라면 -> 제목 읽어서 전송
                setTimeout(() => {
                    const title = getMovieTitle();
                    console.log("큐키가 찾은 영화 제목:", title); 

                    iframe.contentWindow.postMessage({
                        type: 'CURRENT_MOVIE',
                        title: title || "이 작품"
                    }, '*');
                }, 100); 
            } else {
                // [추가된 로직] 영화 페이지가 아니라면 (홈, 검색화면 등) -> 초기화 신호 전송
                iframe.contentWindow.postMessage({
                    type: 'RESET_HOME'
                }, '*');
            }

        } else {
            iframe.style.display = 'none';
            fab.innerText = '🍪';
        }
    });
})();