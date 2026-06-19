import type { Zone } from '../lib/api';

interface Props {
  selected: Zone | null;
  onSelect: (z: Zone) => void;
  label: string;
  disabled?: boolean;
}

const zones: { zone: Zone; label: string; style: React.CSSProperties }[] = [
  { zone: 'TL', label: 'Top Left', style: { gridColumn: '1', gridRow: '1' } },
  { zone: 'C',  label: 'Centre',   style: { gridColumn: '2', gridRow: '1 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
  { zone: 'TR', label: 'Top Right',style: { gridColumn: '3', gridRow: '1' } },
  { zone: 'BL', label: 'Bot Left', style: { gridColumn: '1', gridRow: '2' } },
  { zone: 'BR', label: 'Bot Right',style: { gridColumn: '3', gridRow: '2' } },
];

export default function GoalGrid({ selected, onSelect, label, disabled }: Props) {
  return (
    <div>
      <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>

      {/* Goalposts */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '80px 80px',
          gap: 6, padding: 10,
          background: 'linear-gradient(180deg, #1a2744 0%, #0F172A 100%)',
          border: '3px solid #fff',
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          position: 'relative',
        }}>
          {/* Net lines */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 24px)'
          }} />
          {zones.map(({ zone, label: zLabel, style }) => (
            <button
              key={zone}
              onClick={() => !disabled && onSelect(zone)}
              disabled={disabled}
              style={{
                ...style,
                background: selected === zone
                  ? 'rgba(56,189,248,0.35)'
                  : 'rgba(255,255,255,0.04)',
                border: selected === zone
                  ? '2px solid #38BDF8'
                  : '2px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: selected === zone ? '#38BDF8' : '#64748B',
                fontSize: 11, fontWeight: 700,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.15s',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {zone}
            </button>
          ))}
        </div>
        {/* Ground */}
        <div style={{ height: 6, background: '#4ADE80', borderRadius: '0 0 4px 4px', border: '3px solid #fff', borderTop: 'none' }} />
      </div>
    </div>
  );
}
