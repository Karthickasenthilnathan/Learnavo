import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/client';

const FLAG_ICONS = {
  duplicate_device: '📱',
  token_reuse: '🔄',
  cluster_sync: '👥',
  weak_presence: '📶',
  chronic_proxy: '🎭',
};

const FLAG_COLORS = {
  duplicate_device: '#ef4444',
  token_reuse: '#f59e0b',
  cluster_sync: '#3b82f6',
  weak_presence: '#8b5cf6',
  chronic_proxy: '#ef4444',
};

export default function AnomalyCenter() {
  const [flags, setFlags] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('flags');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      let f = null, r = null;
      // Try real endpoints first, then fall back to demo
      try { f = await api.get('/anomaly/flags'); } catch {
        try { f = await api.get('/demo/anomaly-flags'); } catch { /* skip */ }
      }
      try { r = await api.get('/anomaly/risk-scores'); } catch {
        try { r = await api.get('/demo/risk-scores'); } catch { /* skip */ }
      }
      setFlags(f || []);
      setRiskScores(r || []);
    } catch { /* skip */ }
    finally { setLoading(false); }
  }

  const filteredFlags = filter === 'all' ? flags : 
    filter === 'active' ? flags.filter(f => !f.resolved) :
    filter === 'resolved' ? flags.filter(f => f.resolved) :
    flags.filter(f => f.flag_type === filter);

  // Flag type breakdown
  const typeBreakdown = {};
  flags.forEach(f => {
    typeBreakdown[f.flag_type] = (typeBreakdown[f.flag_type] || 0) + 1;
  });
  const pieData = Object.entries(typeBreakdown).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count,
    color: FLAG_COLORS[type] || '#64748b',
  }));

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading anomalies...</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Anomaly Center</h1>
        <p>Real-time anomaly detection, flags, and risk analysis</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--rejected)' }}>{flags.filter(f => !f.resolved).length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Flags</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--verified)' }}>{flags.filter(f => f.resolved).length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Resolved</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--flagged)' }}>
            {flags.length > 0 ? Math.round(flags.reduce((s, f) => s + f.severity, 0) / flags.length * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Severity</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--info)' }}>{riskScores.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Risk Profiles</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['flags', 'risk-scores'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t)} style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>
            {t === 'flags' ? '🚨 Anomaly Flags' : '📊 Risk Scores'}
          </button>
        ))}
      </div>

      {tab === 'flags' ? (
        <div className="content-grid" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* Flags list */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'active', 'resolved', ...Object.keys(typeBreakdown)].map(f => (
                <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                  style={{ fontSize: '0.72rem', padding: '6px 12px', textTransform: 'capitalize' }}>
                  {f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredFlags.map((flag, i) => (
                <div key={flag.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                  opacity: flag.resolved ? 0.6 : 1,
                  transition: 'all var(--transition-fast)',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: `${FLAG_COLORS[flag.flag_type]}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {FLAG_ICONS[flag.flag_type] || '⚠'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {flag.flag_type?.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {flag.student_name} · {flag.enrollment}
                    </div>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-full)',
                    border: `3px solid ${flag.severity > 0.8 ? 'var(--rejected)' : flag.severity > 0.5 ? 'var(--flagged)' : 'var(--info)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                    color: flag.severity > 0.8 ? 'var(--rejected)' : flag.severity > 0.5 ? 'var(--flagged)' : 'var(--info)',
                  }}>
                    {Math.round(flag.severity * 100)}
                  </div>
                  <span className={`badge ${flag.resolved ? 'badge-completed' : 'badge-rejected'}`}>
                    {flag.resolved ? 'Resolved' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie chart */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Flag Distribution</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111438', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: '0.8rem', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{d.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Risk Scores Tab */
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrollment</th>
                <th>Course</th>
                <th>Risk Score</th>
                <th>RSSI</th>
                <th>Timing</th>
                <th>History</th>
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {riskScores.map((rs, i) => (
                <tr key={rs.id || i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rs.student_name}</td>
                  <td>{rs.enrollment}</td>
                  <td>{rs.course_code}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${rs.score * 100}%`, height: '100%', borderRadius: 3,
                          background: rs.score > 0.7 ? 'var(--rejected)' : rs.score > 0.4 ? 'var(--flagged)' : 'var(--verified)',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: rs.score > 0.7 ? 'var(--rejected)' : rs.score > 0.4 ? 'var(--flagged)' : 'var(--verified)' }}>
                        {Math.round(rs.score * 100)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{Math.round((rs.factors?.rssi_consistency || 0) * 100)}%</td>
                  <td style={{ fontSize: '0.8rem' }}>{Math.round((rs.factors?.scan_timing || 0) * 100)}%</td>
                  <td style={{ fontSize: '0.8rem' }}>{Math.round((rs.factors?.historical_flags || 0) * 100)}%</td>
                  <td>
                    <span className={`badge ${rs.score > 0.7 ? 'badge-rejected' : rs.score > 0.4 ? 'badge-flagged' : 'badge-verified'}`}>
                      {rs.score > 0.7 ? 'High Risk' : rs.score > 0.4 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
