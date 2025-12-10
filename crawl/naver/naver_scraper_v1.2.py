import json
import time
import os
import re
import sys
import datetime
import multiprocessing
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import InvalidSessionIdException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

# ==========================================
# [설정] 입력 파일 경로 및 옵션
# ==========================================
INPUT_FILE_PATH = "split_tmdb/tmdb_part_숫자.jsonl"  # 데이터 파일
SAVE_DIR = "naver_reviews_data"            # 결과 저장 폴더
LOG_DIR = "logs"                     # 로그 저장 폴더
MAX_REVIEWS_LIMIT = 50000            # 영화당 최대 수집 개수
MAX_WORKERS = 10                     # 동시 실행할 워커 수
RESTART_EVERY = 40                   # 브라우저 재시작 주기

# 폴더 생성
for d in [SAVE_DIR, LOG_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

# ---------------------------------------------------------
# 1. 드라이버 설정 (경로를 인자로 받음)
# ---------------------------------------------------------
def init_driver(driver_path):
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    prefs = {"profile.managed_default_content_settings.images": 2}
    chrome_options.add_experimental_option("prefs", prefs)
    
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    
    # [수정] main에서 넘겨받은 경로 사용
    service = Service(executable_path=driver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.set_page_load_timeout(60)
    return driver

def clean_filename(title):
    return re.sub(r'[\\/*?:"<>|]', "", title).replace(" ", "_")

# ---------------------------------------------------------
# 2. 수집 로직 (평점 제거 버전)
# ---------------------------------------------------------
def crawl_reviews_v9(driver, movie_data, save_path, logger, log_prefix):
    title_ko = movie_data.get('title_ko', '')
    original_title = movie_data.get('original_title', '')
    tmdb_id = movie_data.get('tmdb_id')
    
    date_kr = movie_data.get('release_date_kr', '')
    year_kr = int(date_kr[:4]) if date_kr and len(date_kr) >= 4 else None
    
    date_global = movie_data.get('release_date_global', '')
    year_global = int(date_global[:4]) if date_global and len(date_global) >= 4 else None

    search_patterns = []
    if title_ko:
        search_patterns.append(f"영화 {title_ko} 관람평")
        search_patterns.append(f"{title_ko} 평점")
    if original_title:
        search_patterns.append(f"영화 {original_title} 관람평")
        search_patterns.append(f"{original_title} 평점")

    scroller = None
    total_count = 0
    wait = WebDriverWait(driver, 10)
    
    for query in search_patterns:
        try:
            url = f"https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query={query}"
            driver.get(url)
            time.sleep(2.0)
            
            try:
                tab_xpath = '//*[@id="main_pack"]//a[contains(text(), "관람평") or contains(text(), "평점")]'
                rating_tab = wait.until(EC.element_to_be_clickable((By.XPATH, tab_xpath)))
                driver.execute_script("arguments[0].click();", rating_tab)
                time.sleep(1.5)
            except: pass

            # 연도 검증
            is_valid_movie = True 
            try:
                target_div = driver.find_element(By.XPATH, '//*[@id="main_pack"]/div[3]/div[1]/div[1]/div')
                raw_text = target_div.text
                candidates = re.findall(r'(19\d{2}|20\d{2})', raw_text)
                if candidates:
                    is_match_found = False
                    candidates = [int(y) for y in candidates]
                    for cand in candidates:
                        if year_kr and cand == year_kr:
                            is_match_found = True; break
                        elif year_global and abs(cand - year_global) <= 1:
                            is_match_found = True; break
                    if not is_match_found: is_valid_movie = False
            except: pass

            if not is_valid_movie: continue

            scroller = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".lego_review_list._scroller")))
            try:
                count_el = driver.find_element(By.XPATH, "//*[contains(text(), '참여') and contains(@class, 'count')]")
                match = re.search(r'(\d[\d,]*)', count_el.text)
                if match: total_count = int(match.group(1).replace(',', ''))
            except: pass
            break 
        except: continue

    if scroller is None:
        logger(f"{log_prefix} {title_ko}...  ⏩ 패스 (검색 실패)")
        return

    logger(f"{log_prefix} {title_ko}...  🚀 수집: {title_ko} ({total_count}건)", end_line=False)
    
    collected_count = 0
    saved_ids = set() 
    no_new_data = 0
    item_selector = ".lego_review_list._scroller .area_card_outer > li.area_card"

    with open(save_path, 'a', encoding='utf-8') as f:
        while True:
            if collected_count >= total_count and total_count > 0: break
            if MAX_REVIEWS_LIMIT > 0 and collected_count >= MAX_REVIEWS_LIMIT: break

            items = driver.find_elements(By.CSS_SELECTOR, item_selector)
            new_in_batch = 0
            
            for item in items:
                try:
                    try:
                        spoiler = item.find_element(By.CSS_SELECTOR, ".story_more, .btn_spoiler_view")
                        driver.execute_script("arguments[0].click();", spoiler)
                    except: pass

                    try: content = item.find_element(By.CSS_SELECTOR, ".desc._text, .desc_txt").text.strip()
                    except: content = item.text

                    content_clean = content.replace("\n", " ")
                    unique_key = content_clean[:40]

                    if len(content_clean.replace(" ", "")) > 2 and unique_key not in saved_ids:
                        review_json = {
                            "tmdb_id": tmdb_id,
                            "title_ko": title_ko,
                            "original_title": original_title,
                            "content": content_clean,
                            "source": "naver"
                        }
                        f.write(json.dumps(review_json, ensure_ascii=False) + "\n")
                        saved_ids.add(unique_key)
                        collected_count += 1
                        new_in_batch += 1
                except: continue

            if len(items) > 60:
                driver.execute_script("""
                    var scroller = document.querySelector('.lego_review_list._scroller');
                    if (scroller) {
                        var list = scroller.querySelector('.area_card_outer');
                        var items = list.querySelectorAll('li.area_card');
                        for (var i = 0; i < items.length - 30; i++) { items[i].remove(); }
                    }
                """)

            try:
                last_height = driver.execute_script("return arguments[0].scrollHeight", scroller)
                driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight;", scroller)
                driver.execute_script("arguments[0].dispatchEvent(new Event('scroll'));", scroller)
                time.sleep(2.0)
                new_height = driver.execute_script("return arguments[0].scrollHeight", scroller)
                
                if new_in_batch == 0 and new_height == last_height: no_new_data += 1
                else: no_new_data = 0
            except: break

            if no_new_data >= 5: break
            
    logger(f" ... 완료 ({collected_count}건)", timestamp=False)

# ---------------------------------------------------------
# 3. 워커 프로세스
# ---------------------------------------------------------
def worker_process(args):
    # 인자 분해: driver_path 추가됨
    worker_idx, movie_list, driver_path = args
    
    log_file = os.path.join(LOG_DIR, f"worker_{worker_idx+1}.log")
    total_movies = len(movie_list)
    
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(f"========== 워커 {worker_idx+1} 시작 (할당량: {total_movies}개) ==========\n")

    def logger(msg, end_line=True, timestamp=True):
        prefix = f"[{datetime.datetime.now().strftime('%H:%M:%S')}] " if timestamp else ""
        try:
            with open(log_file, 'a', encoding='utf-8') as lf:
                lf.write(f"{prefix}{msg}")
                if end_line: lf.write("\n")
        except: pass

    # [중요] 브라우저 동시 실행 방지를 위한 대기 (워커 번호 * 2초)
    logger(f"⏳ 브라우저 실행 대기 중... ({worker_idx * 2}초)")
    time.sleep(worker_idx * 2)

    try:
        driver = init_driver(driver_path) # 경로 전달
    except Exception as e:
        logger(f"🔥 드라이버 초기화 실패: {e}")
        return

    logger("✅ 브라우저 실행 완료. 수집 시작.")

    for i, movie in enumerate(movie_list):
        title_ko = movie.get('title_ko', 'Unknown')
        tmdb_id = movie.get('tmdb_id', 'Unknown')
        
        safe_title = clean_filename(title_ko)
        release_date = movie.get('release_date_kr') or movie.get('release_date_global') or "unknown"
        year_dir = os.path.join(SAVE_DIR, release_date[:4])
        
        if not os.path.exists(year_dir):
            try: os.makedirs(year_dir, exist_ok=True)
            except: pass
            
        save_path = os.path.join(year_dir, f"reviews_{safe_title}_{tmdb_id}.jsonl")
        log_prefix = f"[{i+1}/{total_movies}]"

        # 이미 수집된 파일 패스
        if os.path.exists(save_path) and os.path.getsize(save_path) > 0:
            continue
        
        # 주기적 재시작
        if i > 0 and i % RESTART_EVERY == 0:
            logger(f"\n   ♻️  메모리 관리를 위한 재시작\n")
            try: driver.quit()
            except: pass
            time.sleep(3)
            driver = init_driver(driver_path)

        try:
            crawl_reviews_v9(driver, movie, save_path, logger, log_prefix)
        except (InvalidSessionIdException, WebDriverException) as e:
            logger(f"\n   🚨 브라우저 에러 재시작... ({str(e)[:50]})")
            try: driver.quit()
            except: pass
            time.sleep(5)
            driver = init_driver(driver_path)
            try:
                crawl_reviews_v9(driver, movie, save_path, logger, log_prefix)
            except:
                logger(f"   ❌ 재시도 실패: {title_ko}")
        except Exception as e:
            logger(f"{log_prefix} ❌ 에러: {e}")
            continue

    try: driver.quit()
    except: pass
    logger("\n🏁 워커 종료")

# ---------------------------------------------------------
# 4. 메인
# ---------------------------------------------------------
def main():
    if not os.path.exists(INPUT_FILE_PATH):
        print(f"❌ [에러] 파일이 존재하지 않습니다: {INPUT_FILE_PATH}")
        return

    movies = []
    with open(INPUT_FILE_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                try: movies.append(json.loads(line))
                except: pass
    
    print(f"🚀 [메인] 파일 로드 완료: {INPUT_FILE_PATH}")
    print(f"🎬 총 영화 개수: {len(movies)}개")
    
    # [중요] 드라이버 설치를 메인 프로세스에서 미리 수행
    print("🔧 크롬 드라이버 확인 중... (최초 1회)")
    try:
        driver_path = ChromeDriverManager().install()
        print(f"✅ 드라이버 경로 확보: {driver_path}")
    except Exception as e:
        print(f"❌ 드라이버 설치 실패: {e}")
        return

    print(f"🔥 {MAX_WORKERS}개 워커 작업 준비 중 (로그: {LOG_DIR})")

    # 작업 분배 계산
    chunk_size = len(movies) // MAX_WORKERS
    if chunk_size == 0: chunk_size = 1
    
    worker_args = []
    for i in range(MAX_WORKERS):
        start = i * chunk_size
        # 마지막 워커가 남은 것 전부 가져가도록 처리
        end = len(movies) if i == MAX_WORKERS - 1 else start + chunk_size
        
        subset = movies[start:end]
        if not subset: continue # 빈 리스트면 스킵
        
        # [중요] 드라이버 경로를 인자로 함께 전달
        worker_args.append((i, subset, driver_path))
        print(f"   - 워커 {i+1}: {len(subset)}개 영화 할당 ({start} ~ {end-1})")

    print("--------------------------------------------------")
    print("🚦 3초 후 병렬 수집을 시작합니다...")
    time.sleep(3)

    with multiprocessing.Pool(processes=MAX_WORKERS) as pool:
        pool.map(worker_process, worker_args)

    print("\n✅ 모든 작업이 완료되었습니다.")

if __name__ == "__main__":
    multiprocessing.set_start_method('spawn', force=True)
    main()