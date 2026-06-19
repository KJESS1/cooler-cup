import { useEffect, useRef } from 'react';
import { launchMatch, MatchResult } from '../game/MatchScene';
import { Team } from '../game/teams';

interface Props {
  teamA: Team;
  teamB: Team;
  teamABias?: number;
  onComplete: (r: MatchResult) => void;
}

export function MatchSimulation({ teamA, teamB, teamABias = 0.5, onComplete }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const id = 'match-' + Date.now();
    ref.current.id = id;
    const game = launchMatch(id, {
      teamA: { name: teamA.name, primaryColor: teamA.primaryColor },
      teamB: { name: teamB.name, primaryColor: teamB.primaryColor },
      durationMs: 20000,
      teamABias,
      onComplete,
    });
    return () => { try { game.destroy(true); } catch {} };
  }, []);

  return (
    <div
      ref={ref}
      style={{ width: 800, height: 560, margin: '0 auto', borderRadius: 12, overflow: 'hidden' }}
    />
  );
}