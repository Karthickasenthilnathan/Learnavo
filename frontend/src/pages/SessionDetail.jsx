import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadSession(); }, [id]);

  async function loadSession() {
    try {
      let data = await api.get(`/sessions/${id}`);
      if (!data) data = await api.get(`/demo/session/${id}`);
      setSession(data);
    } catch {
      try { setSession(await api.get(`/demo/session/${id}`)); } catch { /* skip */ }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading session...</p></div>;
  }

  if (!session) {
    return <div className="empty-state"><div className="icon">❌</div><h3>Session not found</h3></div>;
  }

  const statusCounts = [
    { name: 'Verified', value: session.total_verified || 0, color: '#10b981' },
    { name: 'Flagged', value: session.total_flagged || 0, color: '#f59e0b' },
    { name: 'Rejected', value: session.total_rejected || 0, color: '#ef4444' },
    { name: 'Absent', value: Math.max(0, (session.total_enrolled || 0) - (session.total_verified || 0) - (session.total_flagged || 0) - (session.total_rejected || 0)), color: '#64748b' },
  ].filter(s => s.value > 0);

  const rssiData = (session.attendance || [])
    .filter(a => a.rssi_median)
    .map(a => ({ name: a.student_name?.split(' ')[0], rssi: Math.abs(a.rssi_median), status: a.status }));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/sessions')} style={{ marginBottom: 8, fontSize: '0.8rem' }}>
            ← Back to Sessions
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{session.course_name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {session.course_code} · {session.classroom_name} · {new Date(session.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`badge badge-${session.status}`}>{session.status}</span>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{session.total_enrolled || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Enrolled</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--verified)' }}>{session.total_verified || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Verified</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--flagged)' }}>{session.total_flagged || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Flagged</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--rejected)' }}>{session.total_rejected || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rejected</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--info)' }}>
            {session.total_enrolled > 0 ? Math.round((session.total_verified / session.total_enrolled) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rate</div>
        </div>
      </div>

      <div className="content-grid">
        {/* Attendance Distribution Pie */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Attendance Distribution</h3>
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111438', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: '0.8rem', color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
            {statusCounts.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RSSI Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>RSSI Signal Strength</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>BLE proximity readings per student (lower = closer)</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rssiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: '|RSSI| dBm', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#111438', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: '0.8rem', color: '#f1f5f9' }}
                  formatter={(val) => [`${val} dBm`, 'Signal']}
                />
                <Bar dataKey="rssi" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="glass-card" style={{ marginTop: 20, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Attendance Records</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Individual student verification results</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Enrollment</th>
              <th>QR Gate</th>
              <th>BLE Gate</th>
              <th>RSSI</th>
              <th>Attempts</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(session.attendance || []).map((a, i) => (
              <tr key={a.id || i}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.student_name}</td>
                <td>{a.enrollment}</td>
                <td>
                  <span style={{ color: a.qr_verified ? 'var(--verified)' : 'var(--rejected)', fontWeight: 600 }}>
                    {a.qr_verified ? '✓ Pass' : '✕ Fail'}
                  </span>
                </td>
                <td>
                  <span style={{ color: a.ble_verified ? 'var(--verified)' : 'var(--rejected)', fontWeight: 600 }}>
                    {a.ble_verified ? '✓ Pass' : '✕ Fail'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  {a.rssi_median ? `${a.rssi_median} dBm` : '—'}
                </td>
                <td style={{ color: a.scan_attempts > 1 ? 'var(--flagged)' : 'var(--text-secondary)' }}>
                  {a.scan_attempts || 1}
                </td>
                <td style={{ fontSize: '0.8rem' }}>
                  {a.scanned_at ? new Date(a.scanned_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                </td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Anomaly Flags */}
      {session.anomaly_flags?.length > 0 && (
        <div className="glass-card" style={{ marginTop: 20, padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🚨 Anomaly Flags
            <span className="badge badge-rejected">{session.anomaly_flags.length}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {session.anomaly_flags.map((flag, i) => (
              <div key={flag.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: flag.severity > 0.8 ? 'var(--rejected-bg)' : 'var(--flagged-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {flag.severity > 0.8 ? '🔴' : '🟡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {flag.flag_type?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {flag.student_name} — {flag.details?.message}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  background: flag.severity > 0.8 ? 'var(--rejected-bg)' : 'var(--flagged-bg)',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: flag.severity > 0.8 ? 'var(--rejected)' : 'var(--flagged)',
                }}>
                  {Math.round(flag.severity * 100)}% risk
                </div>
                <span className={`badge ${flag.resolved ? 'badge-completed' : 'badge-rejected'}`}>
                  {flag.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
