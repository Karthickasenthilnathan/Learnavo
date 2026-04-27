import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import StatsCard from '../components/StatsCard';
import api from '../api/client';

export default function HodDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      let d = await api.get('/dashboard/hod');
      if (!d) d = await api.get('/demo/hod');
      setData(d);
    } catch {
      try { setData(await api.get('/demo/hod')); } catch { /* skip */ }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading HOD dashboard...</p></div>;
  }

  const dept = data?.department || {};
  const flagDist = (data?.flag_distribution || []).map(f => ({
    type: f.flag_type?.replace(/_/g, ' '),
    count: f.count,
    severity: Math.round(f.avg_severity * 100),
  }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🏛️ HOD Dashboard</h1>
        <p>Department-wide attendance analytics and integrity monitoring</p>
      </div>

      {/* Department KPIs */}
      <div className="stats-grid stagger-children">
        <StatsCard icon="📅" label="Total Sessions" value={dept.total_sessions || 42} subtext="across all courses" color="blue" />
        <StatsCard icon="📚" label="Active Courses" value={dept.total_courses || 3} subtext="this semester" color="emerald" />
        <StatsCard icon="🎓" label="Total Students" value={dept.total_students || 156} subtext="enrolled" color="emerald" />
        <StatsCard icon="👩‍🏫" label="Professors" value={dept.total_professors || 2} subtext="faculty members" color="blue" />
      </div>

      <div className="content-grid">
        {/* Course Comparison */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Course Attendance Comparison</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Average attendance rate by course</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.course_comparison || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="code" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: '#111438', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: '0.8rem', color: '#f1f5f9' }}
                  formatter={(val) => [`${val}%`, 'Avg Attendance']}
                />
                <Bar dataKey="avg_attendance" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flag Type Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Anomaly Flag Distribution</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Types and severity of detected anomalies</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flagDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111438', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: '0.8rem', color: '#f1f5f9' }} />
                <Bar dataKey="count" name="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High Risk Students */}
      <div className="glass-card" style={{ marginTop: 20, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>🚨 Chronic Proxy Risk Leaderboard</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Students with consistently elevated risk scores — escalated for review</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {(data?.high_risk_students || []).map((student, i) => (
            <div key={student.id || i} style={{
              padding: '18px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all var(--transition-fast)',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-full)',
                border: `3px solid ${student.avg_risk > 0.6 ? 'var(--rejected)' : 'var(--flagged)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 800,
                color: student.avg_risk > 0.6 ? 'var(--rejected)' : 'var(--flagged)',
                flexShrink: 0,
              }}>
                #{i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.enrollment}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '1.1rem', fontWeight: 700,
                  color: student.avg_risk > 0.6 ? 'var(--rejected)' : 'var(--flagged)',
                }}>
                  {Math.round(student.avg_risk * 100)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.total_flags} flags</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
