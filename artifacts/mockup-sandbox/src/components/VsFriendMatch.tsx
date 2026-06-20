import { useState } from 'react';

const DIRECTIONS = ['Left', 'Center', 'Right'];

export default function VsFriendMatch({ address }: { address: string }) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'playing' | 'result'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [stake, setStake] = useState('1');
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [round, setRound] = useState(0);
  const [message, setMessage] = useState('');
  const [ballPos, setBallPos] = useState({ x: 50, y: 75 });
  const [goalkeeperPos, setGoalkeeperPos] = useState(50);
  const [shooting, setShooting] = useState(false);

  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function createGame() {
    const code = generateCode();
    setJoinCode(code);
    setMode('create');
  }

  function joinGame() {
    if (!inputCode.trim()) return;
    setJoinCode(inputCode.trim());
    setMode('playing');
  }

  function getTargetX(dir: string) {
    if (dir === 'Left') return 20;
    if (dir === 'Right') return 80;
    return 50;
  }

  function animateBall(targetX: number, targetY: number): Promise<void> {
    return new Promise(resolve => {
      let start: number | null = null;
      const duration = 600;
      function step(ts: number) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setBallPos({ x: 50 + (targetX - 50) * eased, y: 75 + (targetY - 75) * eased });
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  async function shoot(dir: string) {
    if (shooting) return;
    setShooting(true);
    const opponentDive = DIRECTIONS[Math.floor(Math.random() * 3)];
    const targetX = getTargetX(dir);
    const gkX = getTargetX(opponentDive);
    setBallPos({ x: 50, y: 75 });
    await animateBall(targetX, 15);
    setGoalkeeperPos(gkX);
    const scored = dir !== opponentDive;
    const newPS = playerScore + (scored ? 1 : 0);
    const oppDir = DIRECTIONS[Math.floor(Math.random() * 3)];
    const saveDir = DIRECTIONS[Math.floor(Math.random() * 3)];
    const oppScored = oppDir !== saveDir;
    const newOS = opponentScore + (oppScored ? 1 : 0);
    setMessage(`You shot ${dir} — ${scored ? '⚽ GOAL!' : '❌ Saved!'} | Opponent shot ${oppDir} — ${oppScored ? '⚽ They score!' : '🧤 You saved!'}`);
    setPlayerScore(newPS);
    setOpponentScore(newOS);
    const newRound = round + 1;
    setRound(newRound);
    setTimeout(() => {
      setBallPos({ x: 50, y: 75 });
      setGoalkeeperPos(50);
      setShooting(false);
      if (newRound >= 5) setTimeout(() => setMode('result'), 500);
    }, 700);
  }

  function reset() {
    setMode('menu'); setPlayerScore(0); setOpponentScore(0);
    setRound(0); setMessage(''); setJoinCode(''); setInputCode('');
    setBallPos({ x: 50, y: 75 }); setGoalkeeperPos(50);
  }

  if (mode === 'menu') return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#00d4ff' }}>⚽ Play vs Friend</h2>
      <p style={{ color: '#888', marginBottom: 32 }}>Create a game and share the code, or join one</p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: '#888', fontSize: 13 }}>Stake (SUI)</label>
          <input type="number" min="0.1" max="5" step="0.1" value={stake}
            onChange={e => setStake(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginTop: 4 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
        <button onClick={createGame} style={{ padding: '14px 28px', borderRadius: 8, background: '#00d4ff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: 16 }}>
          Create Game
        </button>
      </div>
      <div style={{ borderTop: '1px solid #222', paddingTop: 24 }}>
        <p style={{ color: '#888', marginBottom: 12 }}>Have a join code?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <input value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())}
            placeholder="Enter code..."
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 16, width: 140 }} />
          <button onClick={joinGame} style={{ padding: '10px 20px', borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontWeight: 'bold' }}>
            Join
          </button>
        </div>
      </div>
    </div>
  );

  if (mode === 'create') return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#00d4ff' }}>Game Created!</h2>
      <p style={{ color: '#888' }}>Share this code with your friend:</p>
      <div style={{ fontSize: 48, fontWeight: 'bold', letterSpacing: 8, color: '#FFD700', margin: '24px 0', background: '#111', padding: 20, borderRadius: 12 }}>
        {joinCode}
      </div>
      <p style={{ color: '#888', marginBottom: 24 }}>Stake: {stake} SUI</p>
      <button onClick={() => setMode('playing')} style={{ padding: '14px 28px', borderRadius: 8, background: '#00d4ff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: 16 }}>
        Start Playing
      </button>
    </div>
  );

  if (mode === 'result') return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: 32, color: playerScore > opponentScore ? '#FFD700' : '#888' }}>
        {playerScore > opponentScore ? '🏆 You Win!' : playerScore === opponentScore ? '🤝 Draw!' : '😔 You Lost!'}
      </h2>
      <p style={{ fontSize: 28 }}>{playerScore} — {opponentScore}</p>
      <p style={{ color: '#888', marginBottom: 24 }}>Game code: {joinCode}</p>
      <button onClick={reset} style={{ padding: '12px 28px', borderRadius: 8, background: '#00d4ff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Play Again</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00d4ff', fontWeight: 'bold' }}>You</div>
          <div style={{ fontSize: 40, fontWeight: 'bold' }}>{playerScore}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#666', fontSize: 12 }}>Code: {joinCode}</div>
          <div style={{ color: '#666', fontSize: 13 }}>Round {Math.min(round + 1, 5)}/5</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold' }}>Friend</div>
          <div style={{ fontSize: 40, fontWeight: 'bold' }}>{opponentScore}</div>
        </div>
      </div>

      <div style={{
        position: 'relative', width: '100%', paddingBottom: '58%',
        background: 'linear-gradient(180deg, #1a5c1a 0%, #2d8a2d 50%, #1a5c1a 100%)',
        borderRadius: 12, overflow: 'hidden', border: '3px solid #0a3d0a', marginBottom: 16
      }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 58" preserveAspectRatio="none">
          <rect x="1" y="1" width="98" height="56" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
          <rect x="25" y="1" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
          <rect x="35" y="1" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
        </svg>
        <div style={{ position: 'absolute', top: '1%', left: '28%', width: '44%', height: '18%', border: '3px solid white', borderBottom: 'none', background: 'rgba(255,255,255,0.07)' }}/>
        <div style={{ position: 'absolute', left: `${goalkeeperPos}%`, top: '6%', transform: 'translate(-50%, 0)', transition: 'left 0.25s ease', fontSize: 26 }}>🧤</div>
        <div style={{ position: 'absolute', left: `${ballPos.x}%`, top: `${ballPos.y}%`, transform: 'translate(-50%, -50%)', fontSize: shooting ? 18 : 22, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))', zIndex: 10 }}>⚽</div>
        <div style={{ position: 'absolute', left: '50%', top: '82%', transform: 'translate(-50%, -50%)', fontSize: 30 }}>🏃</div>
      </div>

      {message && <div style={{ textAlign: 'center', color: '#aaa', marginBottom: 12, fontSize: 13 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {DIRECTIONS.map(d => (
          <button key={d} onClick={() => shoot(d)} disabled={shooting} style={{
            padding: '14px 0', borderRadius: 8, flex: 1,
            background: shooting ? '#1a1a1a' : '#222',
            color: shooting ? '#444' : '#fff',
            border: `1px solid ${shooting ? '#333' : '#555'}`,
            cursor: shooting ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 'bold'
          }}>
            {d === 'Left' ? '⬅️' : d === 'Right' ? '➡️' : '⬆️'} {d}
          </button>
        ))}
      </div>
    </div>
  );
}
