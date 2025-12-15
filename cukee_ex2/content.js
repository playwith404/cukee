(() => {
    // 중복 실행 방지
    if (document.getElementById('qooky-root')) return;

    // 1. 큐키 버튼 생성
    const fab = document.createElement('div');
    fab.id = 'qooky-fab';
    fab.innerText = '🍪';
    Object.assign(fab.style, {
        position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
        borderRadius: '50%', backgroundColor: '#FF3366', color: 'white', fontSize: '30px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: '2147483647', transition: 'transform 0.2s'
    });
    
    // 2. Iframe 컨테이너 생성
    const iframe = document.createElement('iframe');
    iframe.id = 'qooky-frame';
    iframe.src = chrome.runtime.getURL('app.html');
    Object.assign(iframe.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        border: 'none', zIndex: '2147483646', display: 'none',
        backgroundColor: 'rgba(0,0,0,0.5)' // 배경 어둡게 처리
    });

    // 3. 화면에 주입
    document.body.appendChild(fab);
    document.body.appendChild(iframe);

    // 4. 클릭 이벤트
    let isOpen = false;
    fab.addEventListener('click', () => {
        isOpen = !isOpen;
        iframe.style.display = isOpen ? 'block' : 'none';
        fab.innerText = isOpen ? '✖' : '🍪';
        
        // 열릴 때 애니메이션 효과
        if(isOpen) {
            iframe.style.opacity = '0';
            setTimeout(() => iframe.style.opacity = '1', 50);
        }
    });
})();