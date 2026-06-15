import { Router } from 'express';
import { randomUUID } from 'crypto';
import { saveGame, getGame } from '../lib/store.js';
import { resolveGame, houseJoinGame } from '../lib/sui.js';
import { agentDiveChoice, agentKickChoice } from '../lib/agent.js';
import type { GameState, PlayerPicks, Zone, GameRound } from '../lib/types.js';

const router = Router();

function computeRounds(picksOne: PlayerPicks, picksTwo: PlayerPicks): GameRound[] {
  const rounds: GameRound[] = [];
  for (let i = 0; i < 5; i++) {
    const kick = picksOne.kicks[i] as Zone;
    const dive = picksTwo.dives[i] as Zone;
    rounds.push({ kick, dive, goal: kick !== dive });
  }
  return rounds;
}

function scoreRounds(rounds: GameRound[]): number {
  return rounds.filter((r) => r.goal).length;
}

function determineWinner(
  game: GameState,
  rounds: GameRound[],
): { winner: string | null; rounds: GameRound[] } {
  const p1Score = scoreRounds(rounds.slice(0, 5));
  const p2Score = scoreRounds(rounds.slice(5, 10));

  if (p1Score !== p2Score) {
    return { winner: p1Score > p2Score ? game.playerOne : game.playerTwo!, rounds };
  }

  let extraRounds = [...rounds];
  let sdP1 = p1Score;
  let sdP2 = p2Score;

  for (let attempt = 0; attempt < 10; attempt++) {
    const sdKick: Zone = ['TL', 'TR', 'BL', 'BR', 'C'][Math.floor(Math.random() * 5)] as Zone;
    const sdDive: Zone = ['TL', 'TR', 'BL', 'BR', 'C'][Math.floor(Math.random() * 5)] as Zone;
    const r1: GameRound = { kick: sdKick, dive: sdDive, goal: sdKick !== sdDive };

    const sdKick2: Zone = ['TL', 'TR', 'BL', 'BR', 'C'][Math.floor(Math.random() * 5)] as Zone;
    const sdDive2: Zone = ['TL', 'TR', 'BL', 'BR', 'C'][Math.floor(Math.random() * 5)] as Zone;
    const r2: GameRound = { kick: sdKick2, dive: sdDive2, goal: sdKick2 !== sdDive2 };

    extraRounds.push(r1, r2);
    if (r1.goal && !r2.goal) return { winner: game.playerOne, rounds: extraRounds };
    if (!r1.goal && r2.goal) return { winner: game.playerTwo!, rounds: extraRounds };
  }

  return { winner: game.playerOne, rounds: extraRounds };
}

router.post('/', async (req, res) => {
  const { playerOne, stakeAmount, suiGameId, mode } = req.body as {
    playerOne: string;
    stakeAmount: number;
    suiGameId?: string;
    mode: 'vs-friend' | 'vs-agent';
  };

  if (!playerOne || stakeAmount == null || !mode) {
    res.status(400).json({ error: 'playerOne, stakeAmount, and mode are required' });
    return;
  }

  const game: GameState = {
    id: randomUUID(),
    mode,
    playerOne,
    playerTwo: null,
    stakeAmount,
    suiGameId: suiGameId ?? null,
    status: mode === 'vs-agent' ? 'joined' : 'waiting',
    picksOne: null,
    picksTwo: null,
    rounds: null,
    winner: null,
    createdAt: Date.now(),
  };

  await saveGame(game);
  res.status(201).json(game);
});

router.get('/:id', async (req, res) => {
  const game = await getGame(req.params.id);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json(game);
});

router.post('/:id/join', async (req, res) => {
  const game = await getGame(req.params.id);
  if (!game) { res.status(404).json({ error: 'Game not found' }); return; }
  if (game.status !== 'waiting') { res.status(409).json({ error: 'Game already joined' }); return; }

  const { playerTwo, suiGameId } = req.body as { playerTwo: string; suiGameId?: string };
  if (!playerTwo) { res.status(400).json({ error: 'playerTwo is required' }); return; }

  game.playerTwo = playerTwo;
  game.status = 'joined';
  if (suiGameId) game.suiGameId = suiGameId;
  await saveGame(game);
  res.json(game);
});

router.post('/:id/picks', async (req, res) => {
  const game = await getGame(req.params.id);
  if (!game) { res.status(404).json({ error: 'Game not found' }); return; }
  if (game.status === 'resolved') { res.status(409).json({ error: 'Game already resolved' }); return; }

  const { player, kicks, dives } = req.body as {
    player: string;
    kicks: Zone[];
    dives: Zone[];
  };

  if (!player || !kicks || !dives) {
    res.status(400).json({ error: 'player, kicks, and dives are required' });
    return;
  }
  if (kicks.length !== 5 || dives.length !== 5) {
    res.status(400).json({ error: 'kicks and dives must each have 5 entries' });
    return;
  }

  const picks: PlayerPicks = { kicks, dives };
  const isP1 = player === game.playerOne;
  const isP2 = game.mode === 'vs-agent' ? true : player === game.playerTwo;

  if (!isP1 && !isP2) {
    res.status(403).json({ error: 'Player not in this game' });
    return;
  }

  if (isP1) game.picksOne = picks;
  else game.picksTwo = picks;

  if (game.mode === 'vs-agent') {
    if (!game.picksOne) {
      await saveGame(game);
      res.json({ game, waiting: false });
      return;
    }
    const agentPicks: PlayerPicks = {
      kicks: Array.from({ length: 5 }, () => agentKickChoice({ address: '', gamesPlayed: 0, wins: 0, losses: 0, kickHistory: {}, diveHistory: {}, predictions: [], notes: '' })),
      dives: Array.from({ length: 5 }, () => agentDiveChoice({ address: '', gamesPlayed: 0, wins: 0, losses: 0, kickHistory: {}, diveHistory: {}, predictions: [], notes: '' })),
    };
    game.picksTwo = agentPicks;
    game.playerTwo = 'FROST_AI';
  }

  const bothReady = game.picksOne && game.picksTwo;
  if (bothReady) {
    const p1Kicks = game.picksOne!;
    const p2Picks = game.picksTwo!;

    const p1Rounds = computeRounds(p1Kicks, p2Picks);
    const p2Rounds = computeRounds(p2Picks, p1Kicks);
    const allRounds = [...p1Rounds, ...p2Rounds];

    const { winner, rounds: finalRounds } = determineWinner(game, allRounds);
    game.rounds = finalRounds;
    game.winner = winner;
    game.status = 'resolved';

    if (game.suiGameId && winner && winner !== 'FROST_AI') {
      try {
        await resolveGame(game.suiGameId, winner);
      } catch (err) {
        req.log.error({ err }, 'Sui resolve failed — game resolved off-chain only');
      }
    }
  } else {
    game.status = isP1 ? 'picks-p1' : 'picks-p2';
  }

  await saveGame(game);
  res.json({ game, waiting: !bothReady });
});

router.post('/:id/house-join', async (req, res) => {
  const game = await getGame(req.params.id);
  if (!game) { res.status(404).json({ error: 'Game not found' }); return; }

  const { suiGameId } = req.body as { suiGameId: string };
  if (!suiGameId) { res.status(400).json({ error: 'suiGameId is required' }); return; }

  try {
    const digest = await houseJoinGame(suiGameId, game.stakeAmount);
    game.suiGameId = suiGameId;
    game.playerTwo = process.env.HOUSE_ADDRESS ?? 'HOUSE';
    game.status = 'joined';
    await saveGame(game);
    res.json({ digest, game });
  } catch (err: any) {
    req.log.error({ err }, 'house-join failed');
    res.status(500).json({ error: err.message ?? 'Sui error' });
  }
});

export default router;
