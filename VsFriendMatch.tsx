import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MatchSimulation } from './MatchSimulation';
import { TEAMS, Team } from '../game/teams';
import { MatchResult } from '../game/MatchScene';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';

interface Props {
  address: string;
}

export default function VsFriendMatch({ address }: Props) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [stage, setStage] = useState<'setup' | 'waiting' | 'ready' | 'playing' | 'done'>('setup');
  const [myTeam, setMyTeam] = useState<Team>(TEAMS[0]);
  const [stakeSui, setStakeSui] = useState(0.1);
  const [gameId, setGameId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);

  function registerJoin(id: string) {
    fetch(`/api/game/${id}/joined`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    }).catch(() => {});
  }

  function createGame() {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [Math.floor(stakeSui * 1_000_000_000)]);
    tx.moveCall({
      target: `${PACKAGE_ID}::game_escrow::create_game`,
      arguments: [coin],
    });
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (res: any) => {
          const created = res.objectChanges?.find((c: any) => c.objectType?.includes('::Game'));
          const id = created?.objectId || res.digest;
          setGameId(id);
          registerJoin(id);
          setStage('waiting');
          setStatus(`Game created. Share this code with your friend.`);
        },
        onError: (e) => setStatus(`Failed: ${e.message}`),
      }
    );
  }

  function joinGame() {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [Math.floor(stakeSui * 1_000_000_000)]);
    tx.moveCall({
      target: `${PACKAGE_ID}::game_escrow::join_game`,
      arguments: [tx.object(joinCode), coin],
    });
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setGameId(joinCode);
          registerJoin(joinCode);
          setStage('ready');
          setStatus('Joined! Both players staked. Ready to play.');
        },
        onError: (e) => setStatus(`Failed to join: ${e.message}`),
      }
    );
  }

  async function handleComplete(res: MatchResult) {
    setResult(res);
    setStage('done');
    setStatus('Match complete. Finding opponent address...');

    try {
      const pr = await fetch(`/api/game/${gameId}/participants`);
      const { participants } = await pr.json();
      const opponentAddress = participants.find((a: string) => a !== address);

      if (!opponentAddress) {
        setStatus('Could not find opponent address. Payout needs manual resolution.');
        return;
      }
      if (res.winner === 'draw') {
        setStatus('Draw — no automatic payout. Consider a rematch.');
        return;
      }

      const winnerAddress = res.winner === 'A' ? address : opponentAddress;
      setStatus('Requesting payout...');
      const r = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, winnerAddress }),
      });
      const data = await r.json();
      setStatus(data.ok ? 'Paid out to winner!' : `Payout issue: ${data.error}`);
    } catch (e: any) {
      setStatus(`Resolve call failed: ${e.message}`);
    }
  }

  if (stage === 'setup') {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', color: '#fff' }}>
        <h2>Challenge a Friend</h2>
        <p style={{ color: '#888' }}>Create a game or join one with a code.</p>

        <div style={{ marginBottom: 20 }}>
          <label>Your team:</label>
          <select
            value={myTeam.id}
            onChange={e => setMyTeam(TEAMS.find(t => t.id === e.target.value)!)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Stake (SUI):</label>
          <input
            type="number"
            value={stakeSui}
            onChange={e => setStakeSui(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0.01"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <button onClick={createGame} style={{ width: '100%', padding: 12, marginBottom: 12, background: '#00d4ff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
          Create Game
        </button>

        <div style={{ textAlign: 'center', color: '#666', margin: '12px 0' }}>— or —</div>

        <input
          placeholder="Paste friend's game code (object ID)"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button onClick={joinGame} disabled={!joinCode} style={{ width: '100%', padding: 12, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, cursor: 'pointer' }}>
          Join Game
        </button>

        {status && <p style={{ marginTop: 16, color: '#0f0', wordBreak: 'break-all' }}>{status}</p>}
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', color: '#fff', textAlign: 'center' }}>
        <h2>Waiting for your friend...</h2>
        <p style={{ wordBreak: 'break-all', color: '#00d4ff', background: '#111', padding: 12, borderRadius: 8 }}>{gameId}</p>
        <p style={{ color: '#888' }}>Send them this code. Once they join, click below.</p>
        <button onClick={() => setStage('ready')} style={{ marginTop: 16, padding: '10px 20px', background: '#00d4ff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          They've joined — Start Match
        </button>
      </div>
    );
  }

  if (stage === 'ready') {
    const opponentTeam = TEAMS.find(t => t.id !== myTeam.id) || TEAMS[1];
    return (
      <div>
        <p style={{ textAlign: 'center', color: '#888' }}>Both staked. Starting match...</p>
        <MatchSimulation teamA={myTeam} teamB={opponentTeam} onComplete={handleComplete} />
      </div>
    );
  }

  if (stage === 'done' && result) {
    return (
      <div style={{ textAlign: 'center', maxWidth: 500, margin: '60px auto', color: '#fff' }}>
        <h2>{result.teamAScore} - {result.teamBScore}</h2>
        <p style={{ color: '#0f0' }}>{status}</p>
      </div>
    );
  }

  return null;
}