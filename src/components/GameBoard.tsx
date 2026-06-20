import { useState, useEffect } from 'react';
 import { TEAMS, Team } from '../game/teams';
 import { MatchSimulation } from './MatchSimulation';
 import { MatchResult } from '../game/MatchScene';

 interface Props {
   address: string;
 }

 export default function GameBoard({ address }: Props) {
   const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
   const [gameState, setGameState] = useState<'select' | 'playing' | 'result'>('select');
   const [result, setResult] = useState<MatchResult | null>(null);
   const [bias, setBias] = useState(0.5);
   const [frostLine, setFrostLine] = useState('');
   const agentTeam = TEAMS.find(t => t.id !== selectedTeam?.id) || TEAMS[1];

   useEffect(() => {
       fetch(`/api/memory/${address}`)
       .then(r => r.json())
       .then(mem => {
         const winRate = mem.gamesPlayed > 0 ? mem.wins / mem.gamesPlayed : 0.5;
         setBias(Math.max(0.25, 0.55 - winRate * 0.3));
         if (mem.gamesPlayed > 0) {
           setFrostLine(`Frost recalls: you're ${mem.wins}W-${mem.losses}L. Adjusting difficulty...`);
         } else {
           setFrostLine("Fresh blood. Let's see what you've got.");
         }
       });
   }, [address]);

   async function handleResult(res: MatchResult) {
     setResult(res);
     setGameState('result');
     const won = res.winner === 'A';
       const r = await fetch(`/api/play`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         address,
         won,
         team: selectedTeam?.name,
         playerPicks: [],
         agentPicks: [],
       }),
     });
     const data = await r.json();
     setFrostLine(won
       ? `You won ${res.teamAScore}-${res.teamBScore}. Don't get comfortable. (Memory saved)`
       : `I won ${res.teamBScore}-${res.teamAScore}. Come back when you're ready. (Memory saved)`
     );
   }

   if (gameState === 'select') {
     return (
       <div style={{ maxWidth: 800, margin: '0 auto' }}>
         {frostLine && (
           <div style={{ background: '#111', border: '1px solid #00d4ff', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#00d4ff' }}>
             🤖 Frost: {frostLine}
           </div>
         )}
         <h2 style={{ color: '#fff', marginBottom: 16 }}>Pick Your Team</h2>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
           {TEAMS.map(team => (
             <button
               key={team.id}
               onClick={() => { setSelectedTeam(team); setGameState('playing'); }}
               style={{
                 background: team.primaryColor,
                 color: team.secondaryColor,
                 border: '2px solid #444',
                 borderRadius: 10,
                 padding: '20px 8px',
                 cursor: 'pointer',
                 fontWeight: 'bold',
                 fontSize: 14,
               }}
             >
               {team.name}
             </button>
           ))}
         </div>
       </div>
     );
   }

   if (gameState === 'playing' && selectedTeam) {
     return (
       <div>
         <div style={{ textAlign: 'center', color: '#888', marginBottom: 12 }}>
           {frostLine}
         </div>
         <MatchSimulation
           teamA={selectedTeam}
           teamB={agentTeam}
           teamABias={bias}
           onComplete={handleResult}
         />
       </div>
     );
   }

   if (gameState === 'result' && result) {
     return (
       <div style={{ textAlign: 'center', maxWidth: 600, margin: '60px auto' }}>
         <h2 style={{ color: '#00d4ff', fontSize: 32 }}>
           {result.winner === 'A' ? '🏆 You Won!' : result.winner === 'B' ? '😤 Frost Wins' : '🤝 Draw'}
         </h2>
         <p style={{ fontSize: 48, fontWeight: 'bold', color: '#fff' }}>
           {result.teamAScore} - {result.teamBScore}
         </p>
         <div style={{ background: '#111', border: '1px solid #00d4ff', borderRadius: 8, padding: '12px 16px', margin: '20px 0', color: '#00d4ff' }}>
           🤖 Frost: {frostLine}
         </div>
         <button
           onClick={() => { setGameState('select'); setResult(null); }}
           style={{ background: '#00d4ff', color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}
         >
           Play Again
         </button>
       </div>
     );
   }

   return null;
 }