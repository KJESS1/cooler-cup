import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoalGrid from '../components/GoalGrid';
import FrostQuote from '../components/FrostQuote';
import { api, type Zone, type GameState } from '../lib/api';
import { getAddress, shortAddress } from '../lib/wallet';

type Phase = 'mode' | 'picks' | 'result';

const ZONES: Zone[] = ['TL', 'TR', 'BL', 'BR', 'C'];
function randomZone(): Zone { return ZONES[Math.floor(Math.random() * ZONES.length)]; }

export default function Play() {
  const navigate = useNavigate();
  const address = getAddress();
  const [phase, setPhase] = useState<Phase>('mode');
  const [mode, setMode] = useState<'vs-agent' | 'vs-friend'>('vs-agent');
  const [game, setGame] = useState<GameState | null>(null);
  const [friendCode, setFriendCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [kicks, setKicks] = useState<Zone[]>([]);
  const [dives, setDives] = useState<Zone[]>([]);
  const [currentKick, setCurrentKick] = useState<Zone | null>(null);
  const [currentDive, setCurrentDive] = useState<Zone | null>(null);
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [frost, setFrost] = useState('');
  const [frostLoading, setFrostLoading] = useState(false);
  const [result, setResult] = useState<{ winner: string | null; rounds: GameState['rounds'] } | null>(null);

  if (!address) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 40 }}>🔒</p>
        <p style={{ color: '#94A3B8' }}>Connect your wallet first</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  async function startVsAgent() {
    setLoading(true); setError('');
    try {
      const g = await api.createGame({ playerOne: address!, stakeAmount: 0, mode: 'vs-agent' });
      setGame(g); setMode('vs-agent'); setPhase('picks');
      getFrost('A new challenger! Show me what you\'ve got.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function createFriendGame() {
    setLoading(true); setError('');
    try {
      const g = await api.createGame({ playerOne: address!, stakeAmount: 1000000, mode: 'vs-friend' });
      setGame(g); setFriendCode(g.id); setMode('vs-friend'); setPhase('picks');
      getFrost('A friend duel? Bold move. Let\'s see who crumbles under pressure.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function joinFriendGame() {
    if (!joinCode.trim()) return;
    setLoading(true); setError('');
    try {
      const g = await api.joinGame(joinCode.trim(), { playerTwo: address! });
      setGame(g); setMode('vs-friend'); setPhase('picks');
      getFrost('You joined late. That\'s already two strikes against you.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function getFrost(ctx: string) {
    setFrostLoading(true);
    api.getCommentary(address!, ctx).then(({ line }) => setFrost(line)).catch(() =>
      setFrost('Game on. No mercy.')
    ).finally(() => setFrostLoading(false));
  }

  function confirmRound() {
    if (!currentKick || !currentDive) return;
    const newKicks = [...kicks, currentKick];
    const newDives = [...dives, currentDive];
    setKicks(newKicks); setDives(newDives);
    setCurrentKick(null); setCurrentDive(null);

    if (newKicks.length < 5) {
      setRound(r => r + 1);
    } else {
      submitPicks(newKicks, newDives);
    }
  }

  async function submitPicks(k: Zone[], d: Zone[]) {
    if (!game) return;
    setLoading(true); setError('');
    try {
      const { game: finalGame } = await api.submitPicks(game.id, { player: address!, kicks: k, dives: d });
      setResult({ winner: finalGame.winner, rounds: finalGame.rounds });
      setPhase('result');

      const won = finalGame.winner === address;
      const ctx = won ? 'Player just won a penalty shootout.' : 'Player just lost a penalty shootout.';
      getFrost(ctx);

      // Update memory
      api.updateMemoryRecord(address!, {
        outcome: won ? 'win' : 'loss',
        kickZones: k,
        diveZones: d,
      }).catch(() => {});
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function reset() {
    setPhase('mode'); setGame(null); setKicks([]); setDives([]);
    setCurrentKick(null); setCurrentDive(null); setRound(0);
    setResult(null); setFrost(''); setFriendCode(''); setJoinCode(''); setError('');
  }

  const p1Goals = result?.rounds?.slice(0, 5).filter(r => r.goal).length ?? 0;
  const p2Goals = result?.rounds?.slice(5, 10).filter(r => r.goal).length ?? 0;
  const won = result?.winner === address;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => phase === 'mode' ? navigate('/') : reset()} style={{ background: 'none', color: '#64748B', fontSize: 22 }}>←</button>
        <h2 style={{ fontWeight: 800, fontSize: 22 }}>⚽ Play</h2>
      </div>

      {/* Mode selection */}
      {phase === 'mode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button className="card" onClick={startVsAgent} disabled={loading} style={{
            textAlign: 'left', cursor: 'pointer', border: '1px solid #1E293B',
            transition: 'border-color 0.15s', width: '100%',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#38BDF8')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1E293B')}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>❄️</div>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>vs Frost (AI)</h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>Practice against the AI that remembers your every move. No stakes.</p>
          </button>

          <div className="card" style={{ border: '1px solid #1E293B' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>vs Friend</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 16 }}>Real SUI on the line. Create a game or join one.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={createFriendGame} disabled={loading} style={{ flex: 1 }}>Create Game</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Paste game code..."
                style={{
                  flex: 1, background: '#1E293B', border: '1px solid #334155',
                  borderRadius: 10, color: '#F1F5F9', padding: '10px 14px', fontSize: 13, outline: 'none',
                }}
              />
              <button className="btn-ghost btn-sm" onClick={joinFriendGame} disabled={loading || !joinCode.trim()}>Join</button>
            </div>
          </div>
          {error && <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}
        </div>
      )}

      {/* Picks phase */}
      {phase === 'picks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {friendCode && (
            <div className="card" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <p style={{ fontSize: 12, color: '#38BDF8', fontWeight: 700, marginBottom: 6 }}>SHARE THIS CODE WITH YOUR FRIEND</p>
              <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#CBD5E1', wordBreak: 'break-all' }}>{friendCode}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontWeight: 700 }}>Round {round + 1} of 5</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < kicks.length ? '#38BDF8' : i === kicks.length ? '#FB923C' : '#1E293B',
                }} />
              ))}
            </div>
          </div>

          <GoalGrid label="Where will you KICK?" selected={currentKick} onSelect={setCurrentKick} disabled={loading} />
          <GoalGrid label="Where will you DIVE?" selected={currentDive} onSelect={setCurrentDive} disabled={loading} />

          <button
            className="btn-primary btn-lg"
            onClick={confirmRound}
            disabled={!currentKick || !currentDive || loading}
            style={{ width: '100%', opacity: (!currentKick || !currentDive) ? 0.4 : 1 }}
          >
            {loading ? 'Calculating…' : kicks.length === 4 ? 'Take Final Shot!' : 'Confirm Round'}
          </button>
          {error && <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          {frost && <FrostQuote line={frost} loading={frostLoading} />}
        </div>
      )}

      {/* Result */}
      {phase === 'result' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{won ? '🏆' : '😔'}</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
              {won ? 'You Win!' : result.winner === 'FROST_AI' ? 'Frost Wins' : 'You Lose'}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 900, color: won ? '#4ADE80' : '#F87171' }}>{p1Goals}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{shortAddress(address!)}</p>
              </div>
              <p style={{ color: '#475569', fontWeight: 700, fontSize: 20 }}>vs</p>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 900, color: !won ? '#4ADE80' : '#F87171' }}>{p2Goals}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{result.winner === 'FROST_AI' ? 'Frost AI' : 'Opponent'}</p>
              </div>
            </div>
          </div>

          {/* Round breakdown */}
          <div className="card">
            <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Round Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.rounds?.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#475569', width: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', flex: 1 }}>Kicked {r.kick} → keeper dove {r.dive}</span>
                  <span style={{ fontSize: 16 }}>{r.goal ? '✅' : '🧤'}</span>
                </div>
              ))}
            </div>
          </div>

          {frost && <FrostQuote line={frost} loading={frostLoading} />}

          <button className="btn-primary btn-lg" onClick={reset} style={{ width: '100%' }}>Play Again</button>
        </div>
      )}
    </div>
  );
}
