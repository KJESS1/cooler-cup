import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/play', label: 'Play', icon: '⚽' },
  { to: '/worldcup', label: 'World Cup', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Nav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(8,12,24,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid #1E293B',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            textDecoration: 'none', padding: '6px 16px', borderRadius: 12,
            color: isActive ? '#38BDF8' : '#64748B',
            fontWeight: isActive ? 700 : 500,
            fontSize: 11, transition: 'color 0.15s',
          })}
        >
          <span style={{ fontSize: 22 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
