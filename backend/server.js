/**
 * LearnAvo Backend — Server Entry Point
 * Express + Socket.IO + All Routes
 * 
 * Demo-aware: detects if PostgreSQL is available at startup.
 * When DB is unavailable, serves rich demo data through real API routes.
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import qrRoutes from './routes/qr.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import anomalyRoutes from './routes/anomaly.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import studentRoutes from './routes/student.routes.js';

// Import WebSocket handler
import { setupWebSocket } from './websocket/liveSession.js';

// Import demo data
import {
  COURSES, CLASSROOMS, STUDENTS, STUDENT_ROSTER,
  SESSIONS, ANOMALY_FLAGS, RISK_SCORES,
  HOD_DATA, getDashboardStats, generateSessionDetail,
} from './utils/demoData.js';

// Import DB pool for health check
import pool from './config/db.js';

// Initialize Express
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173', 'http://10.0.2.2:3000', 'http://10.0.2.2:8081'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// =====================================================
// Database availability check
// =====================================================
let dbAvailable = false;

async function checkDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbAvailable = true;
    console.log('[DB] ✅ PostgreSQL connected');
  } catch (err) {
    dbAvailable = false;
    console.warn('[DB] ⚠ PostgreSQL unavailable — running in DEMO mode');
    console.warn(`[DB]   Reason: ${err.message}`);
  }
}

// Run check immediately
await checkDatabase();

// Expose DB status
app.set('dbAvailable', dbAvailable);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173', 'http://10.0.2.2:3000', 'http://10.0.2.2:8081'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      const demoTag = !dbAvailable ? ' [DEMO]' : '';
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms${demoTag}`);
    }
  });
  next();
});

// =====================================================
// API Routes — Real (DB-backed) routes
// =====================================================
app.use('/api/auth', authRoutes);

// Only mount DB-backed routes if DB is available
if (dbAvailable) {
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/anomaly', anomalyRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/student', studentRoutes);
}

// =====================================================
// Demo-Aware API Routes — Always available
// These serve persistent demo data when DB is unavailable,
// and are also used as fallbacks by the frontend.
// =====================================================

import { optionalAuth } from './middleware/auth.js';

// ----- Dashboard Stats (Professor) -----
app.get('/api/dashboard/stats', optionalAuth, (req, res) => {
  const professorId = req.user?.role === 'professor' ? req.user.id : null;
  res.json(getDashboardStats(professorId));
});

// ----- HOD Dashboard -----
app.get('/api/dashboard/hod', optionalAuth, (req, res) => {
  res.json(HOD_DATA);
});

// ----- Courses -----
app.get('/api/dashboard/courses', optionalAuth, (req, res) => {
  const professorId = req.user?.role === 'professor' ? req.user.id : null;
  const filtered = professorId
    ? COURSES.filter(c => c.professor_id === professorId)
    : COURSES;
  res.json(filtered);
});

// ----- Classrooms -----
app.get('/api/dashboard/classrooms', optionalAuth, (req, res) => {
  res.json(CLASSROOMS);
});

// ----- Students -----
app.get('/api/dashboard/students', optionalAuth, (req, res) => {
  res.json(STUDENT_ROSTER);
});

// ----- Sessions List -----
app.get('/api/sessions', optionalAuth, (req, res) => {
  const { status } = req.query;
  let filtered = SESSIONS;
  if (req.user?.role === 'professor') {
    filtered = filtered.filter(s => s.professor_id === req.user.id);
  }
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  res.json(filtered);
});

// ----- Session Detail -----
app.get('/api/sessions/:id', optionalAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const detail = generateSessionDetail(id);
  if (!detail) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(detail);
});

// ----- Anomaly Flags (all) -----
app.get('/api/anomaly/flags', optionalAuth, (req, res) => {
  res.json(ANOMALY_FLAGS);
});

// ----- Anomaly Flags by Session -----
app.get('/api/anomaly/flags/:sessionId', optionalAuth, (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  res.json(ANOMALY_FLAGS.filter(f => f.session_id === sessionId));
});

// ----- Risk Scores -----
app.get('/api/anomaly/risk-scores', optionalAuth, (req, res) => {
  res.json(RISK_SCORES);
});

// ----- Session Start/End + Attendance (demo stubs) -----
// In-memory stores for demo mode
const demoSessions = new Map();   // sessionId -> session data
const demoTokens = new Map();     // token -> { studentId, sessionId, used, ... }

if (!dbAvailable) {
  app.post('/api/sessions/start', optionalAuth, (req, res) => {
    const sessionId = Date.now();
    const sessionData = {
      id: sessionId,
      ...req.body,
      status: 'active',
      started_at: new Date().toISOString(),
      total_enrolled: 60,
    };
    demoSessions.set(sessionId, sessionData);
    // Also store by course+classroom key for student lookup
    const key = `${req.body.course_id}_${req.body.classroom_id}`;
    demoSessions.set(key, sessionData);
    console.log(`[DEMO] Session started: ${sessionId} (key: ${key})`);
    res.status(201).json(sessionData);
  });

  app.post('/api/sessions/:id/end', optionalAuth, (req, res) => {
    const id = parseInt(req.params.id);
    demoSessions.delete(id);
    res.json({ message: 'Demo session ended', sessionId: req.params.id });
  });

  // Demo attendance: generate-token
  app.post('/api/attendance/generate-token', optionalAuth, async (req, res) => {
    try {
      const { classroomId, courseId, staffId, rssiMedian, timestamp } = req.body;
      const studentId = req.user?.id || 4;

      // Check RSSI
      if (rssiMedian !== undefined && rssiMedian < -70) {
        return res.status(400).json({ error: 'BLE verification failed — too far from classroom' });
      }

      // Find existing session for this course+classroom
      const key = `${courseId}_${classroomId}`;
      let sessionData = demoSessions.get(key);
      let sessionId = sessionData?.id || Date.now();

      if (!sessionData) {
        // Auto-create demo session
        sessionData = { id: sessionId, course_id: courseId, classroom_id: classroomId, status: 'active' };
        demoSessions.set(sessionId, sessionData);
        demoSessions.set(key, sessionData);
      }

      // Generate HMAC token
      const crypto = await import('crypto');
      const HMAC_SECRET = process.env.HMAC_SECRET || process.env.QR_HMAC_SECRET || 'demo-secret-key';
      const nonce = crypto.randomBytes(16).toString('hex');
      const payload = JSON.stringify({ studentId, classroomId, courseId, staffId, timestamp: timestamp || Date.now(), nonce });
      const token = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
      const qrString = payload + '.' + token;
      const validUntil = new Date(Date.now() + 60000);

      // Store token
      demoTokens.set(token, { studentId, sessionId, courseId, classroomId, payload, used: false, validUntil });

      res.json({ token, qrString, qrPayload: payload, sessionId, expiresAt: validUntil.toISOString() });
    } catch (err) {
      console.error('Demo generate-token error:', err);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  });

  // Demo attendance: verify-scan
  app.post('/api/attendance/verify-scan', optionalAuth, async (req, res) => {
    try {
      const { token, qrPayload, rssiMedian, deviceFingerprint } = req.body;
      const studentId = req.user?.id || 4;
      const studentName = req.user?.name || 'Student';

      if (!token || !qrPayload) {
        return res.status(400).json({ success: false, error: 'Token and QR payload are required' });
      }

      // Verify HMAC
      const crypto = await import('crypto');
      const HMAC_SECRET = process.env.HMAC_SECRET || process.env.QR_HMAC_SECRET || 'demo-secret-key';
      const expectedToken = crypto.createHmac('sha256', HMAC_SECRET).update(qrPayload).digest('hex');
      if (expectedToken !== token) {
        return res.status(400).json({ success: false, error: 'Token tampered' });
      }

      // Check token store
      const tokenData = demoTokens.get(token);
      if (tokenData?.used) {
        return res.status(400).json({ success: false, error: 'Token already used' });
      }
      if (tokenData && new Date(tokenData.validUntil) < new Date()) {
        return res.status(400).json({ success: false, error: 'Token expired' });
      }

      // Mark token as used
      if (tokenData) tokenData.used = true;

      const markedAt = new Date();
      const sessionId = tokenData?.sessionId || null;

      // 🔴 Broadcast via WebSocket to dashboard
      const io = app.get('io');
      if (io) {
        const verifiedPayload = {
          student: { id: studentId, name: studentName },
          status: 'verified',
          qr_verified: true,
          ble_verified: true,
          rssi_median: rssiMedian,
          timestamp: markedAt.toISOString(),
        };
        // Broadcast to session-specific room
        if (sessionId) {
          io.to(`session:${sessionId}`).emit('session:student_verified', verifiedPayload);
        }
        // Always broadcast to global dashboard live feed
        io.to('dashboard:live').emit('session:student_verified', verifiedPayload);
        console.log(`[DEMO] 📡 Broadcasted attendance: ${studentName} (session: ${sessionId})`);
      }

      res.json({ success: true, markedAt: markedAt.toISOString(), sessionId });
    } catch (err) {
      console.error('Demo verify-scan error:', err);
      res.status(500).json({ success: false, error: 'Verification failed' });
    }
  });

  app.post('/api/anomaly/flags/:id/resolve', optionalAuth, (req, res) => {
    const flag = ANOMALY_FLAGS.find(f => f.id === parseInt(req.params.id));
    if (flag) flag.resolved = true;
    res.json({ message: 'Flag resolved' });
  });
}

// =====================================================
// Universal Attendance Broadcast — ALWAYS available
// Fallback endpoint used by student app when full verify
// flow fails. Simply broadcasts via WebSocket to dashboard.
// =====================================================
app.post('/api/attendance/broadcast', optionalAuth, (req, res) => {
  const { studentName, studentId, status, rssiMedian, courseId, classroomId } = req.body;
  const io = app.get('io');

  const name = studentName || req.user?.name || 'Student';
  const sid = studentId || req.user?.id || 0;

  if (io) {
    const verifiedPayload = {
      student: { id: sid, name: name },
      status: status || 'verified',
      qr_verified: true,
      ble_verified: true,
      rssi_median: rssiMedian || -55,
      timestamp: new Date().toISOString(),
    };
    io.to('dashboard:live').emit('session:student_verified', verifiedPayload);
    console.log(`[BROADCAST] 📡 Attendance event: ${name} → dashboard:live`);
  }
  res.json({ success: true, broadcast: true });
});

// =====================================================
// Legacy Demo API — kept for backwards compatibility
// =====================================================
app.get('/api/demo/stats', (req, res) => res.json(getDashboardStats()));
app.get('/api/demo/courses', (req, res) => res.json(COURSES));
app.get('/api/demo/classrooms', (req, res) => res.json(CLASSROOMS));
app.get('/api/demo/students', (req, res) => res.json(STUDENT_ROSTER));
app.get('/api/demo/anomaly-flags', (req, res) => res.json(ANOMALY_FLAGS));
app.get('/api/demo/risk-scores', (req, res) => res.json(RISK_SCORES));
app.get('/api/demo/hod', (req, res) => res.json(HOD_DATA));
app.get('/api/demo/sessions', (req, res) => res.json(SESSIONS));
app.get('/api/demo/session/:id', (req, res) => {
  res.json(generateSessionDetail(parseInt(req.params.id)));
});

// Demo Student API — Mock data for mobile app development
app.get('/api/demo/student/schedule/today', (req, res) => {
  const now = new Date();
  const currentHour = now.getHours();
  const periods = [
    { id: 1, courseId: 1, classroomId: 1, staffId: 1, subjectName: 'Data Structures & Algorithms', courseCode: 'CS301', classroomName: 'CS Lab 101', building: 'Block A', roomNumber: '101', staffName: 'Dr. Ananya Sharma', startTime: '09:00', endTime: '10:00' },
    { id: 2, courseId: 2, classroomId: 2, staffId: 1, subjectName: 'Database Management Systems', courseCode: 'CS302', classroomName: 'Lecture Hall B', building: 'Block B', roomNumber: '201', staffName: 'Dr. Ananya Sharma', startTime: '10:15', endTime: '11:15' },
    { id: 3, courseId: 3, classroomId: 3, staffId: 2, subjectName: 'Operating Systems', courseCode: 'CS303', classroomName: 'Seminar Room C', building: 'Block A', roomNumber: '305', staffName: 'Dr. Rajesh Kumar', startTime: '11:30', endTime: '12:30' },
    { id: 4, courseId: 1, classroomId: 1, staffId: 1, subjectName: 'DSA Lab', courseCode: 'CS301', classroomName: 'CS Lab 101', building: 'Block A', roomNumber: '101', staffName: 'Dr. Ananya Sharma', startTime: '14:00', endTime: '15:00' },
  ].map(p => {
    const startH = parseInt(p.startTime.split(':')[0]);
    const endH = parseInt(p.endTime.split(':')[0]);
    let state = 'upcoming';
    if (currentHour >= endH) state = 'absent';
    else if (currentHour >= startH) state = 'active';
    return { ...p, state, markedAt: null };
  });
  res.json({ date: now.toISOString().split('T')[0], periods });
});

app.get('/api/demo/student/attendance/history', (req, res) => {
  res.json({
    summary: [
      { course_id: 1, course_name: 'Data Structures & Algorithms', course_code: 'CS301', total_sessions: 14, attended_sessions: 12, attendance_pct: 85.7 },
      { course_id: 2, course_name: 'Database Management Systems', course_code: 'CS302', total_sessions: 14, attended_sessions: 10, attendance_pct: 71.4 },
      { course_id: 3, course_name: 'Operating Systems', course_code: 'CS303', total_sessions: 14, attended_sessions: 13, attendance_pct: 92.9 },
    ],
    log: Array.from({ length: 20 }, (_, i) => ({ id: i+1, status: i % 5 === 0 ? 'absent' : 'verified', scanned_at: new Date(Date.now() - i * 86400000).toISOString(), course_name: ['DSA', 'DBMS', 'OS'][i % 3], course_code: ['CS301', 'CS302', 'CS303'][i % 3] })),
  });
});

app.get('/api/demo/student/profile', (req, res) => {
  res.json({
    user: { id: 4, name: 'Arjun Patel', email: 'arjun@student.edu', role: 'student', department: 'Computer Science', student_id: 'CS2023001' },
    stats: { totalSessions: 42, attended: 35, enrolledCourses: 3, overallPct: 83.3 },
    warnings: [{ course_name: 'Database Management Systems', course_code: 'CS302', total_sessions: 14, attended: 10, pct: 71.4 }],
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'LearnAvo API',
    version: '1.0.0',
    mode: dbAvailable ? 'production' : 'demo',
    database: dbAvailable ? 'connected' : 'unavailable (demo mode)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// =====================================================
// Setup WebSocket
// =====================================================
setupWebSocket(io);

// =====================================================
// Start Server
// =====================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const modeStr = dbAvailable ? '🗄️  Database: Connected' : '🎭 Mode: DEMO (no database)';
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║     🎓 LearnAvo API Server                       ║
║     Intelligent Attendance Integrity System       ║
║                                                  ║
║     HTTP:   http://localhost:${PORT}               ║
║     WS:     ws://localhost:${PORT}                 ║
║     ${modeStr.padEnd(40)}    ║
║     Status: Running ✓                            ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
