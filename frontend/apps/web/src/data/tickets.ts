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
    width: 417,
    height: 662
  },
  { 
    id: 2, 
    title: "MINOR lover", 
    curatorName: "잔잔한 감성", 
    tags: ['높은 별점', '낮은 관람객', '마이너'], 
    ticketImageUrl: '/ticket/ticket2.png',
    characterImageUrl: '/cara/c2.png', 
    width: 417,
    height: 662
  },
  { 
    id: 3, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket3.png',
    characterImageUrl: '/cara/c3.png', 
    width: 417,
    height: 662
  },
  { 
    id: 4, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket4.png',
    characterImageUrl: '/cara/c4.png', 
    width: 417,
    height: 662
  },
  { 
    id: 5, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket5.png',
    characterImageUrl: '/cara/c5.png', 
    width: 417,
    height: 662
  },
  { 
    id: 6, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket6.png',
    characterImageUrl: '/cara/c6.png', 
    width: 417,
    height: 662
  },
  { 
    id: 7, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket7.png',
    characterImageUrl: '/cara/c7.png', 
    width: 417,
    height: 662
  },
  { 
    id: 8, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket8.png',
    characterImageUrl: '/cara/c8.png', 
    width: 417,
    height: 662
  },
  { 
    id: 9, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket9.png',
    characterImageUrl: '/cara/c9.png', 
    width: 417,
    height: 662
  },
  { 
    id: 10, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket10.png',
    characterImageUrl: '/cara/c10.png', 
    width: 417,
    height: 662
  },
  { 
    id: 11, 
    title: "잔잔 감성", 
    curatorName: "잔잔 감성", 
    tags: ['성장','일상','힐링','드라마'], 
    ticketImageUrl: '/ticket/ticket11.png',
    characterImageUrl: '/cara/c11.png', 
    width: 417,
    height: 662
  }

];