import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client';

export default function LiveSession() {
  const [step, setStep] = useState('setup'); // setup | active
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [session, setSession] = useState(null);

  const [attendanceFeed, setAttendanceFeed] = useState([]);
  const [anomalyFeed, setAnomalyFeed] = useState([]);
  const [stats, setStats] = useState({ verified: 0, flagged: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  // Deduplication: track seen events to avoid double-counting
  const seenEventsRef = useRef(new Set());
  const socketRef = useRef(null);

  const navigate = useNavigate();

  // Load courses and classrooms
  useEffect(() => {
    async function load() {
      try {
        let c = await api.get('/dashboard/courses');
        if (!c) c = await api.get('/demo/courses');
        setCourses(c || []);
      } catch {
        try { setCourses(await api.get('/demo/courses') || []); } catch { /* skip */ }
      }
      try {
        let r = await api.get('/dashboard/classrooms');
        if (!r) r = await api.get('/demo/classrooms');
        setClassrooms(r || []);
      } catch {
        try { setClassrooms(await api.get('/demo/classrooms') || []); } catch { /* skip */ }
      }
    }
    load();
  }, []);

  // Direct WebSocket connection — activates when session goes live
  useEffect(() => {
    if (step !== 'active' || !session?.id) return;

    console.log('[LiveSession] Connecting WebSocket for session:', session.id);
    const s = io('http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;

    s.on('connect', () => {
      console.log('[LiveSession] ✅ WebSocket connected:', s.id);
      s.emit('session:join', session.id);
      s.emit('dashboard:live:join');
    });

    s.on('session:student_verified', (data) => {
      console.log('[LiveSession] 📡 Received student_verified:', data);
      // Deduplicate
      const eventKey = `${data.student?.id}_${data.timestamp}`;
      if (seenEventsRef.current.has(eventKey)) {
        console.log('[LiveSession] Duplicate event, skipping');
        return;
      }
      seenEventsRef.current.add(eventKey);
      if (seenEventsRef.current.size > 200) {
        seenEventsRef.current = new Set(Array.from(seenEventsRef.current).slice(-100));
      }

      setAttendanceFeed(prev => [data, ...prev]);
      setStats(prev => ({
        ...prev,
        [data.status]: (prev[data.status] || 0) + 1,
        total: prev.total + 1,
      }));
    });

    s.on('session:anomaly_flag', (data) => {
      console.log('[LiveSession] 🚨 Received anomaly_flag:', data);
      setAnomalyFeed(prev => [data, ...prev]);
    });

    s.on('session:ended', () => {
      setStep('setup');
      setSession(null);
    });

    s.on('connect_error', (err) => {
      console.error('[LiveSession] ❌ WebSocket connect error:', err.message);
    });

    return () => {
      console.log('[LiveSession] Disconnecting WebSocket');
      s.emit('session:leave', session.id);
      s.emit('dashboard:live:leave');
      s.disconnect();
      socketRef.current = null;
    };
  }, [step, session?.id]);
  async function startSession() {
    if (!selectedCourse || !selectedClassroom) return;
    setLoading(true);
    try {
      const s = await api.post('/sessions/start', {
        course_id: parseInt(selectedCourse),
        classroom_id: parseInt(selectedClassroom),
      });
      setSession(s);
      setStep('active');
      setStats({ verified: 0, flagged: 0, rejected: 0, total: s.total_enrolled || 0 });
    } catch {
      // Demo mode
      const course = courses.find(c => c.id === parseInt(selectedCourse));
      const classroom = classrooms.find(c => c.id === parseInt(selectedClassroom));
      const demoSession = {
        id: Date.now(),
        course_name: course?.name || 'Demo Course',
        course_code: course?.code || 'CSX01',
        classroom_name: classroom?.name || 'Demo Room',
        total_enrolled: course?.enrolled_count || 60,
        status: 'active',
      };
      setSession(demoSession);
      setStep('active');
      setStats({ verified: 0, flagged: 0, rejected: 0, total: demoSession.total_enrolled });
      
      // Simulate student verifications
      simulateStudents(demoSession);
    } finally {
      setLoading(false);
    }
  }

  function simulateStudents(sess) {
    const students = [
      'Arjun Patel', 'Meera Reddy', 'Vikram Singh', 'Deepa Nair', 'Rohan Gupta',
      'Sneha Iyer', 'Amit Joshi', 'Kavya Pillai', 'Harsh Mehta', 'Priyanka Das',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= students.length) { clearInterval(interval); return; }
      const statuses = ['verified', 'verified', 'verified', 'verified', 'verified', 'flagged', 'rejected'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const student = {
        student: { id: idx + 4, name: students[idx] },
        status,
        qr_verified: status !== 'rejected',
        ble_verified: status === 'verified',
        rssi_median: -50 - Math.floor(Math.random() * 25),
        timestamp: new Date().toISOString(),
      };
      setAttendanceFeed(prev => [student, ...prev]);
      setStats(prev => ({ ...prev, [status]: prev[status] + 1 }));
      
      // Occasional anomaly
      if (status === 'flagged' || Math.random() < 0.15) {
        const types = ['weak_presence', 'cluster_sync', 'duplicate_device'];
        setAnomalyFeed(prev => [{
          flag_type: types[Math.floor(Math.random() * types.length)],
          severity: Math.round((0.5 + Math.random() * 0.4) * 100) / 100,
          student: student.student,
          details: { message: `Anomaly: ${types[0].replace(/_/g, ' ')}` },
          timestamp: new Date().toISOString(),
        }, ...prev]);
      }
      idx++;
    }, 2000 + Math.random() * 3000);
    
    return () => clearInterval(interval);
  }

  async function endSession() {
    try {
      await api.post(`/sessions/${session.id}/end`);
    } catch { /* demo mode */ }
    setStep('setup');
    setSession(null);
    setAttendanceFeed([]);
    setAnomalyFeed([]);
    navigate('/sessions');
  }

  // ---- SETUP STEP ----
  if (step === 'setup') {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Start Live Session</h1>
          <p>Configure and launch a new attendance verification session</p>
        </div>

        <div style={{ maxWidth: 560 }}>
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Course
              </label>
              <select
                id="select-course"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                style={{ width: '100%', padding: '12px 14px' }}
              >
                <option value="">Choose a course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.enrolled_count} students)</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Classroom
              </label>
              <select
                id="select-classroom"
                value={selectedClassroom}
                onChange={e => setSelectedClassroom(e.target.value)}
                style={{ width: '100%', padding: '12px 14px' }}
              >
                <option value="">Choose a classroom...</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.building} ({c.beacon_status === 'active' ? '🟢 Beacon Active' : '🔴 Beacon Inactive'})</option>
                ))}
              </select>
            </div>

            {/* Verification info */}
            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-glass)', border: '1px solid var(--border-accent)',
              marginBottom: 24,
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--emerald-400)', marginBottom: 8 }}>
                ⚡ Dual-Gate Verification Active
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <div>🔐 Gate 1: HMAC-signed dynamic QR (rotates every 30s)</div>
                <div>📶 Gate 2: BLE proximity sensing (RSSI median threshold)</div>
                <div>🔍 Anomaly Engine: Real-time Layer 1 detection enabled</div>
              </div>
            </div>

            <button
              id="start-session-btn"
              className="btn btn-primary"
              disabled={!selectedCourse || !selectedClassroom || loading}
              onClick={startSession}
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Starting...</> : '📡 Start Live Session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- ACTIVE SESSION ----
  const enrolledCount = session?.total_enrolled || stats.total || 60;
  const verifiedPct = enrolledCount > 0 ? Math.round((stats.verified / enrolledCount) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Live Session</h1>
            <span className="badge badge-active" style={{ animation: 'pulse-glow 2s infinite' }}>● LIVE</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {session?.course_name || session?.course_code} · {session?.classroom_name}
          </p>
        </div>
        <button className="btn btn-danger" onClick={endSession}>⏹ End Session</button>
      </div>

      {/* Stats bar */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--emerald-400)' }}>{stats.verified}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Verified</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--flagged)' }}>{stats.flagged}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Flagged</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--rejected)' }}>{stats.rejected}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rejected</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--info)' }}>{verifiedPct}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attendance</div>
        </div>
      </div>

      {/* Main content: Feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Attendance Feed */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: 520 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋 Attendance Feed</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              {attendanceFeed.length} scans
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attendanceFeed.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="icon">📡</div>
                <p style={{ color: 'var(--text-muted)' }}>Waiting for students to scan...</p>
              </div>
            ) : (
              attendanceFeed.map((item, i) => (
                <div key={i} className="animate-slide-right" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                  animationDelay: `${i * 0.05}s`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-full)',
                    background: item.status === 'verified' ? 'var(--verified-bg)' : item.status === 'flagged' ? 'var(--flagged-bg)' : 'var(--rejected-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0,
                  }}>
                    {item.status === 'verified' ? '✓' : item.status === 'flagged' ? '⚠' : '✕'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.student?.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                      <span>QR {item.qr_verified ? '✓' : '✕'}</span>
                      <span>·</span>
                      <span>BLE {item.ble_verified ? '✓' : '✕'}</span>
                      {item.rssi_median && <><span>·</span><span>{item.rssi_median} dBm</span></>}
                    </div>
                  </div>
                  <span className={`badge badge-${item.status}`} style={{ fontSize: '0.65rem' }}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anomaly Alerts */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: 520 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🚨 Anomaly Alerts</span>
            {anomalyFeed.length > 0 && (
              <span className="badge badge-rejected" style={{ fontSize: '0.65rem' }}>{anomalyFeed.length}</span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {anomalyFeed.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="icon">✅</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No anomalies detected</p>
              </div>
            ) : (
              anomalyFeed.map((flag, i) => (
                <div key={i} className="animate-slide-right" style={{
                  padding: '12px', borderRadius: 'var(--radius-md)',
                  background: flag.severity > 0.8 ? 'var(--rejected-bg)' : 'var(--flagged-bg)',
                  border: `1px solid ${flag.severity > 0.8 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                      color: flag.severity > 0.8 ? 'var(--rejected)' : 'var(--flagged)',
                    }}>
                      {flag.flag_type?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {Math.round(flag.severity * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {flag.student?.name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
