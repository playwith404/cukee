// === 가상 DB 데이터 ===
const MOCK_DB = {
    healing: {
        title: "마음의 평화, 힐링 전시회",
        curator: "이감성",
        emoji: "🌿",
        msg: "지친 하루였죠? 편안하게 쉴 수 있는 작품들을 모아봤어요.",
        movies: [
            { title: "리틀 포레스트", poster: "https://image.tmdb.org/t/p/w500/2i0s5f8b9Q4N5q9c6t9c9t9c9t9.jpg" },
            { title: "소울", poster: "https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg" },
            { title: "인턴", poster: "https://image.tmdb.org/t/p/w500/adOzdWS3qhLNkqXYPYa6j9LhYfI.jpg" },
            { title: "어바웃 타임", poster: "https://image.tmdb.org/t/p/w500/iLg73p3a01a30999999.jpg" },
            { title: "라라랜드", poster: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoUyZ4agol6dU3EVk.jpg" },
            { title: "비긴 어게인", poster: "https://image.tmdb.org/t/p/w500/xKj3g3c3t3t3t3.jpg" }
        ]
    },
    comedy: {
        title: "배꼽 도둑, 코미디 전시회",
        curator: "김깔깔",
        emoji: "🤣",
        msg: "생각 비우고 그냥 웃고 싶을 때! 이 영화들이 딱이야 ㅋㅋ",
        movies: [
            { title: "극한직업", poster: "https://image.tmdb.org/t/p/w500/q130j1j1j1.jpg" },
            { title: "데드풀", poster: "https://image.tmdb.org/t/p/w500/fSRb7vyIP8rQpL0I47P3qUsEKX3.jpg" },
            { title: "마스크", poster: "https://image.tmdb.org/t/p/w500/xIwj5j5j5.jpg" },
            { title: "세 얼간이", poster: "https://image.tmdb.org/t/p/w500/u7k7k7k7k7.jpg" },
            { title: "행오버", poster: "https://image.tmdb.org/t/p/w500/ul6l6l6l6.jpg" }
        ]
    },
    depress: {
        title: "깊은 우울의 바다",
        curator: "박우울",
        emoji: "☔",
        msg: "가끔은 한없이 가라앉고 싶은 날이 있죠. 그 깊이를 함께해 줄 영화들입니다.",
        movies: [
            { title: "조커", poster: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg" },
            { title: "기생충", poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
            { title: "레퀴엠", poster: "https://www.themoviedb.org/t/p/w1280/tLTg9moUjhfANdYyVIBUIrwmav9.jpg" },
            { title: "헤어질 결심", poster: "https://www.themoviedb.org/t/p/w1280/rXEJ28XDQsogIGqwVEgwM2oDdpl.jpg" },
            { title: "블랙 스완", poster: "https://www.themoviedb.org/t/p/w1280/tqlmLBt2i5SHNpXEj2nqk10Crwa.jpg" }
        ]
    },
    action: {
        title: "아드레날린 폭발 액션",
        curator: "강액션",
        emoji: "🔥",
        msg: "스트레스는 부숴야 제맛이지! 다 때려부수는 영화 대령했습니다.",
        movies: [
            { title: "범죄도시", poster: "https://image.tmdb.org/t/p/w500/a1a1a1.jpg" },
            { title: "존 윅 4", poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5U7a87u1.jpg" },
            { title: "매드맥스", poster: "https://image.tmdb.org/t/p/w500/hA2plekW8f0iyXX6v9if1.jpg" },
            { title: "탑건", poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17dbH.jpg" },
            { title: "미션임파서블", poster: "https://image.tmdb.org/t/p/w500/777777.jpg" }
        ]
    }
};

let currentTheme = 'healing';
let currentFrame = 'basic';

// ============================================
// ★ [핵심 수정] HTML이 다 로딩되면 이벤트 연결
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 티켓 클릭 이벤트 연결
    document.querySelectorAll('.ticket').forEach(ticket => {
        ticket.addEventListener('click', () => {
            const theme = ticket.getAttribute('data-theme');
            goToGallery(theme);
        });
    });

    // 2. 뒤로가기 버튼
    document.getElementById('btn-back').addEventListener('click', goBack);

    // 3. 꾸미기 패널 토글 버튼
    document.getElementById('btn-edit-toggle').addEventListener('click', toggleEditPanel);

    // 4. 배경 변경 버튼들 (data-bg 속성 사용)
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeBg(btn.getAttribute('data-bg'));
        });
    });

    // 5. 액자 변경 버튼들 (data-frame 속성 사용)
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeFrame(btn.getAttribute('data-frame'));
        });
    });

    // 6. 프롬프트 제출 버튼
    document.getElementById('btn-submit-prompt').addEventListener('click', submitPrompt);

    // 7. 엔터키 입력 지원
    document.getElementById('user-prompt').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitPrompt();
    });
});


// === 기능 함수들 ===

function goToGallery(theme) {
    currentTheme = theme;
    document.getElementById('page-ticket').classList.remove('active');
    document.getElementById('page-gallery').classList.add('active');
    renderGallery(theme);
}

function goBack() {
    document.getElementById('page-gallery').classList.remove('active');
    document.getElementById('page-ticket').classList.add('active');
}

function renderGallery(theme) {
    const data = MOCK_DB[theme];
    
    document.getElementById('gallery-title').innerText = data.title;
    document.getElementById('curator-emoji').innerText = data.emoji;
    document.getElementById('curator-msg').innerText = data.msg;

    const listEl = document.getElementById('movie-list');
    listEl.innerHTML = '';
    
    data.movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = `movie-card ${currentFrame}`; // 현재 프레임 유지
        
        // 지연 로딩(Lazy Loading) 적용된 이미지
        card.innerHTML = `
            <img 
                src="${movie.poster}" 
                alt="${movie.title}" 
                class="poster-img"
                loading="lazy" 
                onerror="this.style.display='none'; this.parentElement.style.background='#333';"
            >
            <div class="movie-title">${movie.title}</div>
        `;
        listEl.appendChild(card);
    });
}

function toggleEditPanel() {
    document.getElementById('edit-panel').classList.toggle('hidden');
}

function changeBg(type) {
    const wrapper = document.querySelector('.glass-wrapper');
    wrapper.classList.remove('theme-midnight', 'theme-sunset', 'theme-ocean');
    wrapper.classList.add(`theme-${type}`);
}

function changeFrame(style) {
    currentFrame = style ? `frame-${style}` : '';
    // 현재 리스트에 있는 카드들도 즉시 변경
    const cards = document.querySelectorAll('.movie-card');
    cards.forEach(card => {
        card.classList.remove('frame-neon', 'frame-gold');
        if (style !== 'basic') card.classList.add(`frame-${style}`);
    });
}

function submitPrompt() {
    const input = document.getElementById('user-prompt');
    const text = input.value.trim();
    if (!text) return;

    document.getElementById('curator-msg').innerText = "프롬프트 분석 중... 🧠";

    setTimeout(() => {
        if (text.includes("신나") || text.includes("액션") || text.includes("박진감")) {
            renderGallery('action');
        } else if (text.includes("우울") || text.includes("슬퍼")) {
            renderGallery('depress');
        } else if (text.includes("웃긴") || text.includes("재미")) {
            renderGallery('comedy');
        } else {
            renderGallery('healing');
        }
        input.value = '';
    }, 1000);
}