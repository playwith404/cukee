import os
import time
import json
import requests
import argparse
import threading
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# ==========================================
# [설정] API KEY 입력
# ==========================================
API_KEY = "8cdc569b60be2b6d830fda29aea61232"

# 경로 설정
OUTPUT_DIR = "tmdb_data"
OUTPUT_FILE = "tmdb_movie_list_full.jsonl" # 파일명 (구분용)
LOG_FILE = "crawler_status.log"

TMDB_BASE_URL = "https://api.themoviedb.org/3"

# 병렬 처리 설정
MAX_WORKERS = 8       
SLEEP_INTERVAL = 0.5 

# 파일 쓰기 충돌 방지용 Lock
file_lock = threading.Lock()

# -------------------------
# 0. 로깅(Logging) 설정
# -------------------------
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 기존 핸들러 제거 (중복 방지)
if logger.hasHandlers():
    logger.handlers.clear()

file_handler = logging.FileHandler(os.path.join(OUTPUT_DIR, LOG_FILE), encoding='utf-8')
file_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s'))
logger.addHandler(file_handler)

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s'))
logger.addHandler(stream_handler)


# -------------------------
# 1. 상세 정보 가져오기
# -------------------------
def fetch_movie_detail(tmdb_id: int) -> dict | None:
    params = {
        "api_key": API_KEY,
        "language": "ko-KR", 
        "append_to_response": "keywords,release_dates,credits,translations"
    }
    
    result = None

    try:
        response = requests.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}",
            params=params,
            timeout=15
        )
        if response.status_code == 429:
            logger.warning(f"Rate Limit 429! (ID: {tmdb_id}) - 잠시 대기")
            time.sleep(2)
            return None
            
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        # --- 데이터 파싱 ---
        
        # 1. 줄거리 (KO -> EN fallback)
        overview_ko = data.get("overview", "")
        overview_en = ""
        translations = data.get("translations", {}).get("translations", [])
        for t in translations:
            if t.get("iso_639_1") == "en":
                overview_en = t.get("data", {}).get("overview", "")
                break
        if not overview_en and data.get("original_language") == "en":
            if not overview_ko: overview_en = data.get("overview", "")

        # 2. 감독
        directors = []
        if 'credits' in data and 'crew' in data['credits']:
            directors = [m['name'] for m in data['credits']['crew'] if m['job'] == 'Director']
        
        # 3. 한국 개봉일 및 관람등급
        release_date_kr = None
        certification_kr = ""
        release_dates_results = data.get("release_dates", {}).get("results", [])
        for entry in release_dates_results:
            if entry.get("iso_3166_1") == "KR":
                for rd in entry.get("release_dates", []):
                    if rd.get("certification"): certification_kr = rd.get("certification")
                    if rd.get("type") == 3: release_date_kr = rd.get("release_date", "").split("T")[0]
                if not release_date_kr and entry.get("release_dates"):
                    release_date_kr = entry.get("release_dates")[0].get("release_date", "").split("T")[0]
                break

        # 4. 키워드/장르/국가
        keywords_list = data.get("keywords", {}).get("keywords", [])
        keywords = "|".join(k.get("name", "") for k in keywords_list)
        genres = "|".join(g["name"] for g in data.get("genres", []))
        production_countries = "|".join(c["name"] for c in data.get("production_countries", []))

        # --- 최종 결과 딕셔너리 ---
        result = {
            "tmdb_id": data.get("id"),
            "imdb_id": data.get("imdb_id"),
            "title_ko": data.get("title"), 
            "original_title": data.get("original_title"),
            
            # [이미지 경로 추가]
            "poster_path": data.get("poster_path"),     # 포스터 (예: /abc.jpg)
            "backdrop_path": data.get("backdrop_path"), # 배경 (예: /xyz.jpg)

            # 줄거리
            "overview_ko": overview_ko,
            "overview_en": overview_en,
            
            # 인물/날짜
            "directors": directors, 
            "release_date_kr": release_date_kr,         
            "release_date_global": data.get("release_date"), 
            
            # 재정
            "budget": data.get("budget", 0),
            "revenue": data.get("revenue", 0),
            
            # 기타 메타데이터
            "certification": certification_kr,
            "genres": genres,
            "runtime": data.get("runtime"),
            "vote_count": data.get("vote_count"),
            "vote_average": data.get("vote_average"),
            "popularity": data.get("popularity"),
            "production_countries": production_countries,
            "keywords": keywords
        }

    except Exception as e:
        return None
    
    finally:
        time.sleep(SLEEP_INTERVAL)

    return result

# -------------------------
# 2. 영화 탐색 (Discover) + 병렬 처리
# -------------------------
def discover_and_fetch(start_year, end_year):
    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)
    
    with open(output_path, "a", encoding="utf-8") as f:
        
        for year in range(start_year, end_year + 1):
            logger.info(f"=== {year}년도 영화 탐색 시작 ===")
            
            page = 1
            while True:
                discover_url = f"{TMDB_BASE_URL}/discover/movie"
                params = {
                    "api_key": API_KEY,
                    "language": "ko-KR",
                    "sort_by": "popularity.desc",
                    "include_adult": "false",
                    "include_video": "false",
                    "page": page,
                    "primary_release_year": year,
                    "vote_count.gte": 5 
                }

                try:
                    resp = requests.get(discover_url, params=params, timeout=10)
                    if resp.status_code != 200:
                        logger.error(f"Discover API 오류: {resp.status_code}")
                        break
                    
                    data = resp.json()
                    results = data.get("results", [])
                    total_pages = data.get("total_pages", 0)

                    if not results:
                        break

                    logger.info(f"{year}년 | Page {page}/{total_pages} ({len(results)}개) -> 병렬 수집 중...")

                    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                        future_to_id = {executor.submit(fetch_movie_detail, m['id']): m['id'] for m in results}
                        
                        count_in_page = 0
                        for future in as_completed(future_to_id):
                            try:
                                detail_data = future.result()
                                if detail_data:
                                    with file_lock:
                                        f.write(json.dumps(detail_data, ensure_ascii=False) + "\n")
                                    count_in_page += 1
                            except Exception as exc:
                                logger.warning(f"상세정보 수집 실패: {exc}")

                    page += 1
                    if page > total_pages or page > 500:
                        break
                        
                except Exception as e:
                    logger.critical(f"치명적 오류 발생: {e}")
                    time.sleep(5)

    logger.info("모든 작업이 완료되었습니다.")

# -------------------------
# 메인 실행
# -------------------------
if __name__ == "__main__":
    start_year = 1995
    end_year = 2025
    
    logger.info(f"크롤러 시작: {start_year}~{end_year} (Workers: {MAX_WORKERS})")
    discover_and_fetch(start_year, end_year)