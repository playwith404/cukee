// apps/web/src/data/tickets.ts 
//data: mock데이터 전용 폴더

interface TicketData {
  id: number;
  title: string;
  curatorName: string;
  tags: string[];
  ticketImageUrl: string;
  characterImageUrl: string;
  width: number;
  height: number;
}

export const TICKET_DATA: TicketData[] = [
  { 
    id: 1, 
    title: "MZ style", 
    curatorName: "MZ style", 
    tags: ['하이틴', '로코', '단편', '짧고 굵게'], 
    ticketImageUrl: '/ticket/ticket1.png', 
    characterImageUrl: '/cara/c1.png', 
    width: 295,
    height: 638
  },
  { 
    id: 2, 
    title: "MINOR lover", 
    curatorName: "잔잔한 감성", 
    tags: ['높은 별점', '낮은 관람객', '마이너'], 
    ticketImageUrl: '/ticket/ticket2.png',
    characterImageUrl: '/cara/c1.png', 
    width: 295,
    height: 638
  },
  { 
    id: 3, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket3.png',
    characterImageUrl: '/cara/c1.png', 
    width: 295,
    height: 638
  },
];