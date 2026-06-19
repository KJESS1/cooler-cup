 import { useState } from 'react';
 import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
 import Chat from './components/Chat';
 import GameBoard from './components/GameBoard';
 import VsFriendMatch from './components/VsFriendMatch';

 export default function App() {
   const account = useCurrentAccount();
   const [view, setView] = useState<'game' | 'friend' | 'chat'>('game');

   const tabs: { key: typeof view; label: string }[] = [
     { key: 'game', label: 'Vs Frost' },
     { key: 'friend', label: 'Vs Friend' },
     { key: 'chat', label: 'Chat Frost' },
   ];

   return (
     <div style={{ minHeight: '100vh', background: '#0a0a1a', color: 'white', fontFamily: 'sans-serif' }}>
       <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #222' }}>
         <h1 style={{ margin: 0, fontSize: 24, color: '#00d4ff' }}>⚽ Cooler Cup</h1>
         <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
           {tabs.map(t => (
             <button
               key={t.key}
               onClick={() => setView(t.key)}
               style={{
                 background: view === t.key ? '#00d4ff' : '#222',
                 color: view === t.key ? '#000' : '#fff',
                 border: 'none',
                 padding: '8px 16px',
                 borderRadius: 8,
                 cursor: 'pointer',
               }}
             >
               {t.label}
             </button>
           ))}
           <ConnectButton />
         </div>
       </header>
       <main style={{ padding: 24 }}>
         {!account ? (
           <div style={{ textAlign: 'center', marginTop: 80 }}>
             <h2>Connect your wallet to play</h2>
             <p style={{ color: '#888' }}>Stake real SUI, play vs Frost AI, win crypto</p>
           </div>
         ) : view === 'chat' ? (
           <Chat address={account.address} />
         ) : view === 'friend' ? (
           <VsFriendMatch address={account.address} />
         ) : (
           <GameBoard address={account.address} />
         )}
       </main>
     </div>
   );
 }