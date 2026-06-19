import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type PlayerMemory } from '../lib/api';
import { getAddress, shortAddress, clearAddress } from '../lib/wallet';

const ZONE_LABELS: Record<string, string> = { TL: 'Top Left', TR: 'Top Right', BL: 'Bot Left', BR: 'Bot Right', C: 'Centre' };

export default function Profile() {
  const navigate = useNavigate();
  const address = getAddress();
  const [memory, setMemory] = useState<PlayerMemory | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [aggregatorUrl, setAggregatorUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    api.getMemory(address).then(({ memory: m, blobId: bid, aggregatorUrl: url }) => {
      setMemory(m);
      setBlobId(bid);
      setAggregatorUrl(url);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [address]);

  function topZone(hist: Partial<Record<string, number>>) {
    const entries = Object.entries(hist);
    if (!entries.length) return null;
    return entries.sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0];
  }

  if (!address) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 40 }}>👤</p>
        <p style={{ color: '#94A3B8' }}>Connect your wallet first</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const winRate = memory && memory.gamesPlayed > 0
    ? Math.round((memory.wins / memory.gamesPlayed) * 100)
    : 0;

  const topKick = memory ? topZone(memory.kickHistory) : null;
  const topDive = memory ? topZone(memory.diveHistory) : null;

  return (
    <div className="page">
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 24 }}>👤 Profile</h2>

      {/* Wallet card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Wallet</p>
        <p style={{ fontFamily: 'monospace', fontSize: 14, color: '#38BDF8', wordBreak: 'break-all', marginBottom: 12 }}>{address}</p>
        <button className="btn-ghost btn-sm" onClick={() => { clearAddress(); navigate('/'); }}>Disconnect</button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="card shimmer" style={{ height: 120, marginBottom: 16 }} />
      ) : memory && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Record</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              {[
                ['Played', memory.gamesPlayed, '#F1F5F9'],
                ['Wins', memory.wins, '#4ADE80'],
                ['Losses', memory.losses, '#F87171'],
                ['Win %', `${winRate}%`, winRate >= 50 ? '#4ADE80' : '#FB923C'],
              ].map(([label, val, color]) => (
                <div key={String(label)} style={{ background: '#1E293B', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: color as string }}>{val}</p>
                  <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tendencies */}
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Tendencies</p>
            {topKick && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#94A3B8' }}>Favourite kick spot</span>
                <span className="badge badge-blue">{ZONE_LABELS[topKick[0]] ?? topKick[0]}</span>
              </div>
            )}
            {topDive && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#94A3B8' }}>Favourite dive spot</span>
                <span className="badge badge-orange">{ZONE_LABELS[topDive[0]] ?? topDive[0]}</span>
              </div>
            )}
            {!topKick && !topDive && (
              <p style={{ color: '#475569', fontSize: 14 }}>Play some games to build your profile!</p>
            )}
          </div>

          {/* Predictions */}
          {memory.predictions.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Predictions</p>
              {memory.predictions.slice(-5).reverse().map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{p.match}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>Picked: {p.pick}</p>
                  </div>
                  <span className={`badge ${p.result === 'win' ? 'badge-green' : p.result === 'loss' ? 'badge-red' : 'badge-blue'}`}>
                    {p.result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Walrus blob */}
      <div className="card" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}>
        <p style={{ fontSize: 12, color: '#38BDF8', fontWeight: 700, marginBottom: 8 }}>WALRUS MEMORY BLOB</p>
        {blobId ? (
          <>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B', wordBreak: 'break-all', marginBottom: 10 }}>{blobId}</p>
            <a
              href={aggregatorUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38BDF8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              View raw blob on Walrus ↗
            </a>
          </>
        ) : (
          <p style={{ color: '#475569', fontSize: 13 }}>No blob yet — play a game to write your first memory to Walrus mainnet.</p>
        )}
      </div>
    </div>
  );
}
