// 1. 디자인 설정 정보
export interface ExhibitionDesign {
  font: string;
  colorScheme: string;
  layoutType: string;
  frameStyle: string;
  background: string;
  backgroundImage: string; 
}

// 2. 전시회에 포함된 영화 정보
export interface ExhibitionMovie {
  id: number;           // 전시회 내부 관리용 ID (PK)
  movieId: number;      // 실제 영화 고유 ID
  title: string;
  posterUrl: string;    
  displayOrder: number; // 전시 순서
  isPinned: boolean;    // 고정 여부 (핀)
  curatorComment: string;
}

// 3. 키워드 정보
export interface ExhibitionKeyword {
  keyword: string;
  weight: number; // float는 JS/TS에서 number로 처리
}

// 4. [메인] 전시회 상세 응답 전체 구조
export interface ExhibitionDetailResponse {
  id: number;
  userId: number;
  title: string;
  isPublic: boolean;
  
  // 중첩된 객체들
  design: ExhibitionDesign;
  movies: ExhibitionMovie[];
  keywords: ExhibitionKeyword[];
  
  createdAt: string; // ISO 8601 날짜 문자열
  updatedAt: string;
}