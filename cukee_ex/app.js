// app.js - 전체 코드 교체

// Mock Data (기존 데이터 유지)
const movieData = {
    mz: {
        title: "MZ 숏폼 러버를 위한 전시회",
        note: "지루할 틈 없이 전개되는, 도파민 폭발하는 작품들만 모았습니다. 1시간 내외의 러닝타임으로 가볍게 즐겨보세요.",
        movies: ["퀸카로 살아남는 법", "클루리스", "엑스 오, 키티", "에밀리 파리에 가다"]
    },
    depress: {
        title: "우울한 명작 전시회",
        note: "가슴 한편이 아려오는, 하지만 눈을 뗄 수 없는 씁쓸한 여운을 즐겨보세요. 오늘은 좀 울어도 됩니다.",
        movies: ["조커", "기생충", "레퀴엠", "헤어질 결심"]
    },
    action: {
        title: "아드레날린 폭발 액션관",
        note: "생각은 잠시 멈추고 본능에 맡기세요. 시원하게 부수고 달리는 액션 쾌감을 선사합니다.",
        movies: ["존 윅 4", "매드맥스", "범죄도시", "미션 임파서블"]
    },
    sf: {
        title: "미지의 세계, SF관",
        note: "현실을 벗어나 광활한 우주와 미래로 떠납니다. 상상력의 끝을 보여주는 걸작들입니다.",
        movies: ["인터스텔라", "듄", "블레이드 러너", "그래비티"]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const viewHome = document.getElementById('view-home');
    const viewGallery = document.getElementById('view-gallery');
    const galleryTrack = document.getElementById('gallery-track');
    const galleryTitle = document.getElementById('gallery-title');
    const curatorText = document.getElementById('curator-text');
    const btnBack = document.getElementById('btn-back');

    // 1. 페르소나 버튼 클릭 이벤트
    document.querySelectorAll('.persona-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-type');
            renderGallery(type);
        });
    });

    // 2. 뒤로 가기 버튼
    btnBack.addEventListener('click', () => {
        viewGallery.classList.remove('active');
        viewHome.classList.add('active');
        
        // 뒤로 갔을 때 텍스트 원래대로 복구 (선택 사항)
        resetHomeText();
    });

    // 3. 갤러리 렌더링 함수
    function renderGallery(type) {
        const data = movieData[type];
        galleryTitle.innerText = data.title;
        curatorText.innerText = data.note;

        galleryTrack.innerHTML = '';
        data.movies.forEach(movieTitle => {
            const frame = document.createElement('div');
            frame.className = 'movie-frame';
            frame.innerHTML = `
                <div style="font-size: 40px;">🎬</div>
                <div class="movie-title">${movieTitle}</div>
            `;
            galleryTrack.appendChild(frame);
        });

        viewHome.classList.remove('active');
        viewGallery.classList.add('active');
    }

    // 4. [핵심] 외부(content.js)에서 보내온 영화 제목 처리
    // app.js 의 message 이벤트 리스너 수정

    // 4. 외부 메시지 처리 (제목 표시 & 초기화)
    window.addEventListener('message', (event) => {
        
        // Case 1: 영화 제목을 받았을 때
        if (event.data.type === 'CURRENT_MOVIE') {
            const movieTitle = event.data.title;
            
            const titleElement = viewHome.querySelector('h2');
            const subtitleElement = viewHome.querySelector('.subtitle');

            titleElement.innerHTML = `<span style="color:#FF3366">${movieTitle}</span>에<br>관심이 있으신가요?`;
            subtitleElement.innerText = "이 작품의 여운을 이어갈 특별한 전시회를 준비했습니다.";

            if (viewGallery.classList.contains('active')) {
                viewGallery.classList.remove('active');
                viewHome.classList.add('active');
            }
        } 
        // Case 2: 초기화 신호를 받았을 때 (홈 화면 등)
        else if (event.data.type === 'RESET_HOME') {
            resetHomeText(); // 원래 문구로 되돌리는 함수 실행
        }
    });

    // 홈 텍스트 초기화 함수
    function resetHomeText() {
        const titleElement = viewHome.querySelector('h2');
        const subtitleElement = viewHome.querySelector('.subtitle');
        titleElement.innerHTML = "오늘의 기분은 어떠신가요?";
        titleElement.style.color = "white";
        subtitleElement.innerText = "AI 큐레이터가 당신을 위한 전시회를 준비합니다.";
    }
});