import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FrostQuote from '../components/FrostQuote';
import { api } from '../lib/api';
import { getAddress, setAddress, shortAddress } from '../lib/wallet';

export default function Home() {
  const navigate = useNavigate();
  const [address, setAddr] = useState<string | null>(getAddress());
  const [inputAddr, setInputAddr] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [frost, setFrost] = useState('');
  const [frostLoading, setFrostLoading] = useState(false);
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, losses: 0 });

  useEffect(() => {
    if (!address) return;
    api.getMemory(address).then(({ memory }) => {
      setStats({ gamesPlayed: memory.gamesPlayed, wins: memory.wins, losses: memory.losses });
    }).catch(() => {});

    setFrostLoading(true);
    const ctx = `Player ${shortAddress(address)} just opened the app.`;
    api.getCommentary(address, ctx).then(({ line }) => setFrost(line)).catch(() =>
      setFrost("Ready to lose? Step up and prove yourself.")
    ).finally(() => setFrostLoading(false));
  }, [address]);

  function connect() {
    const trimmed = inputAddr.trim();
    if (!trimmed) return;
    setAddress(trimmed);
    setAddr(trimmed);
    setShowInput(false);
    setInputAddr('');
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>⚽</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          <span style={{ color: '#38BDF8' }}>Cooler</span>{' '}
          <span style={{ color: '#FB923C' }}>Cup</span>
        </h1>
        <p style={{ color: '#64748B', marginTop: 8, fontSize: 15 }}>
          Penalty shootouts. Real stakes. AI memory.
        </p>
      </div>

      {/* Wallet */}
      {!address ? (
        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ color: '#94A3B8', marginBottom: 16, fontSize: 14 }}>
            Enter your Sui wallet address to get started
          </p>
          {showInput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={inputAddr}
                onChange={e => setInputAddr(e.target.value)}
                placeholder="0x..."
                style={{
                  background: '#1E293B', border: '1px solid #334155', borderRadius: 10,
                  color: '#F1F5F9', padding: '12px 16px', fontSize: 14, width: '100%',
                  outline: 'none', fontFamily: 'monospace',
                }}
                onKeyDown={e => e.key === 'Enter' && connect()}
                autoFocus
              />
              <button className="btn-primary btn-lg" onClick={connect} style={{ width: '100%' }}>
                Connect
              </button>
            </div>
          ) : (
            <button className="btn-primary btn-lg" onClick={() => setShowInput(true)} style={{ width: '100%' }}>
              Connect Wallet
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet</p>
                <p style={{ fontFamily: 'monospace', fontSize: 15, color: '#38BDF8', fontWeight: 600 }}>{shortAddress(address)}</p>
              </div>
              <button className="btn-sm btn-ghost" onClick={() => { setAddr(null); localStorage.removeItem('cooler_cup_address'); }}>
                Disconnect
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[['Played', stats.gamesPlayed], ['Wins', stats.wins, '#4ADE80'], ['Losses', stats.losses, '#F87171']].map(([label, val, color]) => (
                <div key={String(label)} style={{ background: '#1E293B', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: (color as string) || '#F1F5F9' }}>{val}</p>
                  <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Frost */}
          {(frost || frostLoading) && (
            <div style={{ marginBottom: 24 }}>
              <FrostQuote line={frost} loading={frostLoading} />
            </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn-primary btn-lg" onClick={() => navigate('/play')} style={{ width: '100%' }}>
              ⚽ Play Now
            </button>
            <button className="btn-accent btn-lg" onClick={() => navigate('/worldcup')} style={{ width: '100%' }}>
              🏆 World Cup Predictions
            </button>
          </div>
        </>
      )}

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 32 }}>
        {['On-chain stakes', 'AI memory', 'Walrus storage', 'Penalty shootout'].map(f => (
          <span key={f} className="badge badge-blue">{f}</span>
        ))}
      </div>
    </div>
  );
}
