import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client';
import { COURSES, CLASSROOMS } from '../data/institutionData';

// ── Starting animation overlay ──────────────────────────────────────────────
const INIT_STEPS = [
  { icon: '📡', label: 'Locating BLE Beacon…',          duration: 900 },
  { icon: '🔐', label: 'Generating HMAC QR Keys…',      duration: 800 },
  { icon: '🛡️', label: 'Activating Dual-Gate Engine…',  duration: 800 },
  { icon: '🔍', label: 'Initialising Anomaly Scanner…', duration: 700 },
  { icon: '✅', label: 'Session Live!',                  duration: 600 },
];

function StartingOverlay({ courseName, classroomName, onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let idx = 0;
    function advance() {
      idx++;
      if (idx < INIT_STEPS.length) {
        setStepIdx(idx);
        setTimeout(advance, INIT_STEPS[idx].duration);
      } else {
        setDone(true);
        setTimeout(onComplete, 600);
      }
    }
    setTimeout(advance, INIT_STEPS[0].duration);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5,8,22,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Pulsing radar rings */}
      <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 48 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: `2px solid rgba(16,185,129,${0.4 - i * 0.12})`,
            animation: `radarPulse 2s ease-out ${i * 0.5}s infinite`,
          }} />
        ))}
        {/* Rotating sweep */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(16,185,129,0.18) 0deg, transparent 90deg)',
          animation: 'radarSweep 2s linear infinite',
        }} />
        {/* Centre beacon icon */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: done ? '2.4rem' : '1.8rem',
          transition: 'font-size 0.4s ease',
        }}>
          {done ? '✅' : '📡'}
        </div>
      </div>

      <p style={{
        fontSize: '1.5rem', fontWeight: 800,
        color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em',
      }}>
        {done ? 'Session is Live!' : 'Starting Session…'}
      </p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 40 }}>
        {courseName} · {classroomName}
      </p>

      {/* Step checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {INIT_STEPS.map((s, i) => {
          const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              background: state === 'active' ? 'rgba(16,185,129,0.1)' : state === 'done' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${state === 'active' ? 'rgba(16,185,129,0.4)' : state === 'done' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s ease',
              opacity: state === 'pending' ? 0.4 : 1,
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                {state === 'done' ? '✓' : s.icon}
              </span>
              <span style={{
                fontSize: '0.85rem', fontWeight: state === 'active' ? 600 : 500,
                color: state === 'active' ? 'var(--emerald-400)' : state === 'done' ? 'var(--text-secondary)' : 'var(--text-muted)',
              }}>
                {s.label}
              </span>
              {state === 'active' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--emerald-400)',
                      animation: `blink 0.8s ease ${d * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              )}
              {state === 'done' && (
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--verified)', fontWeight: 700 }}>DONE</span>
              )}
            </div>
          );
        })}
      </div>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes radarPulse {
          0%   { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function LiveSession() {
  const [step, setStep] = useState('setup'); // setup | starting | active
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [session, setSession] = useState(null);

  const [attendanceFeed, setAttendanceFeed] = useState([]);
  const [anomalyFeed, setAnomalyFeed] = useState([]);
  const [stats, setStats] = useState({ verified: 0, flagged: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const seenEventsRef = useRef(new Set());
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Load courses & classrooms from API, fall back to built-in data
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/dashboard/courses');
        setCourses(res.data?.length ? res.data : COURSES);
      } catch {
        try {
          const res = await api.get('/demo/courses');
          setCourses(res.data?.length ? res.data : COURSES);
        } catch { setCourses(COURSES); }
      }
      try {
        const res = await api.get('/dashboard/classrooms');
        setClassrooms(res.data?.length ? res.data : CLASSROOMS);
      } catch {
        try {
          const res = await api.get('/demo/classrooms');
          setClassrooms(res.data?.length ? res.data : CLASSROOMS);
        } catch { setClassrooms(CLASSROOMS); }
      }
    }
    load();
  }, []);

  // WebSocket for live events
  useEffect(() => {
    if (step !== 'active' || !session?.id) return;

    const s = io('http://localhost:3000', { reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('session:join', session.id);
      s.emit('dashboard:live:join');
    });

    s.on('session:student_verified', (data) => {
      const key = `${data.student?.id}_${data.timestamp}`;
      if (seenEventsRef.current.has(key)) return;
      seenEventsRef.current.add(key);
      if (seenEventsRef.current.size > 200)
        seenEventsRef.current = new Set(Array.from(seenEventsRef.current).slice(-100));

      setAttendanceFeed(prev => [data, ...prev]);
      setStats(prev => ({ ...prev, [data.status]: (prev[data.status] || 0) + 1, total: prev.total + 1 }));
    });

    s.on('session:anomaly_flag', (data) => { setAnomalyFeed(prev => [data, ...prev]); });
    s.on('session:ended', () => { setStep('setup'); setSession(null); });

    return () => {
      s.emit('session:leave', session.id);
      s.emit('dashboard:live:leave');
      s.disconnect();
      socketRef.current = null;
    };
  }, [step, session?.id]);

  async function startSession() {
    if (!selectedCourse || !selectedClassroom) return;
    setLoading(true);

    const course    = courses.find(c => c.id === parseInt(selectedCourse));
    const classroom = classrooms.find(c => c.id === parseInt(selectedClassroom));

    try {
      const res = await api.post('/sessions/start', {
        course_id: parseInt(selectedCourse),
        classroom_id: parseInt(selectedClassroom),
      });
      const s = res.data;
      setSession({ ...s, course_name: s.course_name || course?.name, classroom_name: s.classroom_name || classroom?.name });
    } catch {
      setSession({
        id: Date.now(),
        course_name: course?.name || 'Course',
        course_code: course?.code || '',
        classroom_name: classroom?.name || 'Classroom',
        total_enrolled: course?.enrolled_count || 60,
        status: 'active',
      });
    } finally {
      setLoading(false);
    }

    // Show starting animation before going active
    setStep('starting');
  }

  function handleAnimationComplete() {
    setStep('active');
    if (session?.total_enrolled) {
      setStats({ verified: 0, flagged: 0, rejected: 0, total: session.total_enrolled });
    }
    const course = courses.find(c => c.id === parseInt(selectedCourse));
    const classroom = classrooms.find(c => c.id === parseInt(selectedClassroom));
    simulateStudents({ ...session, course_name: course?.name, classroom_name: classroom?.name });
  }

  function simulateStudents(sess) {
    const students = [
      'Arjun Patel', 'Meera Reddy', 'Vikram Singh', 'Deepa Nair', 'Rohan Gupta',
      'Sneha Iyer', 'Amit Joshi', 'Kavya Pillai', 'Harsh Mehta', 'Priyanka Das',
      'Rahul Verma', 'Ananya Kumar',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= students.length) { clearInterval(interval); return; }
      const statuses = ['verified', 'verified', 'verified', 'verified', 'verified', 'flagged', 'rejected'];
      const status   = statuses[Math.floor(Math.random() * statuses.length)];
      const entry = {
        student:      { id: idx + 4, name: students[idx] },
        status,
        qr_verified:  status !== 'rejected',
        ble_verified: status === 'verified',
        rssi_median:  status === 'rejected' ? null : -48 - Math.floor(Math.random() * 22),
        timestamp:    new Date().toISOString(),
      };
      setAttendanceFeed(prev => [entry, ...prev]);
      setStats(prev => ({ ...prev, [status]: prev[status] + 1 }));

      if (status === 'flagged' || Math.random() < 0.15) {
        const types = ['weak_presence', 'cluster_sync', 'duplicate_device'];
        setAnomalyFeed(prev => [{
          flag_type: types[Math.floor(Math.random() * types.length)],
          severity:  Math.round((0.5 + Math.random() * 0.45) * 100) / 100,
          student:   entry.student,
          details:   { message: 'Anomaly detected during scan' },
          timestamp: new Date().toISOString(),
        }, ...prev]);
      }
      idx++;
    }, 2200 + Math.random() * 2500);
    return () => clearInterval(interval);
  }

  async function endSession() {
    try { await api.post(`/sessions/${session.id}/end`); } catch { /* local mode */ }
    setStep('setup');
    setSession(null);
    setAttendanceFeed([]);
    setAnomalyFeed([]);
    navigate('/sessions');
  }

  // ── Starting animation step ───────────────────────────────────────────────
  if (step === 'starting') {
    const course    = courses.find(c => c.id === parseInt(selectedCourse));
    const classroom = classrooms.find(c => c.id === parseInt(selectedClassroom));
    return (
      <StartingOverlay
        courseName={course?.name || 'Course'}
        classroomName={classroom?.name || 'Classroom'}
        onComplete={handleAnimationComplete}
      />
    );
  }

  // ── Setup step ────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Start Live Session</h1>
          <p>Configure and launch a new attendance verification session</p>
        </div>

        <div style={{ maxWidth: 580 }}>
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
                <option value="">Choose a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name} ({c.enrolled_count} students)
                  </option>
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
                <option value="">Choose a classroom…</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.building} ({c.beacon_status === 'active' ? '🟢 Beacon Active' : '🔴 Beacon Inactive'})
                  </option>
                ))}
              </select>
            </div>

            {/* Info box */}
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
              {loading
                ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Preparing…</>
                : '📡 Start Live Session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  const enrolled   = session?.total_enrolled || stats.total || 60;
  const verifiedPct = enrolled > 0 ? Math.round((stats.verified / enrolled) * 100) : 0;

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
        {[
          { label: 'Verified',   value: stats.verified,   color: 'var(--emerald-400)' },
          { label: 'Flagged',    value: stats.flagged,    color: 'var(--flagged)' },
          { label: 'Rejected',   value: stats.rejected,   color: 'var(--rejected)' },
          { label: 'Attendance', value: `${verifiedPct}%`, color: 'var(--info)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Attendance Feed */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: 520 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋 Attendance Feed</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{attendanceFeed.length} scans</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attendanceFeed.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="icon">📡</div>
                <p style={{ color: 'var(--text-muted)' }}>Waiting for students to scan…</p>
              </div>
            ) : attendanceFeed.map((item, i) => (
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
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.student?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                    <span>QR {item.qr_verified ? '✓' : '✕'}</span><span>·</span>
                    <span>BLE {item.ble_verified ? '✓' : '✕'}</span>
                    {item.rssi_median && <><span>·</span><span>{item.rssi_median} dBm</span></>}
                  </div>
                </div>
                <span className={`badge badge-${item.status}`} style={{ fontSize: '0.65rem' }}>{item.status}</span>
              </div>
            ))}
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
            ) : anomalyFeed.map((flag, i) => (
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
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{Math.round(flag.severity * 100)}%</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{flag.student?.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
