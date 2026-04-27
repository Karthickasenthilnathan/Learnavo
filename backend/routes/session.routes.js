/**
 * Session Routes — Start, End, List, Detail
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { query } from '../config/db.js';
import { startSession, endSession, getAllActiveSessions } from '../services/session.service.js';

const router = Router();

// GET /api/sessions — List sessions for the professor
router.get('/', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    let sql = `
      SELECT s.*, c.name as course_name, c.code as course_code,
             cl.name as classroom_name, u.name as professor_name
      FROM sessions s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN classrooms cl ON s.classroom_id = cl.id
      LEFT JOIN users u ON s.professor_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (req.user.role === 'professor') {
      conditions.push(`s.professor_id = $${params.length + 1}`);
      params.push(req.user.id);
    }
    if (status) {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY s.started_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// GET /api/sessions/active — Get all currently active sessions
router.get('/active', authenticateToken, (req, res) => {
  const sessions = getAllActiveSessions();
  res.json(sessions);
});

// GET /api/sessions/:id — Get session details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, c.name as course_name, c.code as course_code,
              cl.name as classroom_name, u.name as professor_name
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN classrooms cl ON s.classroom_id = cl.id
       LEFT JOIN users u ON s.professor_id = u.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get attendance records for this session
    const attendance = await query(
      `SELECT ar.*, u.name as student_name, u.student_id as enrollment
       FROM attendance_records ar
       JOIN users u ON ar.student_id = u.id
       WHERE ar.session_id = $1
       ORDER BY ar.scanned_at DESC`,
      [req.params.id]
    );

    // Get anomaly flags
    const flags = await query(
      `SELECT af.*, u.name as student_name
       FROM anomaly_flags af
       LEFT JOIN users u ON af.student_id = u.id
       WHERE af.session_id = $1
       ORDER BY af.created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      attendance: attendance.rows,
      anomaly_flags: flags.rows,
    });
  } catch (err) {
    console.error('Session detail error:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// POST /api/sessions/start — Start a new session
router.post('/start', authenticateToken, roleGuard('professor'), async (req, res) => {
  try {
    const { course_id, classroom_id } = req.body;

    if (!course_id || !classroom_id) {
      return res.status(400).json({ error: 'course_id and classroom_id are required' });
    }

    const io = req.app.get('io');
    const session = await startSession(course_id, classroom_id, req.user.id, io);

    res.status(201).json(session);
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/sessions/:id/end — End an active session
router.post('/:id/end', authenticateToken, roleGuard('professor'), async (req, res) => {
  try {
    await endSession(parseInt(req.params.id));
    res.json({ message: 'Session ended', sessionId: req.params.id });
  } catch (err) {
    console.error('End session error:', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router;
