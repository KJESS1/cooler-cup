import { useState, useEffect } from 'react';
import FrostQuote from '../components/FrostQuote';
import { api, type Match } from '../lib/api';
import { getAddress } from '../lib/wallet';

export default function WorldCup() {
  const address = getAddress();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ matchId: string; pick: string } | null>(null);
  const [frost, setFrost] = useState('');
  const [frostLoading, setFrostLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);

  useEffect(() => {
    api.getMatches().then(setMatches).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function pickTeam(match: Match, team: string) {
    setSelected({ matchId: match.id, pick: team });
    if (!address) return;
    setFrostLoading(true);
    const ctx = `Player is thinking of betting on ${team} in ${match.teams}.`;
    api.getCommentary(address, ctx).then(({ line }) => setFrost(line)).catch(() =>
      setFrost('Bold pick. Let\'s see if it pays off.')
    ).finally(() => setFrostLoading(false));
  }

  function confirmPick() {
    if (!selected) return;
    setConfirmed(c => [...c, selected.matchId]);
    setSelected(null);
    setFrost('');
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div className="page">
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>🏆 World Cup 2026</h2>
      <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>Predict match winners. Frost comments on your picks.</p>

      {!address && (
        <div className="card" style={{ textAlign: 'center', marginBottom: 20, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)' }}>
          <p style={{ color: '#FB923C', fontSize: 14 }}>Connect wallet to track your predictions</p>
        </div>
      )}

      {(frost || frostLoading) && (
        <div style={{ marginBottom: 20 }}>
          <FrostQuote line={frost} loading={frostLoading} />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card shimmer" style={{ height: 100 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.map(match => {
            const isPicked = selected?.matchId === match.id;
            const isDone = confirmed.includes(match.id);
            return (
              <div key={match.id} className="card" style={{
                border: isPicked ? '1px solid rgba(56,189,248,0.4)' : '1px solid #1E293B',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{formatDate(match.date)}</span>
                  {isDone && <span className="badge badge-green">✓ Predicted</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => !isDone && pickTeam(match, match.teamA)}
                    disabled={isDone}
                    style={{
                      padding: '12px 8px', borderRadius: 12, textAlign: 'center', fontWeight: 700, fontSize: 14,
                      background: selected?.matchId === match.id && selected.pick === match.teamA
                        ? 'rgba(56,189,248,0.2)' : '#1E293B',
                      border: selected?.matchId === match.id && selected.pick === match.teamA
                        ? '2px solid #38BDF8' : '2px solid transparent',
                      color: '#F1F5F9', cursor: isDone ? 'default' : 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {match.teamA}
                  </button>
                  <span style={{ color: '#475569', fontWeight: 800, fontSize: 13 }}>vs</span>
                  <button
                    onClick={() => !isDone && pickTeam(match, match.teamB)}
                    disabled={isDone}
                    style={{
                      padding: '12px 8px', borderRadius: 12, textAlign: 'center', fontWeight: 700, fontSize: 14,
                      background: selected?.matchId === match.id && selected.pick === match.teamB
                        ? 'rgba(251,146,60,0.2)' : '#1E293B',
                      border: selected?.matchId === match.id && selected.pick === match.teamB
                        ? '2px solid #FB923C' : '2px solid transparent',
                      color: '#F1F5F9', cursor: isDone ? 'default' : 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {match.teamB}
                  </button>
                </div>

                {isPicked && !isDone && (
                  <button
                    className="btn-primary"
                    onClick={confirmPick}
                    style={{ width: '100%', marginTop: 12 }}
                  >
                    Confirm — {selected?.pick}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, background: '#0F172A', borderRadius: 12, border: '1px solid #1E293B' }}>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#64748B' }}>How it works:</strong> Pick a winner before the match. Your prediction is stored in your Walrus memory blob on Sui mainnet. Frost analyses your betting patterns to taunt you accordingly.
        </p>
      </div>
    </div>
  );
}
