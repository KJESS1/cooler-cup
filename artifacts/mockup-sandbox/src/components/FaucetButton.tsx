import { useState } from 'react';

const FAUCETS = [
  { name: 'Official Sui Faucet', url: 'https://faucet.sui.io/' },
  { name: 'n1stake Faucet (backup)', url: 'https://faucet.n1stake.com/' },
];

export function FaucetButton() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 14px', borderRadius: 8, background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}>
        Need test SUI?
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, padding: 8, zIndex: 10, minWidth: 220 }}>
          {FAUCETS.map(f => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '6px 4px', textDecoration: 'none', color: '#00d4ff' }}>
              {f.name} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
