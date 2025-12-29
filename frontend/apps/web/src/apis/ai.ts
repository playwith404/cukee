// ==========================================
// 1. 타입 정의 (Types)
// ==========================================

import api from './index';

// 요청 (Request)
export interface AIExhibitionRequest {
  prompt: string;
  ticketId: number;
}

// 내부 상세 데이터
export interface ExhibitionDesign {
  font: string;
  colorScheme: string;
  layoutType: string;
  frameStyle: string;
  background: string;
  backgroundImage: string;
}

export interface RecommendedMovie {
  movieId: number;
  curatorComment: string;
  posterUrl?: string;
}

// 응답 (Response)
export interface AIExhibitionResponse {
  resultJson: {
    title: string;
    design: ExhibitionDesign;
    movies: RecommendedMovie[];
    keywords: string[];
  };
}

// 큐레이션 영화 응답 타입
export interface CurateMoviesResponse {
  ticketId: number;
  movies: {
    movieId: number;
    title: string;
    posterUrl: string;
  }[];
}

// ==========================================
// 2. API 호출 함수 (Service Logic)
// ==========================================

/**
 * 티켓 ID로 영화 목록 조회 (빠른 조회)
 * nginx 프록시 경로: /api/ai/curate-movies -> /api/v1/ai/curate-movies
 */
export const curateMovies = async (
  ticketId: number,
  limit: number = 5
): Promise<CurateMoviesResponse> => {
  const response = await api.post<CurateMoviesResponse>('/ai/curate-movies', {
    ticketId,
    limit,
  });
  return response.data;
};

/**
 * AI 전시회 생성
 * nginx 프록시 경로: /api/ai/generate -> /api/v1/ai/generate
 */
export const generateExhibition = async (
  prompt: string,
  ticketId: number
): Promise<AIExhibitionResponse> => {
  const response = await api.post<AIExhibitionResponse>('/ai/generate', {
    prompt,
    ticketId,
  });
  return response.data;
};
