-- ================================================
-- Cukee Indexes Creation Script
-- Version: 1.7
-- Created: 2025-12-19
-- ================================================

-- ================================================
-- Users 테이블 인덱스
-- ================================================
CREATE UNIQUE INDEX idx_users_email ON users(email);
-- idx_users_social, idx_users_nickname는 02_create_tables.sql에서 생성됨

-- ================================================
-- Sessions 테이블 인덱스
-- ================================================
-- idx_sessions_user, idx_sessions_expires는 02_create_tables.sql에서 생성됨

COMMENT ON INDEX idx_sessions_expires IS '만료된 세션 정리용';

-- ================================================
-- EmailVerification 테이블 인덱스
-- ================================================
-- idx_email_verifications_email, idx_email_verifications_expires는 02_create_tables.sql에서 생성됨

-- ================================================
-- UserProfiles 테이블 인덱스
-- ================================================
CREATE UNIQUE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- ================================================
-- Movies 테이블 인덱스
-- ================================================
CREATE UNIQUE INDEX idx_movies_tmdb ON movies(tmdb_id);
CREATE INDEX idx_movies_title_ko_trgm ON movies USING gin(title_ko gin_trgm_ops);
CREATE INDEX idx_movies_original_title_trgm ON movies USING gin(original_title gin_trgm_ops);

COMMENT ON INDEX idx_movies_title_ko_trgm IS '한글 제목 전문 검색용 GIN 인덱스';
COMMENT ON INDEX idx_movies_original_title_trgm IS '원제 전문 검색용 GIN 인덱스';

-- ================================================
-- MovieGenres 테이블 인덱스
-- ================================================
CREATE INDEX idx_movie_genres_movie ON movie_genres(movie_id);
CREATE INDEX idx_movie_genres_genre ON movie_genres(genre_id);

-- ================================================
-- MovieEmbeddings 테이블 인덱스
-- ================================================
CREATE UNIQUE INDEX idx_movie_embeddings_movie ON movie_embeddings(movie_id);

-- ================================================
-- AiKeywords 테이블 인덱스
-- ================================================
CREATE INDEX idx_ai_keywords_movie ON ai_keywords(movie_id);
CREATE INDEX idx_ai_keywords_keyword ON ai_keywords(keyword);

-- ================================================
-- TicketGroups 테이블 인덱스
-- ================================================
CREATE UNIQUE INDEX idx_ticket_groups_code ON ticket_groups(ticket_code);
CREATE INDEX idx_ticket_groups_tags ON ticket_groups USING gin(tags);

COMMENT ON INDEX idx_ticket_groups_tags IS 'JSONB 태그 검색용 GIN 인덱스';

-- ================================================
-- TicketGroupMovies 테이블 인덱스
-- ================================================
CREATE INDEX idx_ticket_group_movies_ticket ON ticket_group_movies(ticket_group_id);
CREATE INDEX idx_ticket_group_movies_movie ON ticket_group_movies(movie_id);

-- ================================================
-- UserTicketLikes 테이블 인덱스
-- ================================================
CREATE INDEX idx_user_ticket_likes_user ON user_ticket_likes(user_id);
CREATE INDEX idx_user_ticket_likes_ticket ON user_ticket_likes(ticket_group_id);

-- ================================================
-- Exhibitions 테이블 인덱스
-- ================================================
-- idx_exhibitions_user는 02_create_tables.sql에서 생성됨
CREATE INDEX idx_exhibitions_public ON exhibitions(is_public);
CREATE INDEX idx_exhibitions_created ON exhibitions(created_at);
CREATE INDEX idx_exhibitions_title_trgm ON exhibitions USING gin(title gin_trgm_ops);

COMMENT ON INDEX idx_exhibitions_title_trgm IS '전시회 제목 전문 검색용 GIN 인덱스';

-- ================================================
-- ExhibitionDesigns 테이블 인덱스
-- ================================================
CREATE UNIQUE INDEX idx_exhibition_designs_exhibition ON exhibition_designs(exhibition_id);

-- ================================================
-- ExhibitionMovies 테이블 인덱스
-- ================================================
CREATE INDEX idx_exhibition_movies_exhibition ON exhibition_movies(exhibition_id);
CREATE INDEX idx_exhibition_movies_movie ON exhibition_movies(movie_id);

-- ================================================
-- ExhibitionKeywords 테이블 인덱스
-- ================================================
CREATE INDEX idx_exhibition_keywords_exhibition ON exhibition_keywords(exhibition_id);
CREATE INDEX idx_exhibition_keywords_keyword ON exhibition_keywords(keyword);

-- ================================================
-- UserPinnedExhibitions 테이블 인덱스
-- ================================================
CREATE INDEX idx_user_pinned_exhibitions_user ON user_pinned_exhibitions(user_id);

-- ================================================
-- UserSavedExhibitions 테이블 인덱스
-- ================================================
CREATE INDEX idx_user_saved_exhibitions_user ON user_saved_exhibitions(user_id);
CREATE INDEX idx_user_saved_exhibitions_exhibition ON user_saved_exhibitions(exhibition_id);

-- ================================================
-- ExhibitionShared 테이블 인덱스
-- ================================================
CREATE INDEX idx_exhibition_shared_exhibition ON exhibition_shared(exhibition_id);
CREATE INDEX idx_exhibition_shared_user ON exhibition_shared(user_id);
CREATE INDEX idx_exhibition_shared_platform ON exhibition_shared(platform);

-- ================================================
-- ExhibitionBackups 테이블 인덱스
-- ================================================
CREATE INDEX idx_exhibition_backups_exhibition ON exhibition_backups(exhibition_id);
CREATE INDEX idx_exhibition_backups_created_at ON exhibition_backups(created_at);

-- ================================================
-- ExhibitionPrompts 테이블 인덱스
-- ================================================
CREATE INDEX idx_exhibition_prompts_exhibition ON exhibition_prompts(exhibition_id);
CREATE INDEX idx_exhibition_prompts_user ON exhibition_prompts(user_id);
CREATE INDEX idx_exhibition_prompts_exhibition_version ON exhibition_prompts(exhibition_id, version);

-- ================================================
-- BugReports 테이블 인덱스
-- ================================================
CREATE INDEX idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
