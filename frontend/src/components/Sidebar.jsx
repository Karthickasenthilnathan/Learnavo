import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/live-session', label: 'Live Session', icon: '📡' },
  { to: '/sessions', label: 'Session History', icon: '📜' },
  { to: '/anomalies', label: 'Anomaly Center', icon: '🚨' },
  { to: '/students', label: 'Students', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: 'white', flexShrink: 0,
          }}>L</div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              LearnAvo
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--emerald-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Attendance System
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              background: isActive ? 'var(--bg-glass)' : 'transparent',
              color: isActive ? 'var(--emerald-400)' : 'var(--text-secondary)',
              borderLeft: isActive ? '3px solid var(--emerald-500)' : '3px solid transparent',
            })}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            background: 'transparent', color: 'var(--text-muted)',
            fontSize: '0.875rem', fontWeight: 500,
            transition: 'all var(--transition-fast)', cursor: 'pointer',
            border: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = 'var(--rejected)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}