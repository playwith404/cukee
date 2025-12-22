-- ================================================
-- Cukee Database Creation Script
-- Version: 1.7
-- Created: 2025-12-19
-- Updated: 2025-12-21 (담당자 DDL 적용)
-- ================================================

-- 데이터베이스 생성
DROP DATABASE IF EXISTS cukee;
CREATE DATABASE cukee
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 데이터베이스 연결
\c cukee

-- 필수 확장(Extension) 설치
-- UUID 및 암호화용
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 전문 검색용 (Trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 참고: pgvector 확장은 PostgreSQL 14에서 사용 불가
-- embedding 컬럼은 FLOAT8[] 배열로 대체

-- 자동 업데이트 트리거 함수 생성
-- updated_at 컬럼이 있는 테이블의 데이터가 변경될 때 현재 시간을 자동으로 입력
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
