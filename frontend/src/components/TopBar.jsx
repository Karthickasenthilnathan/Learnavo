import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageNames = {
  '/': 'Dashboard',
  '/live-session': 'Live Session',
  '/sessions': 'Session History',
  '/anomalies': 'Anomaly Center',
  '/hod': 'HOD Dashboard',
  '/students': 'Students',
  '/settings': 'Settings',
};

export default function TopBar() {
  const { user } = useAuth();
  const location = useLocation();

  const pageName = Object.entries(pageNames).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || 'Dashboard';

  const roleLabel = user?.role === 'hod' ? 'HOD' : 'PROFESSOR';
  const roleBg = user?.role === 'hod' ? 'rgba(59,130,246,0.12)' : 'var(--verified-bg)';
  const roleColor = user?.role === 'hod' ? '#3b82f6' : 'var(--verified)';

  return (
    <div style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-secondary)',
      flexShrink: 0,
    }}>
      {/* Page title */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {pageName}
        </h2>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{
          background: roleBg, color: roleColor,
          padding: '4px 12px', borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
        }}>
          {roleLabel}
        </span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name || 'User'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {user?.department || user?.email || ''}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 800, color: 'white', flexShrink: 0,
        }}>
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}