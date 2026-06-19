import React, { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const TEAMS = [
  { id: 'brazil', name: 'Brazil', color: '#FFD700' },
  { id: 'argentina', name: 'Argentina', color: '#75AADB' },
  { id: 'france', name: 'France', color: '#0055A4' },
  { id: 'germany', name: 'Germany', color: '#DD0000' },
  { id: 'england', name: 'England', color: '#CE1124' },
  { id: 'spain', name: 'Spain', color: '#C60B1E' },
];

const DIRECTIONS = ['Left', 'Center', 'Right'];

export default function GameBoard({ address }: { address: string }) {
  const [team, setTeam] = useState(TEAMS[0]);
  const [phase, setPhase] = useState<'pick-team' | 'playing' | 'result'>('pick-team');
  const [playerScore, setPlayerScore] = useState(0);
  const [frostScore, setFrostScore] = useState(0);
  const [round, setRound] = useState(0);
  const [lastResult, setLastResult] = useState('');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  function shoot(dir: string) {
    const frostDive = DIRECTIONS[Math.floor(Math.random() * 3)];
    const scored = dir !== frostDive;
    const newPlayerScore = playerScore + (scored ? 1 : 0);
    const frostShoot = DIRECTIONS[Math.floor(Math.random() * 3)];
    const playerSave = DIRECTIONS[Math.floor(Math.random() * 3)];
    const frostScored = frostShoot !== playerSave;
    const newFrostScore = frostScore + (frostScored ? 1 : 0);
    setPlayerScore(newPlayerScore);
    setFrostScore(newFrostScore);
    setLastResult(`You shot ${dir} — ${scored ? '⚽ GOAL!' : '❌ Saved!'} | Frost shot ${frostShoot} — ${frostScored ? '⚽ Frost scores!' : '🧤 You saved!'}`);
    const newRound = round + 1;
    setRound(newRound);
    if (newRound >= 5) {
      setTimeout(() => {
        setPhase('result');
        saveResult(newPlayerScore > newFrostScore, newPlayerScore, newFrostScore);
      }, 1000);
    }
  }

  async function saveResult(won: boolean, ps: number, fs: number) {
    await fetch('/api/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, won, team: team.id, playerPicks: [], agentPicks: [] }),
    });
  }

  function reset() {
    setPhase('pick-team'); setPlayerScore(0); setFrostScore(0); setRound(0); setLastResult('');
  }

  if (phase === 'pick-team') return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h2>Pick Your Team</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
        {TEAMS.map(t => (
          <button key={t.id} onClick={() => setTeam(t)} style={{
            padding: '12px 20px', borderRadius: 8, border: `3px solid ${team.id === t.id ? '#00d4ff' : 'transparent'}`,
            background: t.color, color: '#fff', fontWeight: 'bold', cursor: 'pointer', textShadow: '0 1px 3px #000'
          }}>{t.name}</button>
        ))}
      </div>
      <button onClick={() => setPhase('playing')} style={{ padding: '14px 32px', borderRadius: 10, background: '#00d4ff', color: '#000', fontWeight: 'bold', fontSize: 18, border: 'none', cursor: 'pointer' }}>
        Play vs Frost
      </button>
    </div>
  );

  if (phase === 'result') return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h2>{playerScore > frostScore ? '🏆 You Win!' : playerScore === frostScore ? '🤝 Draw!' : '❄️ Frost Wins!'}</h2>
      <p style={{ fontSize: 24 }}>{playerScore} — {frostScore}</p>
      <button onClick={reset} style={{ padding: '12px 28px', borderRadius: 8, background: '#00d4ff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Play Again</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h2>Round {round + 1}/5 — {team.name} vs Frost</h2>
      <div style={{ fontSize: 32, marginBottom: 16 }}>{playerScore} — {frostScore}</div>
      {lastResult && <p style={{ color: '#aaa', marginBottom: 16 }}>{lastResult}</p>}
      <p style={{ marginBottom: 12 }}>Where do you shoot?</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {DIRECTIONS.map(d => (
          <button key={d} onClick={() => shoot(d)} style={{ padding: '14px 24px', borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontSize: 16 }}>{d}</button>
        ))}
      </div>
    </div>
  );
}
