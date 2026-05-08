import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatsCard from '../components/StatsCard';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      let data = await api.get('/dashboard/stats');
      if (!data) data = await api.get('/demo/stats');
      setStats(data);
    } catch {
      try { setStats(await api.get('/demo/stats')); } catch { /* empty */ }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p></div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your attendance sessions and analytics</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/live-session')}>
          📡 Start New Session
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid stagger-children">
        <StatsCard icon="📅" label="Today's Sessions" value={stats?.today_sessions ?? 0} subtext="sessions scheduled" color="blue" />
        <StatsCard icon="👥" label="Total Students" value={stats?.total_students ?? 0} subtext="enrolled across courses" color="emerald" />
        <StatsCard icon="📈" label="Avg Attendance" value={`${stats?.avg_attendance ?? 0}%`} subtext="vs last month" trend={3.2} color="emerald" />
        <StatsCard icon="🚨" label="Active Flags" value={stats?.active_flags ?? 0} subtext="unresolved anomalies" color={stats?.active_flags > 5 ? 'red' : 'amber'} />
      </div>

      {/* Charts and sessions */}
      <div className="content-grid">
        {/* Attendance Trend */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Attendance Trend</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Last 14 days average</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.attendance_trend || []}>
                <defs>
                  <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[50, 100]} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: '#111438', border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: 10, fontSize: '0.8rem', color: '#f1f5f9',
                  }}
                  formatter={(val) => [`${val}%`, 'Attendance']}
                />
                <Area type="monotone" dataKey="avg_pct" stroke="#10b981" strokeWidth={2} fill="url(#attendGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: '#050816', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Recent Sessions</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Latest attendance sessions</p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/sessions')} style={{ fontSize: '0.78rem' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(stats?.recent_sessions || []).map((session, i) => (
              <div
                key={session.id || i}
                onClick={() => navigate(`/sessions/${session.id}`)}
                style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--radius-md)',
                  background: session.status === 'active' ? 'var(--info-bg)' : 'var(--verified-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {session.status === 'active' ? '📡' : '✅'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.course_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>{session.course_code}</span>
                    <span>·</span>
                    <span>{session.classroom_name}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--emerald-400)' }}>
                    {session.total_verified}/{session.total_enrolled}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {session.total_flagged > 0 && <span style={{ color: 'var(--flagged)' }}>{session.total_flagged} flagged</span>}
                  </div>
                </div>
                <span className={`badge badge-${session.status === 'active' ? 'active' : 'completed'}`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
