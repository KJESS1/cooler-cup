export interface WorldCupMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  date: string;
}

export const WORLD_CUP_MATCHES: WorldCupMatch[] = [
  { id: 'wc1', teamAId: 'argentina', teamBId: 'brazil', date: 'Jun 20' },
  { id: 'wc2', teamAId: 'france', teamBId: 'germany', date: 'Jun 21' },
  { id: 'wc3', teamAId: 'england', teamBId: 'spain', date: 'Jun 22' },
  { id: 'wc4', teamAId: 'portugal', teamBId: 'netherlands', date: 'Jun 23' },
];