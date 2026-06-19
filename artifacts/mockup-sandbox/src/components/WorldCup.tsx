import React, { useState } from 'react';

const MATCHES = [
  { id: 'm1', home: 'Brazil', away: 'Argentina', homColor: '#FFD700', awayColor: '#75AADB' },
  { id: 'm2', home: 'France', away: 'England', homColor: '#0055A4', awayColor: '#CE1124' },
  { id: 'm3', home: 'Germany', away: 'Spain', homColor: '#DD0000', awayColor: '#C60B1E' },
  { id: 'm4', home: 'Portugal', away: 'Netherlands', homColor: '#006600', awayColor: '#FF6600' },
];

function simulate(home: string, away: string) {
  const homeGoals = Math.floor(Math.random() * 4);
  const awayGoals = Math.floor(Math.random() * 4);
  const winner = homeGoals > awayGoals ? home : awayGoals > homeGoals ? away : 'Draw';
  return { homeGoals, awayGoals, winner };
}

export default function WorldCup({ address }: { address: string }) {
  const [results, setResults] = useState<Record<string, any>>({});
  const [bets, setBets] = useState<Record<string, { pick: string; stake: number }>>({});
  const [stakeInput, setStakeInput] = useState<Record<string, string>>({});
  const [simulating, setSimulating] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  function runSimulation(matchId: string, home: string, away: string) {
    setSimulating(matchId);
    setTimeout(() => {
      const result = simulate(home, away);
      setResults(r => ({ ...r, [matchId]: result }));
      setSimulating(null);
    }, 1200);
  }

  function placeBet(matchId: string, pick: string) {
    const stake = parseFloat(stakeInput[matchId] || '1');
    if (stake > 5) { alert('Max 5 SUI per bet'); return; }
    setPendingConfirm(matchId);
    setBets(b => ({ ...b, [matchId]: { pick, stake } }));
  }

  async function confirmBet(matchId: string) {
    const bet = bets[matchId];
    await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        message: `place a world cup bet on match ${matchId}, I pick ${bet.pick} with ${bet.stake} sui stake`,
      }),
    }).catch(() => {});
    setPendingConfirm(null);
    alert(`Bet placed! ${bet.stake} SUI on ${bet.pick} ✅`);
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: '#00d4ff', marginBottom: 24 }}>🏆 World Cup Staking</h2>
      {MATCHES.map(m => {
        const result = results[m.id];
        const bet = bets[m.id];
        const isSimulating = simulating === m.id;
        const isPending = pendingConfirm === m.id;

        return (
          <div key={m.id} style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', fontSize: 18, color: m.homColor }}>{m.home}</span>
              <span style={{ color: '#888', fontSize: 14 }}>vs</span>
              <span style={{ fontWeight: 'bold', fontSize: 18, color: m.awayColor }}>{m.away}</span>
            </div>

            {isSimulating && (
              <div style={{ textAlign: 'center', color: '#00d4ff', marginBottom: 12 }}>⚽ Simulating...</div>
            )}

            {result && !isSimulating && (
              <div style={{ textAlign: 'center', marginBottom: 12, padding: '8px', background: '#1a1a2e', borderRadius: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 'bold' }}>{result.homeGoals} — {result.awayGoals}</span>
                <div style={{ color: result.winner === 'Draw' ? '#888' : '#00d4ff', marginTop: 4 }}>
                  {result.winner === 'Draw' ? '🤝 Draw' : `🏆 ${result.winner} wins`}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <button onClick={() => runSimulation(m.id, m.home, m.away)}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}>
                ▶ Simulate
              </button>
              <button onClick={() => placeBet(m.id, m.home)}
                style={{ padding: '8px 16px', borderRadius: 8, background: m.homColor, color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Bet {m.home}
              </button>
              <button onClick={() => placeBet(m.id, m.away)}
                style={{ padding: '8px 16px', borderRadius: 8, background: m.awayColor, color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Bet {m.away}
              </button>
              <input
                type="number" min="0.1" max="5" step="0.1"
                placeholder="SUI stake"
                value={stakeInput[m.id] || ''}
                onChange={e => setStakeInput(s => ({ ...s, [m.id]: e.target.value }))}
                style={{ width: 90, padding: '8px', borderRadius: 8, border: '1px solid #444', background: '#222', color: '#fff' }}
              />
            </div>

            {bet && !isPending && (
              <div style={{ color: '#888', fontSize: 13 }}>✅ Bet: {bet.stake} SUI on {bet.pick}</div>
            )}

            {isPending && (
              <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ flex: 1, color: '#fff' }}>Confirm {bet?.stake} SUI on {bet?.pick}?</span>
                <button onClick={() => confirmBet(m.id)}
                  style={{ padding: '6px 16px', borderRadius: 6, background: '#00d4ff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Yes
                </button>
                <button onClick={() => setPendingConfirm(null)}
                  style={{ padding: '6px 16px', borderRadius: 6, background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  No
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
