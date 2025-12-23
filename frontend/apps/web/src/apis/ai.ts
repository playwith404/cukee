// apps/web/src/apis/ai.ts

// 1. 요청 (Request)
export interface AIExhibitionRequest {
  prompt: string;
  ticketId: number; // integer
}

// 2. 내부 상세 데이터 (Response 내부)
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
  posterUrl?: string; // 포스터 URL이 제공될 수 있음
}

// 3. 응답 (Response)
export interface AIExhibitionResponse {
  resultJson: {
    title: string;
    design: ExhibitionDesign;
    movies: RecommendedMovie[];
    keywords: string[];
  };
}