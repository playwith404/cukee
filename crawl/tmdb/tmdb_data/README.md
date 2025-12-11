# tmdb_movie_list_full_v2_ex.jsonl README

본 문서는 **`tmdb_movie_list_full_v2_ex.jsonl` 대한 설명
---

## 데이터 형식
- 형식: **JSON Lines (.jsonl)**
- 1 line = 1 movie
- UTF-8 인코딩
- 각 라인은 독립적인 JSON Object

---

## 필드 목록 및 설명

### 식별자

| 필드명 | 타입 | 설명 |
|------|------|------|
| `tmdb_id` | int | TMDB 영화 고유 ID |
| `imdb_id` | string \| null | IMDb ID |

---

### 제목 / 언어

| 필드명 | 타입 | 설명 |
|------|------|------|
| `title_ko` | string | 한국어 제목 |
| `original_title` | string | 원제 |

---

### 개봉 정보

| 필드명 | 타입 | 설명 |
|------|------|------|
| `release_date_global` | string \| null | 글로벌 개봉일 (YYYY-MM-DD) |
| `release_date_kr` | string \| null | 한국 개봉일 (YYYY-MM-DD) |
| `runtime` | int \| null | 상영 시간 (분) |
| `certification` | string \| null | 관람 등급 |

---

### 장르 / 키워드

| 필드명 | 타입 | 설명 |
|------|------|------|
| `genres` | array[string] | 장르 이름 리스트 |
| `keywords` | array[string] | 키워드 리스트 |

---

### 줄거리 (텍스트 핵심 필드)

| 필드명 | 타입 | 설명 |
|------|------|------|
| `overview_ko` | string | 한국어 줄거리 |
| `overview_en` | string | 영어 줄거리 |

---

### 제작 / 인물

| 필드명 | 타입 | 설명 |
|------|------|------|
| `directors` | array[string] | 감독 이름 목록 |
| `production_countries` | array[string] | 제작 국가 |

---

### 평점 / 인기도

| 필드명 | 타입 | 설명 |
|------|------|------|
| `vote_average` | float | 평균 평점 |
| `vote_count` | int | 투표 수 |
| `popularity` | float | TMDB 인기 지수 |

---

### 수익 / 제작비

| 필드명 | 타입 | 설명 |
|------|------|------|
| `budget` | int \| null | 제작비 |
| `revenue` | int \| null | 흥행 수익 |

---

### 미디어 리소스

| 필드명 | 타입 | 설명 |
|------|------|------|
| `poster_path` | string \| null | 포스터 이미지 경로 |
| `backdrop_path` | string \| null | 배경 이미지 경로 |

---

## 주의 사항

- 일부 필드는 null 값을 가질 수 있음
---

