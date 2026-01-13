-- ================================================
-- Cukee Tables Creation Script
-- Version: 1.7
-- Created: 2025-12-19
-- Updated: 2025-12-21 (담당자 DDL 적용)
-- ================================================

-- ================================================
-- 1. Users (사용자 계정)
-- ================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(20) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    hashed_password TEXT NOT NULL,
    social_provider VARCHAR(20) CHECK (social_provider IN ('kakao', 'email', NULL)),
    social_id TEXT,
    agree_service BOOLEAN NOT NULL,
    agree_privacy BOOLEAN NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_social ON users (social_provider, social_id);
CREATE INDEX idx_users_nickname ON users (nickname);
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- ================================================
-- 2. Sessions (세션 관리)
-- ================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- ================================================
-- 3. EmailVerification (이메일 인증)
-- ================================================
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code CHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_email ON email_verifications (email);
CREATE INDEX idx_email_verifications_expires ON email_verifications (expires_at);

-- ================================================
-- 4. UserProfiles (사용자 프로필)
-- ================================================
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_image TEXT,
    bio VARCHAR(500),
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_user_profiles_modtime BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- ================================================
-- 5. Movies (영화 정보)
-- ================================================
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    title_ko VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NOT NULL,
    poster_path TEXT NOT NULL,
    overview_ko TEXT,
    directors TEXT[],
    release_date_kr DATE,
    certification VARCHAR(50),
    runtime INTEGER,
    vote_count INTEGER,
    vote_average NUMERIC(3, 1) CHECK (vote_average >= 0 AND vote_average <= 10),
    popularity NUMERIC,
    production_countries TEXT[]
);

-- ================================================
-- 6. Genres (장르)
-- ================================================
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- ================================================
-- 7. MovieGenres (영화-장르 매핑)
-- ================================================
CREATE TABLE movie_genres (
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, genre_id)
);

-- ================================================
-- 8. MovieEmbeddings (유사 영화 추천)
-- ================================================
CREATE TABLE movie_embeddings (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    embedding FLOAT8[768],
    model_name VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN movie_embeddings.embedding IS '영화 임베딩 벡터 (768차원) - FLOAT8 배열 사용 (PostgreSQL 14에서 pgvector 미지원)';

-- ================================================
-- 9. AiKeywords (AI가 해석한 의미 키워드)
-- ================================================
CREATE TABLE ai_keywords (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 10. TicketGroups (티켓 그룹)
-- ================================================
CREATE TABLE ticket_groups (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    curator_name VARCHAR(50) NOT NULL,
    curator_message TEXT,
    curator_image_url TEXT,
    image_url TEXT,
    color VARCHAR(20),
    tags JSONB,
    description TEXT,
    width INTEGER,
    height INTEGER
);

-- ================================================
-- 11. TicketGroupMovies (티켓-영화 매핑)
-- ================================================
CREATE TABLE ticket_group_movies (
    id SERIAL PRIMARY KEY,
    ticket_group_id INTEGER NOT NULL REFERENCES ticket_groups(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    score NUMERIC CHECK (score >= 0 AND score <= 1),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ticket_group_id, movie_id)
);

-- ================================================
-- 12. UserTicketLikes (티켓 좋아요)
-- ================================================
CREATE TABLE user_ticket_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_group_id INTEGER NOT NULL REFERENCES ticket_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, ticket_group_id)
);

-- ================================================
-- 13. Exhibitions (전시회)
-- ================================================
CREATE TABLE exhibitions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exhibitions_user ON exhibitions (user_id);
CREATE TRIGGER update_exhibitions_modtime BEFORE UPDATE ON exhibitions
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- ================================================
-- 14. ExhibitionDesigns (전시회 디자인)
-- ================================================
CREATE TABLE exhibition_designs (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER UNIQUE NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    font VARCHAR(50),
    color_scheme VARCHAR(50),
    cukee_style VARCHAR(50),
    frame_style VARCHAR(20) CHECK (frame_style IN ('none', 'frame', NULL)),
    background VARCHAR(100),
    background_image TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 15. ExhibitionMovies (전시회 영화 정보)
-- ================================================
CREATE TABLE exhibition_movies (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    curator_comment TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_removed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 16. ExhibitionKeywords (전시회 키워드)
-- ================================================
CREATE TABLE exhibition_keywords (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    weight NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 17. UserPinnedExhibitions (전시회 고정)
-- ================================================
CREATE TABLE user_pinned_exhibitions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    pinned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, exhibition_id)
);

-- ================================================
-- 18. UserSavedExhibitions (사용자 저장 전시회)
-- ================================================
CREATE TABLE user_saved_exhibitions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, exhibition_id)
);

-- ================================================
-- 19. ExhibitionShared (전시회 공유)
-- ================================================
CREATE TABLE exhibition_shared (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(50),
    shared_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    meta JSONB
);

-- ================================================
-- 20. ExhibitionBackups (전시회 되돌리기)
-- ================================================
CREATE TABLE exhibition_backups (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    title VARCHAR(200),
    curator_comment TEXT,
    prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 21. ExhibitionsPrompts (전시회 프롬프트)
-- ================================================
CREATE TABLE exhibition_prompts (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 22. BugReport (버그 제보)
-- ================================================
CREATE TABLE bug_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_bug_reports_modtime BEFORE UPDATE ON bug_reports
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
