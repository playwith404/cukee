/**
 * 티켓 API
 */
import api from '../../app/lib/api';

// 티켓 정보 인터페이스
export interface Ticket {
  id: number;
  title: string;
  curatorName: string;
  tags: string[];
  ticketImageUrl: string;
  characterImageUrl: string | null;
  width: number;
  height: number;
  ticketCode: string;
  curatorMessage: string | null;
  color: string | null;
  description: string | null;
}

// 티켓 목록 응답
export interface TicketListResponse {
  data: Ticket[];
  total: number;
}

// 티켓 상세 응답
export type TicketDetailResponse = Ticket;

/**
 * 티켓 목록 조회
 * GET /tickets
 */
export const fetchTickets = async (): Promise<TicketListResponse> => {
  const response = await api.get<TicketListResponse>('/tickets');
  return response.data;
};

/**
 * 티켓 상세 조회
 * GET /tickets/{ticket_code}
 * @param ticketCode 티켓 코드 (예: 'shortform_mz')
 */
export const fetchTicketDetail = async (ticketCode: string): Promise<TicketDetailResponse> => {
  const response = await api.get<TicketDetailResponse>(`/tickets/${ticketCode}`);
  return response.data;
};
