import Database from '@replit/database';
import type { GameState, PlayerMemory } from './types.js';

const db = new Database();

const KEY = {
  game: (id: string) => `game:${id}`,
  memoryPointer: (address: string) => `memory:${address}`,
  playerGames: (address: string) => `player-games:${address}`,
};

async function dbGet<T>(key: string): Promise<T | null> {
  const result = await db.get(key);
  if (!result.ok) return null;
  return (result.value as T) ?? null;
}

async function dbSet(key: string, value: unknown): Promise<void> {
  await db.set(key, value);
}

export async function saveGame(game: GameState): Promise<void> {
  await dbSet(KEY.game(game.id), game);
  for (const addr of [game.playerOne, game.playerTwo]) {
    if (!addr) continue;
    const raw = await dbGet<string[]>(KEY.playerGames(addr));
    const ids: string[] = Array.isArray(raw) ? raw : [];
    if (!ids.includes(game.id)) {
      ids.push(game.id);
      await dbSet(KEY.playerGames(addr), ids);
    }
  }
}

export async function getGame(id: string): Promise<GameState | null> {
  return dbGet<GameState>(KEY.game(id));
}

export async function getMemoryPointer(address: string): Promise<string | null> {
  return dbGet<string>(KEY.memoryPointer(address));
}

export async function setMemoryPointer(address: string, blobId: string): Promise<void> {
  await dbSet(KEY.memoryPointer(address), blobId);
}

export function defaultMemory(address: string): PlayerMemory {
  return {
    address,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    kickHistory: {},
    diveHistory: {},
    predictions: [],
    notes: '',
  };
}
