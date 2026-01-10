// apps/web/src/apis/exhibition.ts

import api from './index';

// =============================================================================
// [Type] 공통 / 서브 타입 (디자인, 영화, 키워드)
// =============================================================================

export interface ExhibitionDesign {
  font: string;
  colorScheme: string;
  cukeeStyle: string;
  frameStyle: string;
  background: string;
  backgroundImage: string;
}

export interface ExhibitionMovie {
  id: number;           // 전시회 내부 관리용 ID
  movieId: number;      // 실제 영화 ID
  title: string;
  posterUrl: string;
  displayOrder: number;
  isPinned: boolean;
  curatorComment: string;
}

export interface ExhibitionKeyword {
  keyword: string;
  weight: number;
}

// =============================================================================
// [Type] 전시회 (Exhibition) 관련 인터페이스
// =============================================================================

// 1. 전시회 목록 조회용 (간략 정보)
export interface Exhibition {
  id: number;
  ticketId: number;
  title: string;
  curator: string;      // 큐레이터 이름
  curatorMsg: string;   // 큐레이터 한마디
  likes: number;
  imageUrl: string;     // 대표 이미지

  // 선택적 속성 (UI 상황에 따라 필요)
  tags?: string[];
  color?: string;
  width?: number;
  height?: number;
}

// 2. 전시회 목록 응답
export interface ExhibitionListResponse {
  data: Exhibition[];
  total: number;
  page: number;
  limit: number;
}

// 3. 전시회 상세 조회용 (전체 정보)
export interface ExhibitionDetailResponse {
  id: number;
  userId: number;
  title: string;
  isPublic: boolean;

  // 상세 중첩 객체
  design: ExhibitionDesign;
  movies: ExhibitionMovie[];
  keywords: ExhibitionKeyword[];

  createdAt: string;
  updatedAt: string;
}

// 전시회 꾸미기 
export type FrameStyle = 'none' | 'frame'
export type bgStyle = 'white' | 'pink' | 'orange' | 'pattern' | 'image'
export type CukeeStyle = 'line' | 'none' | 'vintage'

export interface ExhibitionStyle {
  frame: FrameStyle
  background: bgStyle
  cukee: CukeeStyle
}

// =============================================================================
// [Type] 티켓 (Ticket) 관련 인터페이스
// =============================================================================

export interface Ticket {
  id: number;
  title: string;
  curatorName: string;
  tags: string[];
  ticketImageUrl: string;
  characterImageUrl: string | null;
  width: number;
  height: number;
  ticketCode: string; // 예: 'shortform_mz'
  curatorMessage: string | null;
  color: string | null;
  description: string | null;
  likeCount: number;
  isLiked: boolean;
}

export interface TicketListResponse {
  data: Ticket[];
  total: number;
}

export type TicketDetailResponse = Ticket;

// =============================================================================
// [API Functions] 전시회
// =============================================================================

/**
 * 전시회 목록 조회
 * GET /exhibitions
 */
export const getExhibitions = async (page = 1, limit = 20): Promise<ExhibitionListResponse> => {
  const response = await api.get<ExhibitionListResponse>('/exhibitions', {
    params: { page, limit },
  });
  return response.data;
};

/**
 * 전시회 상세 조회
 * GET /exhibitions/{id}
 */
export const getExhibitionDetail = async (id: number): Promise<ExhibitionDetailResponse> => {
  const response = await api.get<ExhibitionDetailResponse>(`/exhibitions/${id}`);
  return response.data;
};

/**
 * 전시회 생성
 * POST /exhibitions_new
 */
export interface CreateExhibitionRequest {
  title: string;
  isPublic?: boolean;
  movies?: Array<{
    movieId: number;
    displayOrder: number;
    isPinned?: boolean;
  }>;
}

export interface CreateExhibitionResponse {
  id: number;
  userId: number;
  title: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createExhibition = async (
  data: CreateExhibitionRequest
): Promise<CreateExhibitionResponse> => {
  const response = await api.post<CreateExhibitionResponse>('/exhibitions', data);
  return response.data;
};

/**
 * 내 전시회 목록 조회 (user_id 필터링)
 * GET /exhibitions?user_id={current_user}
 */
export const getMyExhibitions = async (page = 1, limit = 20): Promise<ExhibitionListResponse> => {
  // user_id는 백엔드에서 인증 토큰으로 자동 판별하므로 따로 전달 안 함
  const response = await api.get<ExhibitionListResponse>('/exhibitions', {
    params: { page, limit },
  });
  return response.data;
};

// 전시회 상세 조회
export const getExhibitionById = async (exhibitionId: number) => {
  const response = await api.get(`/exhibitions/${exhibitionId}`);
  return response.data;
};

/**
 * 전시회 수정
 * PUT /exhibitions/{id}
 */
export interface UpdateExhibitionRequest {
  title?: string;
  isPublic?: boolean;
}

export const updateExhibition = async (
  exhibitionId: number,
  data: UpdateExhibitionRequest
): Promise<CreateExhibitionResponse> => {
  const response = await api.put<CreateExhibitionResponse>(`/exhibitions/${exhibitionId}`, data);
  return response.data;
};

/**
 * 전시회 삭제
 * DELETE /exhibitions/{id}
 */
export const deleteExhibition = async (exhibitionId: number): Promise<void> => {
  await api.delete(`/exhibitions/${exhibitionId}`);
};

// =============================================================================
// [API Functions] 티켓
// =============================================================================

/**
 * 티켓 전체 목록 조회
 * GET /tickets
 */
export const fetchTickets = async (): Promise<TicketListResponse> => {
  const response = await api.get<TicketListResponse>('/tickets');
  return response.data;
};

/**
 * 티켓 상세 조회
 * GET /tickets/{ticket_code}
 */
export const fetchTicketDetail = async (ticketCode: string): Promise<TicketDetailResponse> => {
  const response = await api.get<TicketDetailResponse>(`/tickets/${ticketCode}`);
  return response.data;
};

/**
 * 티켓 좋아요 토글
 * POST /tickets/{ticket_id}/like
 */
export interface ToggleLikeResponse {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
}

export const toggleTicketLike = async (ticketId: number): Promise<ToggleLikeResponse> => {
  const response = await api.post<ToggleLikeResponse>(`/tickets/${ticketId}/like`);
  return response.data;
};
