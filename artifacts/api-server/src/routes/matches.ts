import { Router } from 'express';
import type { Match } from '../lib/types.js';

const router = Router();

const MATCHES: Match[] = [
  { id: 'm1', teams: 'Argentina vs Brazil', teamA: 'Argentina', teamB: 'Brazil', date: '2026-06-20' },
  { id: 'm2', teams: 'France vs Germany', teamA: 'France', teamB: 'Germany', date: '2026-06-21' },
  { id: 'm3', teams: 'England vs Spain', teamA: 'England', teamB: 'Spain', date: '2026-06-22' },
  { id: 'm4', teams: 'Portugal vs Netherlands', teamA: 'Portugal', teamB: 'Netherlands', date: '2026-06-23' },
  { id: 'm5', teams: 'USA vs Mexico', teamA: 'USA', teamB: 'Mexico', date: '2026-06-24' },
  { id: 'm6', teams: 'Italy vs Belgium', teamA: 'Italy', teamB: 'Belgium', date: '2026-06-25' },
];

router.get('/', (_req, res) => {
  res.json(MATCHES);
});

router.get('/:id', (req, res) => {
  const match = MATCHES.find((m) => m.id === req.params.id);
  if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
  res.json(match);
});

export default router;
