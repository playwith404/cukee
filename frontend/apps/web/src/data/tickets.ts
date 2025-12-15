// apps/web/src/data/tickets.ts 

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
    ticketImageUrl: '/ticket/t1.png', 
    characterImageUrl: '/cara/c1.png', 
    width: 356,
    height: 638
  },
  { 
    id: 2, 
    title: "잔잔한 감성", 
    curatorName: "잔잔한 감성", 
    tags: ['성장', '힐링', '일상', '드라마'], 
    ticketImageUrl: '/ticket/t2.png',
    characterImageUrl: '/cara/c1.png', 
    width: 295,
    height: 638
  },
  { 
    id: 3, 
    title: "MINOR lover", 
    curatorName: "MINOR lover", 
    tags: ['높은 별점', '낮은 관람객', '마이너'], 
    ticketImageUrl: '/ticket/t3.png',
    characterImageUrl: '/cara/c1.png', 
    width: 399,
    height: 652
  },
];