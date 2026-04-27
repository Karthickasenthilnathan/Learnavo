/**
 * Centralized Demo Data Module
 * 
 * Generates realistic, PERSISTENT analytical data for the dashboard.
 * Data is created once at import time and reused for the server lifetime —
 * so the dashboard always shows consistent, non-empty data even without PostgreSQL.
 */

// ──────────────────────────────────────────
// USERS
// ──────────────────────────────────────────
const PROFESSORS = [
  { id: 1, name: 'Dr. Ananya Sharma', email: 'ananya@university.edu', role: 'professor', department: 'Computer Science' },
  { id: 2, name: 'Dr. Rajesh Kumar', email: 'rajesh@university.edu', role: 'professor', department: 'Computer Science' },
];

const HOD = { id: 3, name: 'Dr. Priya Menon', email: 'priya@university.edu', role: 'hod', department: 'Computer Science' };

const STUDENT_NAMES = [
  'Arjun Patel', 'Meera Reddy', 'Vikram Singh', 'Deepa Nair', 'Rohan Gupta',
  'Sneha Iyer', 'Amit Joshi', 'Kavya Pillai', 'Harsh Mehta', 'Priyanka Das',
  'Siddharth Roy', 'Nandini Rao', 'Karthik Verma', 'Ayesha Khan', 'Varun Mishra',
  'Divya Saxena', 'Nikhil Agarwal', 'Tanvi Bhatia', 'Rahul Kapoor', 'Ishika Tiwari',
];

const STUDENTS = STUDENT_NAMES.map((name, i) => ({
  id: i + 4,
  name,
  enrollment: `CS2023${String(i + 1).padStart(3, '0')}`,
  email: `${name.split(' ')[0].toLowerCase()}@student.edu`,
  department: 'Computer Science',
  role: 'student',
}));

// ──────────────────────────────────────────
// COURSES & CLASSROOMS
// ──────────────────────────────────────────
const COURSES = [
  { id: 1, name: 'Data Structures & Algorithms', code: 'CS301', professor_id: 1, professor_name: 'Dr. Ananya Sharma', department: 'Computer Science', enrolled_count: 20, semester: 'Fall', year: 2026, credits: 4 },
  { id: 2, name: 'Database Management Systems', code: 'CS302', professor_id: 1, professor_name: 'Dr. Ananya Sharma', department: 'Computer Science', enrolled_count: 15, semester: 'Fall', year: 2026, credits: 3 },
  { id: 3, name: 'Operating Systems', code: 'CS303', professor_id: 2, professor_name: 'Dr. Rajesh Kumar', department: 'Computer Science', enrolled_count: 18, semester: 'Fall', year: 2026, credits: 4 },
];

const CLASSROOMS = [
  { id: 1, name: 'CS Lab 101', building: 'Block A', room_number: '101', capacity: 60, beacon_mac: 'AA:BB:CC:01:01:01', beacon_status: 'active', rssi_threshold: -75, last_calibrated: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 2, name: 'Lecture Hall B', building: 'Block B', room_number: '201', capacity: 120, beacon_mac: 'AA:BB:CC:02:02:02', beacon_status: 'active', rssi_threshold: -75, last_calibrated: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 3, name: 'Seminar Room C', building: 'Block A', room_number: '305', capacity: 40, beacon_mac: 'AA:BB:CC:03:03:03', beacon_status: 'active', rssi_threshold: -75, last_calibrated: new Date(Date.now() - 2 * 86400000).toISOString() },
];

// ──────────────────────────────────────────
// Deterministic seeded random (for consistency)
// ──────────────────────────────────────────
let _seed = 42;
function seededRandom() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function seededInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// ──────────────────────────────────────────
// SESSIONS (15 historical sessions over past 14 days)
// ──────────────────────────────────────────
const SESSIONS = [];
for (let i = 0; i < 15; i++) {
  const course = COURSES[i % 3];
  const classroom = CLASSROOMS[i % 3];
  const enrolled = course.enrolled_count;
  const verified = Math.floor(enrolled * (0.72 + seededRandom() * 0.23));
  const flagged = seededInt(0, 3);
  const rejected = seededInt(0, 2);
  const daysAgo = i === 0 ? 0 : i;
  const startedAt = new Date(Date.now() - daysAgo * 86400000 - seededInt(0, 4) * 3600000);
  const endedAt = i === 0 ? null : new Date(startedAt.getTime() + 3600000);

  SESSIONS.push({
    id: i + 1,
    course_id: course.id,
    course_name: course.name,
    course_code: course.code,
    classroom_id: classroom.id,
    classroom_name: classroom.name,
    professor_id: course.professor_id,
    professor_name: course.professor_name,
    status: i === 0 ? 'active' : 'completed',
    total_enrolled: enrolled,
    total_verified: verified,
    total_flagged: flagged,
    total_rejected: rejected,
    started_at: startedAt.toISOString(),
    ended_at: endedAt ? endedAt.toISOString() : null,
  });
}

// ──────────────────────────────────────────
// SESSION DETAIL — per-student attendance + anomalies
// ──────────────────────────────────────────
function generateSessionDetail(sessionId) {
  const session = SESSIONS.find(s => s.id === sessionId) || SESSIONS[0];
  const enrolled = session.total_enrolled;
  const studentsForSession = STUDENTS.slice(0, enrolled);

  const attendance = studentsForSession.map((student, idx) => {
    const statuses = ['verified', 'verified', 'verified', 'verified', 'verified', 'flagged', 'rejected'];
    const status = statuses[seededInt(0, statuses.length - 1)];
    const rssi = -(45 + seededInt(0, 30));
    return {
      id: idx + 1,
      student_id: student.id,
      student_name: student.name,
      enrollment: student.enrollment,
      status,
      qr_verified: status !== 'rejected',
      ble_verified: status === 'verified',
      rssi_median: rssi,
      rssi_readings: Array.from({ length: 10 }, () => rssi + seededInt(-5, 5)),
      scan_attempts: status === 'rejected' ? seededInt(2, 4) : 1,
      device_fingerprint: `android-${student.id}-${seededInt(1000, 9999)}`,
      scanned_at: new Date(new Date(session.started_at).getTime() + seededInt(60, 3000) * 1000).toISOString(),
    };
  });

  const anomalyFlags = [
    {
      id: sessionId * 100 + 1,
      flag_type: 'weak_presence',
      severity: 0.72,
      student_id: studentsForSession[4]?.id,
      student_name: studentsForSession[4]?.name || 'Unknown',
      enrollment: studentsForSession[4]?.enrollment,
      details: { message: 'QR passed but BLE signal below threshold', rssi_median: -78 },
      created_at: new Date(new Date(session.started_at).getTime() + 1800000).toISOString(),
      resolved: false,
    },
    {
      id: sessionId * 100 + 2,
      flag_type: 'cluster_sync',
      severity: 0.61,
      student_id: null,
      student_name: 'Multiple',
      details: { message: '6 students scanned within 3-second window', student_count: 6 },
      created_at: new Date(new Date(session.started_at).getTime() + 2400000).toISOString(),
      resolved: false,
    },
  ];

  return {
    ...session,
    attendance,
    anomaly_flags: anomalyFlags,
  };
}

// ──────────────────────────────────────────
// ANOMALY FLAGS (global, cross-session)
// ──────────────────────────────────────────
const FLAG_TYPES = ['duplicate_device', 'token_reuse', 'cluster_sync', 'weak_presence'];
const flagStudentPool = [
  STUDENTS[0], STUDENTS[2], STUDENTS[4], STUDENTS[8], STUDENTS[14], STUDENTS[18],
];

const ANOMALY_FLAGS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  flag_type: FLAG_TYPES[i % FLAG_TYPES.length],
  severity: Math.round((0.42 + seededRandom() * 0.5) * 100) / 100,
  student_id: flagStudentPool[i % flagStudentPool.length]?.id,
  student_name: flagStudentPool[i % flagStudentPool.length]?.name,
  enrollment: flagStudentPool[i % flagStudentPool.length]?.enrollment,
  session_id: seededInt(1, 5),
  details: {
    message: `Anomaly detected: ${FLAG_TYPES[i % FLAG_TYPES.length].replace(/_/g, ' ')}`,
  },
  resolved: i > 8, // last 3 are resolved
  created_at: new Date(Date.now() - seededInt(1, 7) * 86400000).toISOString(),
}));

// ──────────────────────────────────────────
// RISK SCORES
// ──────────────────────────────────────────
const RISK_STUDENTS = [
  { idx: 8, name: 'Harsh Mehta', enrollment: 'CS2023009', score: 0.80 },
  { idx: 14, name: 'Varun Mishra', enrollment: 'CS2023015', score: 0.72 },
  { idx: 18, name: 'Rahul Kapoor', enrollment: 'CS2023019', score: 0.64 },
  { idx: 4, name: 'Rohan Gupta', enrollment: 'CS2023005', score: 0.56 },
  { idx: 2, name: 'Vikram Singh', enrollment: 'CS2023003', score: 0.48 },
];

const RISK_SCORES = RISK_STUDENTS.map((s, i) => ({
  id: i + 1,
  student_id: s.idx + 4,
  student_name: s.name,
  enrollment: s.enrollment,
  course_id: 1,
  course_name: 'Data Structures & Algorithms',
  course_code: 'CS301',
  score: s.score,
  factors: {
    rssi_consistency: Math.round(seededRandom() * 100) / 100,
    scan_timing: Math.round(seededRandom() * 100) / 100,
    attempt_count: Math.round(seededRandom() * 100) / 100,
    historical_flags: Math.round(seededRandom() * 100) / 100,
    cluster_score: Math.round(seededRandom() * 100) / 100,
  },
  calculated_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

// ──────────────────────────────────────────
// ATTENDANCE TREND (last 30 days)
// ──────────────────────────────────────────
const ATTENDANCE_TREND = Array.from({ length: 30 }, (_, i) => {
  const base = 76 + Math.sin(i * 0.3) * 6;
  return {
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    avg_pct: Math.round(base + seededRandom() * 8),
    session_count: seededInt(1, 3),
  };
});

// ──────────────────────────────────────────
// STUDENT ROSTER (with computed attendance stats)
// ──────────────────────────────────────────
const STUDENT_ROSTER = STUDENTS.map((student, i) => {
  const totalSessions = 14;
  const attended = seededInt(8, 14);
  const riskStudent = RISK_STUDENTS.find(r => r.idx === i);
  return {
    ...student,
    attended_sessions: attended,
    total_sessions: totalSessions,
    avg_risk_score: riskStudent ? riskStudent.score : Math.round(seededRandom() * 30) / 100,
    active_flags: riskStudent ? seededInt(2, 5) : seededInt(0, 1),
  };
});

// ──────────────────────────────────────────
// HOD ANALYTICS
// ──────────────────────────────────────────
const HOD_DATA = {
  department: {
    total_sessions: 42,
    total_courses: 3,
    total_students: 20,
    total_professors: 2,
  },
  course_comparison: [
    { name: 'Data Structures & Algorithms', code: 'CS301', sessions: 14, avg_attendance: 86.7 },
    { name: 'Database Management Systems', code: 'CS302', sessions: 14, avg_attendance: 78.2 },
    { name: 'Operating Systems', code: 'CS303', sessions: 14, avg_attendance: 82.1 },
  ],
  high_risk_students: RISK_STUDENTS.filter(s => s.score > 0.5).map((s, i) => ({
    id: s.idx + 4,
    name: s.name,
    enrollment: s.enrollment,
    avg_risk: s.score,
    total_flags: seededInt(3, 6),
  })),
  flag_distribution: [
    { flag_type: 'weak_presence', count: 12, avg_severity: 0.62 },
    { flag_type: 'cluster_sync', count: 8, avg_severity: 0.55 },
    { flag_type: 'duplicate_device', count: 5, avg_severity: 0.88 },
    { flag_type: 'token_reuse', count: 3, avg_severity: 0.91 },
  ],
};

// ──────────────────────────────────────────
// DASHBOARD STATS (Professor)
// ──────────────────────────────────────────
function getDashboardStats(professorId = null) {
  const relevantSessions = professorId
    ? SESSIONS.filter(s => s.professor_id === professorId)
    : SESSIONS;

  const todaySessions = relevantSessions.filter(s => {
    const d = new Date(s.started_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length || 3; // Ensure visible value

  const completedSessions = relevantSessions.filter(s => s.status === 'completed');
  const avgAttendance = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) =>
        sum + (s.total_enrolled > 0 ? (s.total_verified / s.total_enrolled) * 100 : 0), 0) / completedSessions.length * 10) / 10
    : 82.4;

  const activeFlags = ANOMALY_FLAGS.filter(f => !f.resolved).length;

  return {
    today_sessions: todaySessions,
    total_students: STUDENTS.length,
    avg_attendance: avgAttendance,
    active_flags: activeFlags,
    recent_sessions: relevantSessions.slice(0, 5),
    attendance_trend: ATTENDANCE_TREND.slice(-14), // last 14 days
  };
}

// ──────────────────────────────────────────
// DEMO USER LOOKUP (for demo-login)
// ──────────────────────────────────────────
function getDemoUser(email) {
  const prof = PROFESSORS.find(p => p.email === email);
  if (prof) return prof;
  if (email === HOD.email || email.includes('priya')) return HOD;
  const student = STUDENTS.find(s => s.email === email);
  if (student) return student;

  // Infer role from email pattern
  if (email.includes('ananya') || email.includes('rajesh')) return PROFESSORS[0];
  if (email.includes('priya')) return HOD;

  // Default to professor for dashboard usage
  return PROFESSORS[0];
}

// ──────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────
export {
  PROFESSORS,
  HOD,
  STUDENTS,
  STUDENT_ROSTER,
  COURSES,
  CLASSROOMS,
  SESSIONS,
  ANOMALY_FLAGS,
  RISK_SCORES,
  ATTENDANCE_TREND,
  HOD_DATA,
  getDashboardStats,
  getDemoUser,
  generateSessionDetail,
};
