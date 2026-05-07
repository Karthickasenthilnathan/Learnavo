import { useState, useEffect } from 'react';
import api from '../api/client';
import { STUDENTS } from '../data/institutionData';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('name');

  useEffect(() => { loadStudents(); }, []);

  async function loadStudents() {
    try {
      const res = await api.get('/dashboard/students');
      setStudents(res.data?.length ? res.data : STUDENTS);
    } catch {
      try {
        const res = await api.get('/demo/students');
        setStudents(res.data?.length ? res.data : STUDENTS);
      } catch { setStudents(STUDENTS); }
    } finally {
      setLoading(false);
    }
  }

  const filtered = students
    .filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name')       return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'risk')       return (b.avg_risk_score || 0) - (a.avg_risk_score || 0);
      if (sortBy === 'attendance') return (b.attended_sessions || 0) - (a.attended_sessions || 0);
      if (sortBy === 'flags')      return (b.active_flags || 0) - (a.active_flags || 0);
      return 0;
    });

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading students…</p></div>;
  }

  // Summary metrics
  const totalStudents = students.length;
  const highRisk      = students.filter(s => s.avg_risk_score > 0.6).length;
  const belowThreshold = students.filter(s => {
    const pct = s.total_sessions > 0 ? (s.attended_sessions / s.total_sessions) * 100 : 100;
    return pct < 75;
  }).length;
  const activeFlags   = students.reduce((a, s) => a + (s.active_flags || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Students</h1>
        <p>Student roster with attendance and integrity risk profiles</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Students',   value: totalStudents,   color: 'var(--info)' },
          { label: 'High Risk',        value: highRisk,        color: 'var(--rejected)' },
          { label: 'Below 75%',        value: belowThreshold,  color: 'var(--flagged)' },
          { label: 'Active Flags',     value: activeFlags,     color: 'var(--flagged)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ flex: 1, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            id="student-search"
            type="text"
            placeholder="Search by name, enrollment, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 36 }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.5 }}>🔍</span>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '10px 14px', minWidth: 170 }}
        >
          <option value="name">Sort by Name</option>
          <option value="risk">Sort by Risk Score</option>
          <option value="attendance">Sort by Attendance</option>
          <option value="flags">Sort by Active Flags</option>
        </select>
      </div>

      {/* Student Grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}
        className="stagger-children"
      >
        {filtered.map((student, i) => {
          const attendPct = student.total_sessions > 0
            ? Math.round((student.attended_sessions / student.total_sessions) * 100) : 0;
          const riskLevel = student.avg_risk_score > 0.6 ? 'high' : student.avg_risk_score > 0.3 ? 'medium' : 'low';
          const riskColor = riskLevel === 'high' ? 'var(--rejected)' : riskLevel === 'medium' ? 'var(--flagged)' : 'var(--verified)';

          return (
            <div key={student.id || i} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-full)',
                  background: `linear-gradient(135deg, ${riskColor}30, ${riskColor}10)`,
                  border: `2px solid ${riskColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 700, color: riskColor, flexShrink: 0,
                }}>
                  {student.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.enrollment} · {student.email}</div>
                </div>
                {student.active_flags > 0 && (
                  <span className="badge badge-rejected" style={{ fontSize: '0.65rem' }}>
                    {student.active_flags} flag{student.active_flags > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Attendance</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: attendPct >= 75 ? 'var(--verified)' : 'var(--rejected)' }}>{attendPct}%</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{student.attended_sessions}/{student.total_sessions}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Risk</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: riskColor }}>{Math.round(student.avg_risk_score * 100)}%</div>
                  <div style={{ fontSize: '0.68rem', color: riskColor, textTransform: 'capitalize' }}>{riskLevel}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Flags</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: student.active_flags > 0 ? 'var(--flagged)' : 'var(--text-secondary)' }}>{student.active_flags}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>active</div>
                </div>
              </div>

              {/* Attendance bar */}
              <div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${attendPct}%`, height: '100%', borderRadius: 3,
                    background: attendPct >= 75 ? 'var(--verified)' : attendPct >= 60 ? 'var(--flagged)' : 'var(--rejected)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                {attendPct < 80 && attendPct >= 70 && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--flagged)', marginTop: 4, fontWeight: 600 }}>⚠ Approaching 75% threshold</div>
                )}
                {attendPct < 70 && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--rejected)', marginTop: 4, fontWeight: 600 }}>🔴 Below 75% threshold</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No students found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
