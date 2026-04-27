import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      let data = await api.get('/sessions');
      if (!data) data = await api.get('/demo/sessions');
      setSessions(data || []);
    } catch {
      try { setSessions(await api.get('/demo/sessions') || []); } catch { /* skip */ }
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading sessions...</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Session History</h1>
          <p>All past and active attendance sessions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
              style={{ fontSize: '0.8rem', padding: '8px 16px', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Classroom</th>
              <th>Date</th>
              <th>Time</th>
              <th>Verified</th>
              <th>Flagged</th>
              <th>Rejected</th>
              <th>Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const rate = s.total_enrolled > 0 ? Math.round((s.total_verified / s.total_enrolled) * 100) : 0;
              return (
                <tr
                  key={s.id || i}
                  onClick={() => navigate(`/sessions/${s.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.course_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.course_code}</div>
                  </td>
                  <td>{s.classroom_name}</td>
                  <td>{formatDate(s.started_at)}</td>
                  <td style={{ fontSize: '0.8rem' }}>{formatTime(s.started_at)}</td>
                  <td style={{ color: 'var(--verified)', fontWeight: 600 }}>{s.total_verified}</td>
                  <td style={{ color: s.total_flagged > 0 ? 'var(--flagged)' : 'var(--text-muted)', fontWeight: 600 }}>{s.total_flagged}</td>
                  <td style={{ color: s.total_rejected > 0 ? 'var(--rejected)' : 'var(--text-muted)', fontWeight: 600 }}>{s.total_rejected}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 50, height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${rate}%`, height: '100%', borderRadius: 3,
                          background: rate > 80 ? 'var(--verified)' : rate > 60 ? 'var(--flagged)' : 'var(--rejected)',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{rate}%</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No sessions found</h3>
            <p>Start a new session to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
