const BASE = '/api';

export type Zone = 'TL' | 'TR' | 'BL' | 'BR' | 'C';
export type GameMode = 'vs-friend' | 'vs-agent';

export interface GameState {
  id: string;
  mode: GameMode;
  playerOne: string;
  playerTwo: string | null;
  stakeAmount: number;
  suiGameId: string | null;
  status: string;
  picksOne: { kicks: Zone[]; dives: Zone[] } | null;
  picksTwo: { kicks: Zone[]; dives: Zone[] } | null;
  rounds: { kick: Zone; dive: Zone; goal: boolean }[] | null;
  winner: string | null;
  createdAt: number;
}

export interface PlayerMemory {
  address: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  kickHistory: Partial<Record<Zone, number>>;
  diveHistory: Partial<Record<Zone, number>>;
  predictions: { match: string; pick: string; result: string; stake: number }[];
  notes: string;
}

export interface Match {
  id: string;
  teams: string;
  teamA: string;
  teamB: string;
  date: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error: string }).error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  createGame: (body: { playerOne: string; stakeAmount: number; mode: GameMode; suiGameId?: string }) =>
    req<GameState>('/games', { method: 'POST', body: JSON.stringify(body) }),

  getGame: (id: string) => req<GameState>(`/games/${id}`),

  joinGame: (id: string, body: { playerTwo: string; suiGameId?: string }) =>
    req<GameState>(`/games/${id}/join`, { method: 'POST', body: JSON.stringify(body) }),

  submitPicks: (id: string, body: { player: string; kicks: Zone[]; dives: Zone[] }) =>
    req<{ game: GameState; waiting: boolean }>(`/games/${id}/picks`, { method: 'POST', body: JSON.stringify(body) }),

  getMemory: (address: string) =>
    req<{ memory: PlayerMemory; blobId: string | null; aggregatorUrl: string | null }>(`/memory/${address}`),

  updateMemoryRecord: (address: string, body: { outcome: 'win' | 'loss'; kickZones?: string[]; diveZones?: string[] }) =>
    req<{ memory: PlayerMemory; blobId: string; aggregatorUrl: string }>(`/memory/${address}/record`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getCommentary: (address: string, context: string) =>
    req<{ line: string }>('/agent/commentary', { method: 'POST', body: JSON.stringify({ address, context }) }),

  getMatches: () => req<Match[]>('/matches'),
};
