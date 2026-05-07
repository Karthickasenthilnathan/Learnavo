/**
 * Institution data — shared across all dashboard modules
 */

export const COURSES = [
  { id: 1, name: 'Data Structures & Algorithms', code: 'CS301', enrolled_count: 62, department: 'Computer Science' },
  { id: 2, name: 'Database Management Systems', code: 'CS302', enrolled_count: 58, department: 'Computer Science' },
  { id: 3, name: 'Operating Systems', code: 'CS303', enrolled_count: 55, department: 'Computer Science' },
  { id: 4, name: 'Computer Networks', code: 'CS401', enrolled_count: 49, department: 'Computer Science' },
  { id: 5, name: 'Software Engineering', code: 'CS402', enrolled_count: 51, department: 'Computer Science' },
];

export const CLASSROOMS = [
  { id: 1, name: 'CS Lab 101', building: 'Block A', room_number: '101', beacon_status: 'active' },
  { id: 2, name: 'Lecture Hall B', building: 'Block B', room_number: '201', beacon_status: 'active' },
  { id: 3, name: 'Seminar Room C', building: 'Block A', room_number: '305', beacon_status: 'active' },
  { id: 4, name: 'Smart Classroom 204', building: 'Block C', room_number: '204', beacon_status: 'active' },
  { id: 5, name: 'DSA Lab 302', building: 'Block A', room_number: '302', beacon_status: 'active' },
];

export const STUDENTS = [
  { id: 4,  name: 'Arjun Patel',     enrollment: 'CS2021001', email: 'arjun@student.edu',    attended_sessions: 38, total_sessions: 42, avg_risk_score: 0.08, active_flags: 0 },
  { id: 5,  name: 'Meera Reddy',     enrollment: 'CS2021002', email: 'meera@student.edu',    attended_sessions: 40, total_sessions: 42, avg_risk_score: 0.05, active_flags: 0 },
  { id: 6,  name: 'Vikram Singh',    enrollment: 'CS2021003', email: 'vikram@student.edu',   attended_sessions: 29, total_sessions: 42, avg_risk_score: 0.71, active_flags: 3 },
  { id: 7,  name: 'Deepa Nair',      enrollment: 'CS2021004', email: 'deepa@student.edu',    attended_sessions: 36, total_sessions: 42, avg_risk_score: 0.12, active_flags: 0 },
  { id: 8,  name: 'Rohan Gupta',     enrollment: 'CS2021005', email: 'rohan@student.edu',    attended_sessions: 22, total_sessions: 42, avg_risk_score: 0.85, active_flags: 5 },
  { id: 9,  name: 'Sneha Iyer',      enrollment: 'CS2021006', email: 'sneha@student.edu',    attended_sessions: 41, total_sessions: 42, avg_risk_score: 0.04, active_flags: 0 },
  { id: 10, name: 'Amit Joshi',      enrollment: 'CS2021007', email: 'amit@student.edu',     attended_sessions: 33, total_sessions: 42, avg_risk_score: 0.44, active_flags: 2 },
  { id: 11, name: 'Kavya Pillai',    enrollment: 'CS2021008', email: 'kavya@student.edu',    attended_sessions: 39, total_sessions: 42, avg_risk_score: 0.09, active_flags: 0 },
  { id: 12, name: 'Harsh Mehta',     enrollment: 'CS2021009', email: 'harsh@student.edu',    attended_sessions: 26, total_sessions: 42, avg_risk_score: 0.63, active_flags: 4 },
  { id: 13, name: 'Priyanka Das',    enrollment: 'CS2021010', email: 'priyanka@student.edu', attended_sessions: 42, total_sessions: 42, avg_risk_score: 0.02, active_flags: 0 },
  { id: 14, name: 'Rahul Verma',     enrollment: 'CS2021011', email: 'rahul@student.edu',    attended_sessions: 31, total_sessions: 42, avg_risk_score: 0.57, active_flags: 3 },
  { id: 15, name: 'Ananya Kumar',    enrollment: 'CS2021012', email: 'ananya@student.edu',   attended_sessions: 37, total_sessions: 42, avg_risk_score: 0.18, active_flags: 1 },
  { id: 16, name: 'Siddharth Rao',  enrollment: 'CS2021013', email: 'siddharth@student.edu',attended_sessions: 19, total_sessions: 42, avg_risk_score: 0.92, active_flags: 6 },
  { id: 17, name: 'Pooja Sharma',   enrollment: 'CS2021014', email: 'pooja@student.edu',    attended_sessions: 40, total_sessions: 42, avg_risk_score: 0.06, active_flags: 0 },
  { id: 18, name: 'Nikhil Tiwari',  enrollment: 'CS2021015', email: 'nikhil@student.edu',   attended_sessions: 35, total_sessions: 42, avg_risk_score: 0.31, active_flags: 1 },
];

const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const SESSION_HISTORY = [
  {
    id: 101, course_name: 'Data Structures & Algorithms', course_code: 'CS301',
    classroom_name: 'CS Lab 101', status: 'completed',
    started_at: daysAgo(0), ended_at: daysAgo(0),
    total_enrolled: 62, total_verified: 55, total_flagged: 4, total_rejected: 2,
    attendance: [
      { id: 1, student_name: 'Arjun Patel',   enrollment: 'CS2021001', qr_verified: true,  ble_verified: true,  rssi_median: -52, scan_attempts: 1, scanned_at: daysAgo(0), status: 'verified' },
      { id: 2, student_name: 'Meera Reddy',   enrollment: 'CS2021002', qr_verified: true,  ble_verified: true,  rssi_median: -48, scan_attempts: 1, scanned_at: daysAgo(0), status: 'verified' },
      { id: 3, student_name: 'Vikram Singh',  enrollment: 'CS2021003', qr_verified: true,  ble_verified: false, rssi_median: -79, scan_attempts: 3, scanned_at: daysAgo(0), status: 'flagged'  },
      { id: 4, student_name: 'Deepa Nair',    enrollment: 'CS2021004', qr_verified: true,  ble_verified: true,  rssi_median: -55, scan_attempts: 1, scanned_at: daysAgo(0), status: 'verified' },
      { id: 5, student_name: 'Rohan Gupta',   enrollment: 'CS2021005', qr_verified: false, ble_verified: false, rssi_median: null,scan_attempts: 2, scanned_at: daysAgo(0), status: 'rejected' },
    ],
    anomaly_flags: [
      { id: 1, flag_type: 'weak_presence', student_name: 'Vikram Singh', enrollment: 'CS2021003', severity: 0.74, resolved: false, details: { message: 'BLE RSSI below threshold — possible boundary-zone presence' } },
      { id: 2, flag_type: 'cluster_sync',  student_name: 'Rohan Gupta',  enrollment: 'CS2021005', severity: 0.88, resolved: false, details: { message: 'QR scan timestamp clustered with 2 other devices within 800ms' } },
    ],
  },
  {
    id: 102, course_name: 'Database Management Systems', course_code: 'CS302',
    classroom_name: 'Lecture Hall B', status: 'completed',
    started_at: daysAgo(1), ended_at: daysAgo(1),
    total_enrolled: 58, total_verified: 51, total_flagged: 3, total_rejected: 1,
    attendance: [], anomaly_flags: [],
  },
  {
    id: 103, course_name: 'Operating Systems', course_code: 'CS303',
    classroom_name: 'Seminar Room C', status: 'completed',
    started_at: daysAgo(2), ended_at: daysAgo(2),
    total_enrolled: 55, total_verified: 48, total_flagged: 5, total_rejected: 2,
    attendance: [], anomaly_flags: [],
  },
  {
    id: 104, course_name: 'Computer Networks', course_code: 'CS401',
    classroom_name: 'Smart Classroom 204', status: 'completed',
    started_at: daysAgo(3), ended_at: daysAgo(3),
    total_enrolled: 49, total_verified: 45, total_flagged: 2, total_rejected: 1,
    attendance: [], anomaly_flags: [],
  },
  {
    id: 105, course_name: 'Data Structures & Algorithms', course_code: 'CS301',
    classroom_name: 'CS Lab 101', status: 'completed',
    started_at: daysAgo(5), ended_at: daysAgo(5),
    total_enrolled: 62, total_verified: 57, total_flagged: 3, total_rejected: 0,
    attendance: [], anomaly_flags: [],
  },
  {
    id: 106, course_name: 'Software Engineering', course_code: 'CS402',
    classroom_name: 'DSA Lab 302', status: 'completed',
    started_at: daysAgo(6), ended_at: daysAgo(6),
    total_enrolled: 51, total_verified: 44, total_flagged: 4, total_rejected: 3,
    attendance: [], anomaly_flags: [],
  },
  {
    id: 107, course_name: 'Database Management Systems', course_code: 'CS302',
    classroom_name: 'Lecture Hall B', status: 'completed',
    started_at: daysAgo(7), ended_at: daysAgo(7),
    total_enrolled: 58, total_verified: 52, total_flagged: 2, total_rejected: 0,
    attendance: [], anomaly_flags: [],
  },
];

export const ANOMALY_FLAGS = [
  { id: 1,  flag_type: 'weak_presence',    student_name: 'Vikram Singh',   enrollment: 'CS2021003', course_code: 'CS301', severity: 0.74, resolved: false, created_at: daysAgo(0) },
  { id: 2,  flag_type: 'cluster_sync',     student_name: 'Rohan Gupta',    enrollment: 'CS2021005', course_code: 'CS301', severity: 0.88, resolved: false, created_at: daysAgo(0) },
  { id: 3,  flag_type: 'duplicate_device', student_name: 'Siddharth Rao',  enrollment: 'CS2021013', course_code: 'CS303', severity: 0.91, resolved: false, created_at: daysAgo(1) },
  { id: 4,  flag_type: 'token_reuse',      student_name: 'Harsh Mehta',    enrollment: 'CS2021009', course_code: 'CS302', severity: 0.67, resolved: false, created_at: daysAgo(1) },
  { id: 5,  flag_type: 'chronic_proxy',    student_name: 'Siddharth Rao',  enrollment: 'CS2021013', course_code: 'CS401', severity: 0.95, resolved: false, created_at: daysAgo(2) },
  { id: 6,  flag_type: 'weak_presence',    student_name: 'Rahul Verma',    enrollment: 'CS2021011', course_code: 'CS402', severity: 0.58, resolved: false, created_at: daysAgo(2) },
  { id: 7,  flag_type: 'cluster_sync',     student_name: 'Amit Joshi',     enrollment: 'CS2021007', course_code: 'CS301', severity: 0.49, resolved: true,  created_at: daysAgo(3) },
  { id: 8,  flag_type: 'duplicate_device', student_name: 'Rohan Gupta',    enrollment: 'CS2021005', course_code: 'CS302', severity: 0.82, resolved: false, created_at: daysAgo(3) },
  { id: 9,  flag_type: 'token_reuse',      student_name: 'Harsh Mehta',    enrollment: 'CS2021009', course_code: 'CS303', severity: 0.71, resolved: true,  created_at: daysAgo(5) },
  { id: 10, flag_type: 'weak_presence',    student_name: 'Ananya Kumar',   enrollment: 'CS2021012', course_code: 'CS401', severity: 0.38, resolved: true,  created_at: daysAgo(6) },
  { id: 11, flag_type: 'chronic_proxy',    student_name: 'Vikram Singh',   enrollment: 'CS2021003', course_code: 'CS302', severity: 0.77, resolved: false, created_at: daysAgo(7) },
  { id: 12, flag_type: 'cluster_sync',     student_name: 'Nikhil Tiwari',  enrollment: 'CS2021015', course_code: 'CS402', severity: 0.45, resolved: true,  created_at: daysAgo(7) },
];

export const RISK_SCORES = [
  { id: 1, student_name: 'Siddharth Rao', enrollment: 'CS2021013', course_code: 'CS303', score: 0.92, factors: { rssi_consistency: 0.88, scan_timing: 0.95, historical_flags: 0.94 } },
  { id: 2, student_name: 'Rohan Gupta',   enrollment: 'CS2021005', course_code: 'CS301', score: 0.85, factors: { rssi_consistency: 0.82, scan_timing: 0.79, historical_flags: 0.91 } },
  { id: 3, student_name: 'Harsh Mehta',   enrollment: 'CS2021009', course_code: 'CS302', score: 0.63, factors: { rssi_consistency: 0.61, scan_timing: 0.58, historical_flags: 0.69 } },
  { id: 4, student_name: 'Vikram Singh',  enrollment: 'CS2021003', course_code: 'CS301', score: 0.71, factors: { rssi_consistency: 0.74, scan_timing: 0.65, historical_flags: 0.73 } },
  { id: 5, student_name: 'Rahul Verma',   enrollment: 'CS2021011', course_code: 'CS402', score: 0.57, factors: { rssi_consistency: 0.53, scan_timing: 0.49, historical_flags: 0.62 } },
  { id: 6, student_name: 'Amit Joshi',    enrollment: 'CS2021007', course_code: 'CS301', score: 0.44, factors: { rssi_consistency: 0.41, scan_timing: 0.38, historical_flags: 0.51 } },
  { id: 7, student_name: 'Ananya Kumar',  enrollment: 'CS2021012', course_code: 'CS401', score: 0.18, factors: { rssi_consistency: 0.14, scan_timing: 0.22, historical_flags: 0.19 } },
  { id: 8, student_name: 'Nikhil Tiwari', enrollment: 'CS2021015', course_code: 'CS402', score: 0.31, factors: { rssi_consistency: 0.28, scan_timing: 0.33, historical_flags: 0.30 } },
];

export const DASHBOARD_STATS = {
  today_sessions: 3,
  total_students: 275,
  avg_attendance: 84,
  active_flags: 7,
  attendance_trend: [
    { date: '2026-04-21', avg_pct: 79 },
    { date: '2026-04-22', avg_pct: 83 },
    { date: '2026-04-23', avg_pct: 81 },
    { date: '2026-04-24', avg_pct: 86 },
    { date: '2026-04-25', avg_pct: 88 },
    { date: '2026-04-26', avg_pct: 85 },
    { date: '2026-04-27', avg_pct: 82 },
    { date: '2026-04-28', avg_pct: 87 },
    { date: '2026-04-29', avg_pct: 84 },
    { date: '2026-04-30', avg_pct: 89 },
    { date: '2026-05-01', avg_pct: 86 },
    { date: '2026-05-02', avg_pct: 91 },
    { date: '2026-05-03', avg_pct: 88 },
    { date: '2026-05-04', avg_pct: 84 },
  ],
  recent_sessions: [
    { id: 101, course_name: 'Data Structures & Algorithms', course_code: 'CS301', classroom_name: 'CS Lab 101',       status: 'completed', total_enrolled: 62, total_verified: 55, total_flagged: 4 },
    { id: 102, course_name: 'Database Management Systems',  course_code: 'CS302', classroom_name: 'Lecture Hall B',   status: 'completed', total_enrolled: 58, total_verified: 51, total_flagged: 3 },
    { id: 103, course_name: 'Operating Systems',            course_code: 'CS303', classroom_name: 'Seminar Room C',   status: 'completed', total_enrolled: 55, total_verified: 48, total_flagged: 5 },
    { id: 104, course_name: 'Computer Networks',            course_code: 'CS401', classroom_name: 'Smart Classroom 204', status: 'completed', total_enrolled: 49, total_verified: 45, total_flagged: 2 },
  ],
};

export const HOD_DATA = {
  department: { total_sessions: 42, total_courses: 5, total_students: 275, total_professors: 3 },
  course_comparison: [
    { code: 'CS301', name: 'DSA',  avg_attendance: 88 },
    { code: 'CS302', name: 'DBMS', avg_attendance: 84 },
    { code: 'CS303', name: 'OS',   avg_attendance: 81 },
    { code: 'CS401', name: 'CN',   avg_attendance: 86 },
    { code: 'CS402', name: 'SE',   avg_attendance: 78 },
  ],
  flag_distribution: [
    { flag_type: 'weak_presence',    count: 5, avg_severity: 0.62 },
    { flag_type: 'cluster_sync',     count: 4, avg_severity: 0.54 },
    { flag_type: 'duplicate_device', count: 3, avg_severity: 0.87 },
    { flag_type: 'token_reuse',      count: 2, avg_severity: 0.69 },
    { flag_type: 'chronic_proxy',    count: 2, avg_severity: 0.91 },
  ],
  high_risk_students: [
    { id: 16, name: 'Siddharth Rao', enrollment: 'CS2021013', avg_risk: 0.92, total_flags: 6 },
    { id: 8,  name: 'Rohan Gupta',   enrollment: 'CS2021005', avg_risk: 0.85, total_flags: 5 },
    { id: 6,  name: 'Vikram Singh',  enrollment: 'CS2021003', avg_risk: 0.71, total_flags: 3 },
    { id: 12, name: 'Harsh Mehta',   enrollment: 'CS2021009', avg_risk: 0.63, total_flags: 4 },
  ],
};
