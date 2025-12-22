# Cukee Database Setup Guide

## 개요
Cukee 프로젝트의 PostgreSQL 데이터베이스 구축 및 관리 가이드입니다.

**버전**: 1.7
**작성일**: 2025-12-19
**최종 수정**: 2025-12-21 (담당자 DDL 적용)
**데이터베이스**: PostgreSQL 14.20

## 데이터베이스 구조

### 테이블 개수: 22개

#### 사용자 관련 (4개)
- `users` - 사용자 계정 정보
- `sessions` - HttpOnly Cookie 세션 관리 (UUID 기반)
- `email_verifications` - 이메일 인증 코드 관리
- `user_profiles` - 사용자 추가 프로필 정보

#### 영화 관련 (5개)
- `movies` - 영화 메타데이터
- `genres` - 영화 장르
- `movie_genres` - 영화-장르 매핑 (N:N)
- `movie_embeddings` - 영화 임베딩 (AI 추천용, FLOAT8[] 배열)
- `ai_keywords` - AI 추출 키워드

#### 티켓 관련 (3개)
- `ticket_groups` - 영화 추천 티켓 그룹
- `ticket_group_movies` - 티켓-영화 매핑
- `user_ticket_likes` - 사용자 티켓 좋아요

#### 전시회 관련 (9개)
- `exhibitions` - 전시회 메타 정보
- `exhibition_designs` - 전시회 UI/스타일 설정
- `exhibition_movies` - 전시회 영화 정보
- `exhibition_keywords` - 전시회 키워드
- `user_pinned_exhibitions` - 사용자 고정 전시회
- `user_saved_exhibitions` - 사용자 저장 전시회
- `exhibition_shared` - 전시회 공유 기록
- `exhibition_backups` - 전시회 백업 스냅샷
- `exhibition_prompts` - 전시회 프롬프트 히스토리

#### 기타 (1개)
- `bug_reports` - 버그 제보

## 주요 변경 사항 (담당자 DDL 적용)

### 1. 타임스탬프 타입 변경
- **변경 전**: `TIMESTAMP`
- **변경 후**: `TIMESTAMPTZ` (타임존 포함)
- **이유**: AWS 인프라에서 서버-클라이언트 시간 동기화 향상

### 2. UUID 생성 함수 변경
- **변경 전**: `uuid_generate_v4()` (uuid-ossp 확장 필요)
- **변경 후**: `gen_random_uuid()` (PostgreSQL 13+ 내장)
- **이유**: 확장 설치 불필요, 더 간단한 구조

### 3. 자동 업데이트 트리거 추가
- **기능**: `updated_at` 컬럼 자동 갱신
- **적용 테이블**: users, user_profiles, exhibitions, bug_reports
- **트리거 함수**: `update_timestamp_column()`

### 4. 확장 변경
- **추가**: `pgcrypto` (암호화 및 UUID 생성)
- **제거**: `uuid-ossp` (gen_random_uuid 사용으로 불필요)
- **유지**: `pg_trgm` (전문 검색)
- **참고**: `vector` 확장은 PostgreSQL 14에서 미지원 (embedding은 FLOAT8[] 사용)

### 5. 데이터 타입 세부 조정
- `social_provider`: `VARCHAR(50)` → `VARCHAR(20)`
- `email_verifications.code`: `VARCHAR(6)` → `CHAR(6)`
- `movie_embeddings.embedding`: `FLOAT8[768]` (pgvector VECTOR 타입 대신)

## 데이터베이스 설정

### 필요 조건
- PostgreSQL 14.x 이상
- macOS (Homebrew 설치)

### 설치 방법

#### 1. PostgreSQL 설치 (미설치 시)
```bash
brew install postgresql@14
```

#### 2. PostgreSQL 서비스 시작
```bash
brew services start postgresql@14
```

#### 3. 데이터베이스 구축
```bash
cd /path/to/cukee/database
./setup_database.sh
```

### 스크립트 구성

#### 파일 목록
1. `01_create_database.sql` - 데이터베이스 생성, 확장 활성화, 트리거 함수 정의
2. `02_create_tables.sql` - 22개 테이블 생성 및 기본 인덱스
3. `03_create_indexes.sql` - 추가 인덱스 생성
4. `04_insert_initial_data.sql` - 초기 데이터 삽입 (티켓, 장르)
5. `setup_database.sh` - 전체 설정 실행 스크립트

#### 실행 순서
```
Database Creation → Extensions → Trigger Function → Tables → Indexes → Initial Data
```

## 초기 데이터

### 티켓 그룹 (11개)
1. `shortform_mz` - 숏폼 러버 MZ
2. `indie_lover` - 영화덕후의 최애 마이너영화
3. `calm_healing` - 편안하고 잔잔한 감성
4. `dark_masterpiece` - 찝찝한 여운의 우울한 명작
5. `mindless_comedy` - 뇌 빼고도 볼 수 있는 레전드 코미디
6. `action_crime` - 심장 터질 것 같은 액션 범죄
7. `sf_fantasy` - 세계관 과몰입 SF러버
8. `true_story` - 이거 실화야? 실화야.
9. `summer_horror` - 여름에 찰떡인 역대급 호러
10. `romance` - 설레고 싶은 날의 로맨스
11. `animation` - 3D 보단 2D

### 장르 (19개)
액션, 모험, 애니메이션, 코미디, 범죄, 다큐멘터리, 드라마, 가족, 판타지, 역사, 공포, 음악, 미스터리, 로맨스, SF, TV 영화, 스릴러, 전쟁, 서부

## 주요 기능

### 확장 기능 (Extensions)
- `pgcrypto` - 암호화 및 UUID 생성
- `pg_trgm` - 전문 검색 지원 (Trigram)

### 자동 타임스탬프 관리
`updated_at` 컬럼이 있는 테이블은 데이터 변경 시 자동으로 현재 시간으로 갱신됩니다.

**트리거가 적용된 테이블:**
- users
- user_profiles
- exhibitions
- bug_reports

### 인덱스 전략

#### 성능 최적화 인덱스
- `users.email` (UNIQUE)
- `users.nickname`
- `users.social_provider` + `social_id` (복합)
- `sessions.user_id`
- `sessions.expires_at` (만료 세션 정리)
- `ticket_groups.ticket_code` (UNIQUE)
- `exhibitions.user_id`
- `exhibitions.created_at`

#### GIN 인덱스 (전문 검색)
- `ticket_groups.tags` (JSONB 검색)
- `movies.title_ko` (한글 제목 전문 검색)
- `movies.original_title` (원제 전문 검색)
- `exhibitions.title` (전시회 제목 전문 검색)

## 데이터베이스 관리

### 접속
```bash
psql -U doochul -d cukee
```

### 테이블 목록 확인
```sql
\dt
```

### 테이블 구조 확인
```sql
\d table_name
```

### 인덱스 확인
```sql
\di
```

### 트리거 확인
```sql
\dft update_timestamp_column
```

### 데이터 확인
```sql
-- 티켓 그룹 확인
SELECT ticket_code, name, curator_name FROM ticket_groups;

-- 장르 확인
SELECT * FROM genres;

-- 테이블별 레코드 수 확인
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM ticket_groups;
```

### 타임스탬프 확인
```sql
-- users 테이블의 타임스탬프 타입 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('created_at', 'updated_at');
```

## 데이터베이스 재구축

### 완전 재구축
```bash
cd /path/to/cukee/database
./setup_database.sh
```

이 스크립트는 다음 작업을 수행합니다:
1. 기존 `cukee` 데이터베이스 삭제 (있는 경우)
2. 새로운 `cukee` 데이터베이스 생성
3. 확장 활성화 (pgcrypto, pg_trgm)
4. 트리거 함수 생성 (update_timestamp_column)
5. 22개 테이블 생성
6. 인덱스 생성
7. 초기 데이터 삽입

### 수동 재구축
```bash
# 1. 데이터베이스 삭제
psql -U doochul -d postgres -c "DROP DATABASE IF EXISTS cukee;"

# 2. 각 스크립트 순차 실행
psql -U doochul -d postgres -f 01_create_database.sql
psql -U doochul -d cukee -f 02_create_tables.sql
psql -U doochul -d cukee -f 03_create_indexes.sql
psql -U doochul -d cukee -f 04_insert_initial_data.sql
```

## 백업 및 복원

### 백업
```bash
pg_dump -U doochul -d cukee -F c -b -v -f cukee_backup_$(date +%Y%m%d).dump
```

### 복원
```bash
pg_restore -U doochul -d cukee -v cukee_backup.dump
```

## 환경 변수 설정

백엔드 애플리케이션에서 사용할 환경 변수:

```env
# PostgreSQL 연결 정보
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cukee
DB_USER=doochul
DB_PASSWORD=

# 타임존 설정 (TIMESTAMPTZ 사용 시 중요)
TZ=Asia/Seoul
```

## 문제 해결

### PostgreSQL 서비스가 시작되지 않는 경우
```bash
brew services restart postgresql@14
```

### 연결 오류 발생 시
```bash
# PostgreSQL 상태 확인
brew services list | grep postgresql

# 로그 확인
tail -f /opt/homebrew/var/log/postgresql@14.log
```

### 권한 문제
```bash
# 데이터베이스 소유자 확인
psql -U doochul -d postgres -c "\l"

# 테이블 소유자 확인
psql -U doochul -d cukee -c "\dt"
```

### 트리거가 작동하지 않는 경우
```bash
# 트리거 함수 확인
psql -U doochul -d cukee -c "\df update_timestamp_column"

# 특정 테이블의 트리거 확인
psql -U doochul -d cukee -c "\d users"
```

## 성능 최적화 팁

### 1. VACUUM 및 ANALYZE
```sql
-- 정기적으로 실행 권장
VACUUM ANALYZE;

-- 특정 테이블만
VACUUM ANALYZE users;
```

### 2. 만료된 세션 정리
```sql
-- 만료된 세션 삭제 (정기적으로 실행)
DELETE FROM sessions WHERE expires_at < NOW();
```

### 3. 인덱스 재구축
```sql
-- 인덱스 재구축
REINDEX DATABASE cukee;
```

## 참고 문서

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/14/)
- [ERD 다이어그램](../ERD_다이어그램(v1.7).png)
- [JSON 스키마](../JSON_스키마(v1.7).pdf)
- [DB 구축 가이드](../DB_구축.pdf)
- [인수인계서](../인수인계서_2025-12-20.md)

## 버전 히스토리

### v1.7.1 (2025-12-21)
- 담당자 DDL 완전 적용
- TIMESTAMPTZ 타입 적용 (타임존 포함)
- gen_random_uuid() 사용 (uuid-ossp 제거)
- update_timestamp_column 트리거 추가
- pgcrypto 확장 추가
- embedding 타입: FLOAT8[768] (PostgreSQL 14 호환)

### v1.7 (2025-12-19)
- 초기 데이터베이스 구축
- 22개 테이블 생성
- 11개 초기 티켓 데이터
- 19개 장르 데이터
- GIN 인덱스 및 전문 검색 지원
