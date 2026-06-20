import { useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Chat from './components/Chat';
import GameBoard from './components/GameBoard';
import VsFriendMatch from './components/VsFriendMatch';
import WorldCup from './components/WorldCup';
import { FaucetButton } from './components/FaucetButton';

export default function App() {
  const account = useCurrentAccount();
  const [view, setView] = useState<'game' | 'friend' | 'worldcup' | 'chat'>('game');

  const tabs: { key: typeof view; label: string }[] = [
    { key: 'game', label: 'Vs Frost' },
    { key: 'friend', label: 'Vs Friend' },
    { key: 'worldcup', label: 'World Cup' },
    { key: 'chat', label: 'Chat' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: 'white', fontFamily: 'sans-serif' }}>
      <header style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: '12px 16px', borderBottom: '1px solid #222',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 20, color: '#00d4ff' }}>⚽ Cooler Cup</h1>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <FaucetButton />
            <ConnectButton />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={{
                background: view === t.key ? '#00d4ff' : '#222',
                color: view === t.key ? '#000' : '#fff',
                border: 'none', padding: '8px 14px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <main style={{ padding: '16px 12px', maxWidth: 900, margin: '0 auto' }}>
        {!account ? (
          <div style={{ textAlign: 'center', marginTop: 60, padding: '0 16px' }}>
            <h2 style={{ fontSize: 20 }}>Connect your wallet to play</h2>
            <p style={{ color: '#888', fontSize: 14 }}>Stake real SUI, play vs Frost AI, win crypto</p>
          </div>
        ) : view === 'chat' ? (
          <Chat address={account.address} />
        ) : view === 'friend' ? (
          <VsFriendMatch address={account.address} />
        ) : view === 'worldcup' ? (
          <WorldCup address={account.address} />
        ) : (
          <GameBoard address={account.address} />
        )}
      </main>
    </div>
  );
}
