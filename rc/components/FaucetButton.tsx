import { useState } from 'react';

export function FaucetButton() {
  const [open, setOpen] = useState(false);
  const faucets = [
    { name: 'Official Sui Faucet', url: 'https://faucet.sui.io/' },
    { name: 'n1stake Faucet (backup)', url: 'https://faucet.n1stake.com/' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 14px', borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}>
        Need test SUI?
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#111', border: '1px solid #333', borderRadius: 8, padding: 8, zIndex: 10, minWidth: 200 }}>
          {faucets.map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '6px 4px', color: '#00d4ff', textDecoration: 'none' }}>
              {f.name} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}