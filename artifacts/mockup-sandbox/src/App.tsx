import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Chat from './components/Chat';
import GameBoard from './components/GameBoard';

export default function App() {
  const account = useCurrentAccount();
  const [view, setView] = useState<'game' | 'chat'>('game');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: 'white', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #222' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#00d4ff' }}>⚽ Cooler Cup</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setView('game')} style={{ background: view === 'game' ? '#00d4ff' : '#222', color: view === 'game' ? '#000' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Game</button>
          <button onClick={() => setView('chat')} style={{ background: view === 'chat' ? '#00d4ff' : '#222', color: view === 'chat' ? '#000' : '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Chat Frost</button>
          <ConnectButton />
        </div>
      </header>
      <main style={{ padding: 24 }}>
        {!account ? (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <h2>Connect your wallet to play</h2>
            <p style={{ color: '#888' }}>Stake real SUI, play vs Frost AI, win crypto</p>
          </div>
        ) : (
          view === 'chat' ? <Chat address={account.address} /> : <GameBoard address={account.address} />
        )}
      </main>
    </div>
  );
}
