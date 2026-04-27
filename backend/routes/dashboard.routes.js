/**
 * Dashboard Routes — Stats, Analytics, Overview
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { query } from '../config/db.js';

const router = Router();

// GET /api/dashboard/stats — Professor dashboard stats
router.get('/stats', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const professorId = req.user.role === 'professor' ? req.user.id : null;

    // Today's sessions
    const todaySessions = await query(
      `SELECT COUNT(*) as cnt FROM sessions
       WHERE DATE(started_at) = CURRENT_DATE
       ${professorId ? 'AND professor_id = $1' : ''}`,
      professorId ? [professorId] : []
    );

    // Total students
    const totalStudents = await query(
      `SELECT COUNT(DISTINCT e.student_id) as cnt FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       ${professorId ? 'WHERE c.professor_id = $1' : ''}`,
      professorId ? [professorId] : []
    );

    // Average attendance
    const avgAttendance = await query(
      `SELECT COALESCE(
         ROUND(AVG(s.total_verified::numeric / NULLIF(s.total_enrolled, 0) * 100), 1),
         0
       ) as avg_pct
       FROM sessions s
       WHERE s.status = 'completed'
       ${professorId ? 'AND s.professor_id = $1' : ''}`,
      professorId ? [professorId] : []
    );

    // Active anomaly flags
    const activeFlags = await query(
      `SELECT COUNT(*) as cnt FROM anomaly_flags af
       JOIN sessions s ON af.session_id = s.id
       WHERE af.resolved = FALSE
       ${professorId ? 'AND s.professor_id = $1' : ''}`,
      professorId ? [professorId] : []
    );

    // Recent sessions (last 5)
    const recentSessions = await query(
      `SELECT s.*, c.name as course_name, c.code as course_code,
              cl.name as classroom_name
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       LEFT JOIN classrooms cl ON s.classroom_id = cl.id
       ${professorId ? 'WHERE s.professor_id = $1' : ''}
       ORDER BY s.started_at DESC LIMIT 5`,
      professorId ? [professorId] : []
    );

    // Attendance trend (last 30 days)
    const trend = await query(
      `SELECT DATE(s.started_at) as date,
              COALESCE(ROUND(AVG(s.total_verified::numeric / NULLIF(s.total_enrolled, 0) * 100), 1), 0) as avg_pct,
              COUNT(*) as session_count
       FROM sessions s
       WHERE s.status = 'completed'
         AND s.started_at > NOW() - INTERVAL '30 days'
         ${professorId ? 'AND s.professor_id = $1' : ''}
       GROUP BY DATE(s.started_at)
       ORDER BY date ASC`,
      professorId ? [professorId] : []
    );

    res.json({
      today_sessions: parseInt(todaySessions.rows[0].cnt),
      total_students: parseInt(totalStudents.rows[0].cnt),
      avg_attendance: parseFloat(avgAttendance.rows[0].avg_pct),
      active_flags: parseInt(activeFlags.rows[0].cnt),
      recent_sessions: recentSessions.rows,
      attendance_trend: trend.rows,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// GET /api/dashboard/hod — HOD-level analytics
router.get('/hod', authenticateToken, roleGuard('hod'), async (req, res) => {
  try {
    // Department-wide stats
    const deptStats = await query(
      `SELECT
         COUNT(DISTINCT s.id) as total_sessions,
         COUNT(DISTINCT c.id) as total_courses,
         COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student') as total_students,
         COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'professor') as total_professors
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       JOIN enrollments e ON e.course_id = c.id
       JOIN users u ON e.student_id = u.id`
    );

    // Course-wise attendance comparison
    const courseComparison = await query(
      `SELECT c.name, c.code,
              COUNT(DISTINCT s.id) as sessions,
              COALESCE(ROUND(AVG(s.total_verified::numeric / NULLIF(s.total_enrolled, 0) * 100), 1), 0) as avg_attendance
       FROM courses c
       LEFT JOIN sessions s ON s.course_id = c.id AND s.status = 'completed'
       GROUP BY c.id, c.name, c.code
       ORDER BY avg_attendance DESC`
    );

    // High-risk students
    const highRiskStudents = await query(
      `SELECT u.id, u.name, u.student_id as enrollment,
              ROUND(AVG(rs.score)::numeric, 2) as avg_risk,
              COUNT(af.id) as total_flags
       FROM users u
       LEFT JOIN risk_scores rs ON rs.student_id = u.id
       LEFT JOIN anomaly_flags af ON af.student_id = u.id AND af.resolved = FALSE
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.student_id
       HAVING AVG(rs.score) > 0.4 OR COUNT(af.id) > 2
       ORDER BY avg_risk DESC NULLS LAST
       LIMIT 10`
    );

    // Flag distribution by type
    const flagDistribution = await query(
      `SELECT flag_type, COUNT(*) as count,
              ROUND(AVG(severity)::numeric, 2) as avg_severity
       FROM anomaly_flags
       GROUP BY flag_type
       ORDER BY count DESC`
    );

    res.json({
      department: deptStats.rows[0],
      course_comparison: courseComparison.rows,
      high_risk_students: highRiskStudents.rows,
      flag_distribution: flagDistribution.rows,
    });
  } catch (err) {
    console.error('HOD dashboard error:', err);
    res.status(500).json({ error: 'Failed to get HOD analytics' });
  }
});

// GET /api/dashboard/courses — List courses for session creation
router.get('/courses', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const conditions = req.user.role === 'professor' ? 'WHERE c.professor_id = $1' : '';
    const params = req.user.role === 'professor' ? [req.user.id] : [];

    const result = await query(
      `SELECT c.*, u.name as professor_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled_count
       FROM courses c
       LEFT JOIN users u ON c.professor_id = u.id
       ${conditions}
       ORDER BY c.name`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Courses list error:', err);
    res.status(500).json({ error: 'Failed to list courses' });
  }
});

// GET /api/dashboard/classrooms — List classrooms
router.get('/classrooms', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT cl.*, b.mac_address as beacon_mac, b.status as beacon_status,
              b.rssi_threshold, b.last_calibrated
       FROM classrooms cl
       LEFT JOIN beacons b ON b.classroom_id = cl.id
       ORDER BY cl.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Classrooms list error:', err);
    res.status(500).json({ error: 'Failed to list classrooms' });
  }
});

// GET /api/dashboard/students — List students (for professor/HOD)
router.get('/students', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const { course_id } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.student_id as enrollment, u.department,
             COUNT(DISTINCT ar.session_id) FILTER (WHERE ar.status = 'verified') as attended_sessions,
             COUNT(DISTINCT s.id) as total_sessions,
             COALESCE(ROUND(AVG(rs.score)::numeric, 2), 0) as avg_risk_score,
             COUNT(af.id) FILTER (WHERE af.resolved = FALSE) as active_flags
      FROM users u
      LEFT JOIN enrollment e ON e.student_id = u.id
      LEFT JOIN sessions s ON s.course_id = e.course_id AND s.status = 'completed'
      LEFT JOIN attendance_records ar ON ar.student_id = u.id AND ar.session_id = s.id
      LEFT JOIN risk_scores rs ON rs.student_id = u.id
      LEFT JOIN anomaly_flags af ON af.student_id = u.id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (course_id) {
      params.push(course_id);
      sql += ` AND e.course_id = $${params.length}`;
    }

    sql += ` GROUP BY u.id, u.name, u.email, u.student_id, u.department ORDER BY u.name`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

export default router;
