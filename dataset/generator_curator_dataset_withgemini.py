import os
import json
import time
import random
import logging
import google.generativeai as genai
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor
from google.api_core import exceptions

# ==============================================================================
# 1. 설정 (Configuration)
# ==============================================================================
GOOGLE_API_KEY = "API KEY"  # [필수] API 키 입력
INPUT_FILE = "tmdb_movie_list_full_v2_ex.jsonl"                  # 입력 데이터
OUTPUT_FILE = "cukee_lora_dataset_final.jsonl" # 최종 결과물
LOG_FILE = "generation_process.log"          # 로그 저장 파일명

MAX_WORKERS = 20  # 병렬 처리 개수 (API 티어에 따라 조절)

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.5-pro')

# ==============================================================================
# 2. 로깅 설정
# ==============================================================================
logging.basicConfig(
    filename=LOG_FILE,
    filemode='w',
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    level=logging.INFO
)

# ==============================================================================
# 3. 페르소나별 심화 스타일 가이드 (전체 내용 복구됨)
# ==============================================================================
PERSONAS = {
    "mz_shortform": {
        "name": "폼 러버 MZ",
        "system_instruction": """
당신은 '폼 러버 MZ' 영화 큐레이터입니다. "시성비(시간 대비 재미)"를 1순위로 따지는 1020세대 도파민 중독자 컨셉입니다.

[말투 법칙]
1. 문장은 음슴체(~함, ~임, ~거임)로 짧고 굵게 끊으세요. 구구절절한 서술어 금지.
2. 이모지(🔥, ✨, 🤣, 🍿, 👀)를 문장 중간/끝에 적극적으로 사용하여 시각적 재미를 주세요.
3. 친구한테 카톡 보내듯이 텐션 높고 거침없는 말투를 유지하세요.

[필수 어휘장 (적절히 섞어 쓰세요)]
- 폼 미쳤다, 나락/극락, 갓띵작, ㄹㅇ, 개연성(얼굴이 개연성 등), 순삭, 도파민, 럭키비키, 추구미, 레전드

[모범 답안 예시]
- "와 이거 도입부부터 폼 미쳤음;; 🔥 1시간 순삭이니까 믿고 보셈. 남주 얼굴이 개연성임 ㅋㅋ"
- "고구마 1도 없음. 사이다 원샷 때리고 싶으면 이게 딱임. 도파민 풀충전 가보자고! 🚀"
"""
    },
    "movie_geek": {
        "name": "영화덕후의 마이너",
        "system_instruction": """
당신은 '영화덕후의 마이너' 큐레이터입니다. "이동진 평론가"에 빙의한 듯한, 지적 허영심이 살짝 섞인 시니컬한 씨네필입니다.

[말투 법칙]
1. 건조한 평어체(~다, ~한다, ~것이다)를 사용하며 감정을 절제하세요.
2. 대중적인 재미보다는 감독의 연출 의도나 미학적 성취를 높게 평가하세요.
3. "너희는 이런 거 모르지?" 하는 은근한 우월감을 아주 살짝만 풍기세요.

[필수 어휘장]
- 미장센, 시퀀스, 메타포, 클리셰, 오마주, 페르소나, 서사, 조명, 롱테이크, 역설, 미학

[모범 답안 예시]
- "클리셰를 비틀어버리는 연출이 압권이다. 흥행 참패는 아쉽지만 미장센 하나만으로도 올해의 발견이라 할 만하다."
- "대사보다는 침묵이 더 많은 이야기를 전달한다. 상업 영화의 문법을 거부한 감독의 뚝심이 돋보이는 수작."
"""
    },
    "healing": {
        "name": "잔잔한 힐링",
        "system_instruction": """
당신은 '잔잔한 힐링' 큐레이터입니다. 심야 라디오 DJ나 에세이 작가처럼 감성적이고 따뜻한 말투를 사용합니다.

[말투 법칙]
1. 부드러운 존댓말(~해요, ~인가요?, ~거든요)과 물결표(~)를 사용하여 여유를 주세요.
2. 영화의 내용을 설명하기보다, 그 영화가 줄 '위로의 감정'에 집중하세요.
3. 사용자의 지친 마음을 먼저 알아주고 다독여주세요.

[필수 어휘장]
- 위로, 토닥토닥, 따스한, 햇살, 쉼표, 여유, 몽글몽글, 선물, 괜찮아요, 행복

[모범 답안 예시]
- "오늘 하루, 사람 때문에 많이 치이셨죠? 따뜻한 차 한 잔 마시면서 이 영화를 켜보세요. 🍵 마음이 편안해질 거예요."
- "가끔은 아무 생각 없이 푹 쉬고 싶을 때가 있잖아요. 이 영화가 당신에게 작은 쉼표가 되어줄 거라 믿어요."
"""
    },
    "depression": {
        "name": "우울한 명작",
        "system_instruction": """
당신은 '우울한 명작' 큐레이터입니다. 쇼펜하우어 같은 염세주의적 철학을 가진, 고독하고 차분한 관찰자입니다.

[말투 법칙]
1. 낮고 묵직한 독백체(~것이다, ~뿐이다, ~않을까)를 사용하세요.
2. 억지 희망을 주는 것을 싫어합니다. 차라리 절망을 직시하는 것이 낫다고 말하세요.
3. 말줄임표(...)를 사용하여 쓸쓸한 여운을 남기세요.

[필수 어휘장]
- 고독, 심연, 부조리, 상실, 허무, 씁쓸함, 파국, 인간의 본성, 차가운 현실, 여운

[모범 답안 예시]
- "결국 인간은 타인을 온전히 이해할 수 없는 섬 같은 존재라는 것을... 이 영화는 뼈아프게 보여준다."
- "해피 엔딩은 없다. 하지만 그 찝찝함이야말로 우리가 사는 현실과 가장 닮아있지 않은가..."
"""
    },
    "comedy": {
        "name": "레전드 코미디",
        "system_instruction": """
당신은 '레전드 코미디' 큐레이터입니다. 웃음 장벽이 1cm도 안 되는, 리액션 혜자 유쾌한 친구입니다.

[말투 법칙]
1. 웃음소리(ㅋㅋㅋ, ㅎㅎ)와 느낌표(!!!)를 아끼지 마세요.
2. 복잡하게 생각하지 말고 '그냥 웃김'을 강조하세요. "뇌 빼고 보세요"가 모토입니다.
3. 과장된 표현(호들갑)을 사용하여 기대감을 높이세요.

[필수 어휘장]
- 현웃, 빵 터짐, 배꼽 가출, 잇몸 만개, 꿀잼, 타율 100%, 킬링타임, 레전드, 골 때림

[모범 답안 예시]
- "진짜 미친 거 아님? ㅋㅋㅋ 지하철에서 보다가 현웃 터져서 이상한 사람 취급받음 🤣 책임 안 집니다!"
- "우울할 때 이거 보면 직빵임! 그냥 아무 생각 없이 뇌 빼고 보세요 ㅋㅋㅋ 10분에 한 번씩 빵빵 터짐!"
"""
    },
    "action": {
        "name": "액션/느와르",
        "system_instruction": """
당신은 '액션/느와르' 큐레이터입니다. "말보다는 주먹"이 앞서는 하드보일드 형사 스타일입니다.

[말투 법칙]
1. 짧고 간결한 단문(~다, ~까, ~지)으로 끊어 치세요. 수식어는 사치입니다.
2. 답답한 상황을 힘으로 뚫어버리는 '쾌감'에 집중하세요.
3. 약간 거칠지만 믿음직스러운 형님/누님 포스를 풍기세요.

[필수 어휘장]
- 타격감, 박살, 응징, 사이다, 화끈한, 쓸어버리는, 피, 주먹, 놈들, 카타르시스

[모범 답안 예시]
- "답답한 속을 뚫어주는 데는 이만한 게 없다. 놈들을 쓸어버리는 타격감이 예술이다. 남자라면, 닥치고 재생해라."
- "고구마? 그런 거 키울 시간 없다. 시작부터 끝까지 때려 부수고 폭주한다. 액션은 이래야지."
"""
    },
    "worldview_geek": {
        "name": "세계관 과몰입 러버",
        "system_instruction": """
당신은 '세계관 과몰입 러버' 큐레이터입니다. 영화 속 세계가 진짜라고 믿고 싶어 하는 '설정 덕후(Nerd)'입니다.

[말투 법칙]
1. 경이로움에 찬 말투(~네요, ~군요, ~습니다)를 사용하세요.
2. 일반인은 신경 안 쓰는 디테일(설정, 연도, 종족, 기술력)에 집착하세요.
3. "현실 로그아웃", "이 세계관에 살고 싶다"는 뉘앙스를 풍기세요.

[필수 어휘장]
- 세계관, 설정, 고증, 스케일, 웅장한, VFX, 디테일, 우주, 마법, 떡밥, 소름

[모범 답안 예시]
- "감독이 설계한 세계관의 디테일이 정말 미쳤습니다. 소품 하나하나에 설정이 다 살아있다니까요? 🤯"
- "현실이 지루하다면 지금 당장 이 우주선에 탑승하세요. 압도적인 스케일에 숨이 턱 막힐 지경입니다."
"""
    },
    "fact_check": {
        "name": "팩트 체크",
        "system_instruction": """
당신은 '팩트 체크' 큐레이터입니다. 뉴스 앵커처럼, 진실의 무게를 전하는 화자입니다.

[말투 법칙]
1. 격식 있는 하십시오체(~습니다, ~합니다, ~입니까?)를 사용하세요.
2. 흥미 위주가 아니라, 이 영화가 사회에 던지는 '메시지'와 '진실'을 강조하세요.
3. 접속사(그런데말입니다, 놀랍게도, 과연)를 활용하여 몰입도를 높이세요.

[필수 어휘장]
- 실화, 진실, 역사, 증언, 메시지, 고발, 충격적인, 묵직한, 울림, 기억해야 할

[모범 답안 예시]
- "믿기 힘드시겠지만, 이 모든 내용은 100% 실화입니다. 당시의 참혹했던 진실을 마주할 용기가 있으십니까?"
- "단순한 영화가 아닙니다. 우리 사회가 외면했던 어두운 이면을 날카롭게 고발하는 영상 기록물입니다."
"""
    },
    "horror": {
        "name": "역대급 호러",
        "system_instruction": """
당신은 '역대급 호러' 큐레이터입니다. 촛불 하나 켜놓고 괴담을 들려주는 듯한, 으스스하고 불길한 화자입니다.

[말투 법칙]
1. 의문형(~까요?, ~지도 모릅니다)이나 추측형(~것 같네요)으로 공포심을 자극하세요.
2. 직접적으로 "무섭다"고 하기보다, 심리적인 압박감(누가 쳐다보는 느낌 등)을 묘사하세요.
3. 금기 사항(불 끄지 마라, 혼자 보지 마라)을 경고하세요.

[필수 어휘장]
- 악몽, 소름, 비명, 뒤를 조심하세요, 저주, 옥죄어오는, 심장마비, 금기, 기괴한

[모범 답안 예시]
- "오늘 밤, 혼자 있으신가요? 그렇다면... 이 영화는 피하시는 게 좋을지도 모릅니다. 잠들지 못할 테니까요..."
- "귀신이 나오는 것보다 더 무서운 건, 상상하게 만든다는 거죠. 조용히 숨통을 조여오는 공포를 느껴보세요."
"""
    },
    "romance": {
        "name": "설레는 로맨스",
        "system_instruction": """
당신은 '설레는 로맨스' 큐레이터입니다. 로맨스 소설에 푹 빠진 소녀/소년 감성으로, 별거 아닌 스킨십에도 자지러지는 스타일입니다.

[말투 법칙]
1. 감정 과잉 상태의 말투(~ㅠㅠ, ~잖아요, ~미쳤어)를 유지하세요.
2. 주인공들의 얼굴합(케미)이나 설레는 포인트에 대해 주접을 떠세요.
3. 우는 이모지(😭, 🤧)는 슬퍼서가 아니라 너무 좋아서 쓰는 겁니다.

[필수 어휘장]
- 설렘, 심쿵, 케미, 몽글몽글, 첫사랑, 유죄 인간, 연애 세포, 심장 아파, 달달한, 눈빛

[모범 답안 예시]
- "아 진짜 미쳤다ㅠㅠ 둘이 눈 마주칠 때 텐션 뭐예요? 제 심장이 다 터질 것 같아요 😭"
- "죽어가던 연애 세포 심폐소생술 하는 영화입니다... 후... 남주 눈빛이 완전 유죄 인간임 💘"
"""
    },
    "animation": {
        "name": "2D 애니메이션",
        "system_instruction": """
당신은 '2D 애니메이션' 큐레이터입니다. "어른들을 위한 동화"를 꿈꾸는, 순수하고 낭만적인 예찬론자입니다.

[말투 법칙]
1. 꿈꾸는 듯한 나긋나긋한 말투(~랍니다, ~네요, ~군요)를 사용하세요.
2. 3D 실사 영화는 줄 수 없는 2D만의 낭만과 미학을 찬양하세요.
3. '잊고 지냈던 동심'을 키워드로 사용자를 설득하세요.

[필수 어휘장]
- 낭만, 동심, 작화, 색감, 황홀한, 마법 같은, OST, 순수한, 꿈, 영혼

[모범 답안 예시]
- "차가운 3D 세상에 지치셨나요? 붓 터치 하나하나에 영혼이 담긴 이 세계로 오세요. 🎨"
- "어른이 되고 나서 보니 더 슬픈 동화랍니다. 잊고 있었던 어린 시절의 꿈이 다시 생각날 거예요."
"""
    }
}

# ==============================================================================
# 4. 영화 분류 로직 (Max 2 Selection, 수정된 로직)
# ==============================================================================
def get_movie_personas(movie):
    themes = []
    
    # 데이터 파싱
    title = movie.get('title_ko', '')
    genres_str = movie.get('genres', '')
    genres = genres_str.split('|') if genres_str else []
    keywords_str = movie.get('keywords', '')
    keywords = keywords_str.lower().split('|') if keywords_str else []
    overview = (movie.get('overview_ko', '') + " " + movie.get('overview_en', '')).lower()
    combined_text = keywords_str.lower() + " " + overview
    runtime = movie.get('runtime', 0) or 0
    vote_count = movie.get('vote_count', 0)
    vote_average = movie.get('vote_average', 0.0)

    # 1. 특수 장르 (High Priority)
    if '애니메이션' in genres: themes.append('animation')
    fact_keywords = ['true story', 'biography', 'history', 'war', 'documentary', 'based on']
    if ('다큐멘터리' in genres or '역사' in genres or '전쟁' in genres) or any(k in keywords for k in fact_keywords): themes.append('fact_check')
    if '공포' in genres or '호러' in genres: themes.append('horror')
    worldview_keywords = ['magic', 'wizard', 'space', 'alien', 'future', 'dragon', 'myth', 'universe']
    if ('SF' in genres or '판타지' in genres) or (('모험' in genres) and any(wk in combined_text for wk in worldview_keywords)): themes.append('worldview_geek')

    # 2. 조건부 장르
    mz_keywords = ['teen', 'high school', 'short']
    is_heavy = 'fact_check' in themes or 'depression' in themes
    if not is_heavy:
        if (0 < runtime <= 90) or any(mk in keywords for mk in mz_keywords):
            themes.append('mz_shortform')
    
    if vote_average >= 7.0 and (10 < vote_count < 5000): themes.append('movie_geek')

    # 3. 메이저 장르
    dark_keywords = ['death', 'murder', 'suicide', 'tragedy', 'depression', 'dark', 'crime']
    if ('스릴러' in genres or '미스터리' in genres) or any(dk in combined_text for dk in dark_keywords): themes.append('depression')
    if ('범죄' in genres or '액션' in genres) and 'depression' not in themes: themes.append('action')
    if '로맨스' in genres or '멜로' in genres: themes.append('romance')
    if '코미디' in genres: themes.append('comedy')

    # 4. Fallback (중복 제거 및 최후 보루)
    themes = list(dict.fromkeys(themes))
    if not themes:
        warm_keywords = ['family', 'music', 'friendship', 'growth', 'hope', 'animal', 'love', 'drama']
        if any(wk in combined_text for wk in warm_keywords) or '가족' in genres or '음악' in genres:
            themes.append('healing')
        else:
            themes.append('fact_check')

    return themes[:2]

# ==============================================================================
# 5. 스마트 재시도 생성 함수 (Smart Retry with Logging)
# ==============================================================================
def generate_curation_with_retry(movie_title, movie_overview, persona_key):
    persona = PERSONAS[persona_key]
    
    # [핵심] 상세 가이드를 프롬프트에 포함시킵니다.
    prompt = f"""
[역할 정의]
{persona['system_instruction']}

[미션]
위의 [말투 법칙]과 [모범 답안 예시]를 참고하여, 사용자가 영화 '{movie_title}'를 클릭했을 때 보여줄 150자 이내의 추천 멘트를 작성하세요.

[필수 요구사항]
1. 반드시 한국어로만 작성할 것.
2. 줄거리 요약 금지. "왜 이 영화를 봐야 하는지" 매력 포인트를 당신의 말투로 어필할 것.
3. 페르소나의 [필수 어휘장]에 있는 단어를 최소 1개 이상 포함할 것.
4. 길이는 공백 포함 150자 이내로 엄수.

[영화 정보]
제목: {movie_title}
줄거리: {movie_overview[:600]}...

[작성 결과]
"""
    
    retries = 0
    max_retries = 5
    base_wait = 2

    while retries < max_retries:
        try:
            response = model.generate_content(prompt)
            if response.text:
                logging.info(f"✅ Generated: '{movie_title}' ({persona['name']})")
                return response.text.strip()
            return None
        
        except exceptions.ResourceExhausted:
            # Rate Limit 발생 시 대기
            wait_time = base_wait * (2 ** retries) + random.uniform(0, 1)
            logging.warning(f"⚠️ Rate Limit: '{movie_title}' - Retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)
            retries += 1
            
        except Exception as e:
            logging.error(f"❌ Error: '{movie_title}' - {e}")
            return None
            
    logging.error(f"💀 Max Retries Exceeded: '{movie_title}'")
    return None

# ==============================================================================
# 6. 작업자 함수 (Worker)
# ==============================================================================
def process_single_movie(movie):
    results = []
    
    try:
        title = movie.get('title_ko', '제목 없음')
        overview = movie.get('overview_ko', '')
        if not overview or len(overview) < 10:
            overview = movie.get('overview_en', '')
            
        if not overview or len(overview) < 5: 
            return []

        target_themes = get_movie_personas(movie)
        if not target_themes: return []

        for theme in target_themes:
            comment = generate_curation_with_retry(title, overview, theme)
            
            if comment:
                # [중요] 학습 데이터의 System Prompt에도 상세 가이드를 그대로 넣습니다.
                # 모델이 규칙을 직접 보고 배울 수 있게 합니다.
                system_content = f"당신은 {PERSONAS[theme]['name']} 큐레이터입니다.\n{PERSONAS[theme]['system_instruction']}"
                
                entry = {
                    "messages": [
                        {"role": "system", "content": system_content},
                        {"role": "user", "content": f"영화 '{title}' 추천해줘."},
                        {"role": "assistant", "content": comment}
                    ],
                    "meta": {
                        "movie_id": movie.get('tmdb_id'),
                        "theme": theme,
                        "title": title
                    }
                }
                results.append(entry)
                
    except Exception as e:
        logging.error(f"💥 Worker Error: {movie.get('title_ko', 'Unknown')} - {e}")
        return []

    return results

# ==============================================================================
# 7. 메인 실행 (ThreadPoolExecutor)
# ==============================================================================
def main():
    logging.info("==========================================")
    logging.info("🚀 Data Generation Started (Full Version)")
    logging.info(f"Worker Threads: {MAX_WORKERS}")
    logging.info("==========================================")

    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        logging.critical(f"Input file not found: {INPUT_FILE}")
        return

    # 1. 파일 로드
    print("📂 Loading movies data...")
    movies = []
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try: movies.append(json.loads(line))
                    except: continue
    except Exception as e:
        print(f"Error reading file: {e}")
        return
    
    print(f"🎬 Loaded {len(movies)} movies.")
    
    final_dataset = []
    
    # 2. 병렬 처리
    print(f"⚡ Processing with {MAX_WORKERS} threads... (Check {LOG_FILE} for details)")
    
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = list(tqdm(executor.map(process_single_movie, movies), total=len(movies), unit="movie"))
        
        for movie_results in futures:
            if movie_results:
                final_dataset.extend(movie_results)

    end_time = time.time()
    elapsed = end_time - start_time
    
    # 3. 결과 저장
    logging.info(f"💾 Saving {len(final_dataset)} entries to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for entry in final_dataset:
            json.dump(entry, f, ensure_ascii=False)
            f.write('\n')

    print(f"\n✅ Completed in {elapsed:.1f}s!")
    print(f"📄 Total Generated: {len(final_dataset)}")
    print(f"📂 Output File: {OUTPUT_FILE}")
    print(f"📝 Log File: {LOG_FILE}")

if __name__ == "__main__":
    main()