export type Zone = 'TL' | 'TR' | 'BL' | 'BR' | 'C';

export interface PlayerMemory {
  address: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  kickHistory: Partial<Record<Zone, number>>;
  diveHistory: Partial<Record<Zone, number>>;
  predictions: Array<{
    match: string;
    pick: string;
    result: 'win' | 'loss' | 'pending';
    stake: number;
  }>;
  notes: string;
}

export interface GameRound {
  kick: Zone;
  dive: Zone;
  goal: boolean;
}

export interface PlayerPicks {
  kicks: Zone[];
  dives: Zone[];
}

export type GameMode = 'vs-friend' | 'vs-agent';
export type GameStatus = 'waiting' | 'joined' | 'picks-p1' | 'picks-p2' | 'picks-both' | 'resolved';

export interface GameState {
  id: string;
  mode: GameMode;
  playerOne: string;
  playerTwo: string | null;
  stakeAmount: number;
  suiGameId: string | null;
  status: GameStatus;
  picksOne: PlayerPicks | null;
  picksTwo: PlayerPicks | null;
  rounds: GameRound[] | null;
  winner: string | null;
  createdAt: number;
}

export interface Match {
  id: string;
  teams: string;
  date: string;
  teamA: string;
  teamB: string;
}
