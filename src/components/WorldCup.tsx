import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { WORLD_CUP_MATCHES } from '../game/worldcup';
import { TEAMS } from '../game/teams';
import { MatchSimulation } from './MatchSimulation';
import { MatchResult } from '../game/MatchScene';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '';

interface Props {
  address: string;
}

export default function WorldCup({ address }: Props) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, MatchResult>>({});
  const [stakeStatus, setStakeStatus] = useState<Record<string, string>>({});

  function stakeOnPick(matchId: string, pickTeamId: string, stakeSui: number) {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [Math.floor(stakeSui * 1_000_000_000)]);
    tx.moveCall({
      target: `${PACKAGE_ID}::game_escrow::create_game`,
      arguments: [coin],
    });
    setStakeStatus(s => ({ ...s, [matchId]: 'Staking...' }));
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (res: any) => {
          const created = res.objectChanges?.find((c: any) => c.objectType?.includes('::Game'));
          const id = created?.objectId || res.digest;
            fetch(`/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              message: `I'm staking ${stakeSui} SUI on ${pickTeamId} for match ${matchId}, game id ${id}`,
            }),
          });
          setStakeStatus(s => ({ ...s, [matchId]: `Staked ${stakeSui} SUI on ${pickTeamId}. Game ID: ${id}` }));
        },
        onError: (e) => setStakeStatus(s => ({ ...s, [matchId]: `Failed: ${e.message}` })),
      }
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', color: '#fff' }}>
      <h2>World Cup Predictions</h2>
      <p style={{ color: '#888' }}>Simulate upcoming matches, then stake on your pick.</p>

      {WORLD_CUP_MATCHES.map(match => {
        const teamA = TEAMS.find(t => t.id === match.teamAId)!;
        const teamB = TEAMS.find(t => t.id === match.teamBId)!;
        const result = predictions[match.id];

        return (
          <div key={match.id} style={{ background: '#111', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{teamA.name} vs {teamB.name}</strong>
              <span style={{ color: '#888' }}>{match.date}</span>
            </div>

            {simulatingId === match.id ? (
              <MatchSimulation
                teamA={teamA}
                teamB={teamB}
                onComplete={(res) => {
                  setPredictions(p => ({ ...p, [match.id]: res }));
                  setSimulatingId(null);
                }}
              />
            ) : result ? (
              <div style={{ marginTop: 12 }}>
                <p>Predicted: {teamA.name} {result.teamAScore} - {result.teamBScore} {teamB.name}</p>
                <button
                  onClick={() => stakeOnPick(match.id, result.winner === 'A' ? teamA.name : teamB.name, 0.1)}
                  style={{ marginTop: 8, padding: '8px 16px', background: '#00d4ff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  Stake 0.1 SUI on {result.winner === 'A' ? teamA.name : teamB.name}
                </button>
                {stakeStatus[match.id] && <p style={{ color: '#0f0', marginTop: 8, wordBreak: 'break-all' }}>{stakeStatus[match.id]}</p>}
              </div>
            ) : (
              <button
                onClick={() => setSimulatingId(match.id)}
                style={{ marginTop: 12, padding: '8px 16px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 6, cursor: 'pointer' }}
              >
                Simulate Match
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}