import api from '../../app/lib/api';
// 티켓 정보 인터페이스


//전시회 목록
export interface ExhibitionListResponse {
  data: Exhibition[];
  total: number;
  page: number;
  limit: number;
}

//티켓 정보
export interface Exhibition {
  id: number;           // 전시회 고유 ID
  ticketId: number;     // 티켓 ID (좋아요 API 호출 시 사용됨: ticket_group_id 대응)
  title: string;        // 티켓 이름 (기존 name)
  curator: string;      // 큐레이터 이름 (기존 curatorName)
  curatorMsg: string;   // 큐레이터 메시지 (기존 curatorMessage)
  likes: number;        // 좋아요 총 개수
  imageUrl: string;     // 티켓 이미지 URL
  
  // 요청보낼땐 안씀
  tags?: string[];
  color?: string;

  //일단보류: 나중에 로직구체화해서 애니메이션 구현
  width?: number;
  height?: number;

  // 추후 추가 예정 또는 UI용 필드
  //characterImageUrl?: string | null; 
  // 큐키 이미지 (추후 추가)
}

///좋아요 api 응답
export interface TicketLikeResponse {
  liked: boolean;
  totalLikes: number;
}


// API 요청 함수

/**
 * [홈 화면] 전시회(티켓) 목록 조회
 * GET /exhibitions
 * @param page 페이지 번호 (default: 1)
 * @param limit 페이지 당 개수 (default: 20)
 */
export const getExhibitions = async (page = 1, limit = 20): Promise<ExhibitionListResponse> => {
  // params 객체를 사용하면 axios가 자동으로 쿼리스트링(?page=1&limit=20)을 만들어줍니다.
  const response = await api.get<ExhibitionListResponse>('/exhibitions', {
    params: { page, limit },
  });
  return response.data;
};

