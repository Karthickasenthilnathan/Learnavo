/**
 * Student Routes — Schedule, Profile, Attendance History
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { query } from '../config/db.js';

const router = Router();

/**
 * GET /api/student/schedule/today
 * Returns today's class schedule for the logged-in student.
 * Each period includes timing, subject, classroom, and attendance status.
 */
router.get('/schedule/today', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    // JavaScript: 0=Sunday, 1=Monday... matches PostgreSQL EXTRACT(DOW)
    const today = new Date().getDay();

    const result = await query(
      `SELECT 
        ss.id,
        ss.course_id,
        ss.classroom_id,
        ss.staff_id,
        ss.subject_name,
        ss.day_of_week,
        ss.class_start_time,
        ss.class_end_time,
        c.code as course_code,
        cl.name as classroom_name,
        cl.building,
        cl.room_number,
        u.name as staff_name,
        ar.id as attendance_id,
        ar.status as attendance_status,
        ar.scanned_at as marked_at
      FROM student_schedules ss
      JOIN courses c ON ss.course_id = c.id
      JOIN classrooms cl ON ss.classroom_id = cl.id
      JOIN users u ON ss.staff_id = u.id
      LEFT JOIN sessions s ON (
        s.course_id = ss.course_id 
        AND s.classroom_id = ss.classroom_id
        AND DATE(s.started_at) = CURRENT_DATE
      )
      LEFT JOIN attendance_records ar ON (
        ar.session_id = s.id 
        AND ar.student_id = $1
      )
      WHERE ss.student_id = $1 
        AND ss.day_of_week = $2
        AND ss.is_active = true
      ORDER BY ss.class_start_time ASC`,
      [studentId, today]
    );

    // Compute period state based on current time
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM

    const periods = result.rows.map(row => {
      let state = 'upcoming'; // grey
      const start = row.class_start_time.slice(0, 5);
      const end = row.class_end_time.slice(0, 5);

      if (row.attendance_status === 'verified') {
        state = 'marked';
      } else if (currentTimeStr >= end) {
        state = row.attendance_status ? row.attendance_status : 'absent';
      } else if (currentTimeStr >= start && currentTimeStr < end) {
        state = 'active';
      }

      return {
        id: row.id,
        courseId: row.course_id,
        classroomId: row.classroom_id,
        staffId: row.staff_id,
        subjectName: row.subject_name,
        courseCode: row.course_code,
        classroomName: row.classroom_name,
        building: row.building,
        roomNumber: row.room_number,
        staffName: row.staff_name,
        startTime: start,
        endTime: end,
        state,
        markedAt: row.marked_at || null,
      };
    });

    res.json({ date: now.toISOString().split('T')[0], periods });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

/**
 * GET /api/student/attendance/history
 * Returns per-course attendance summary and date-wise log.
 */
router.get('/attendance/history', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Per-course summary
    const summaryResult = await query(
      `SELECT 
        c.id as course_id,
        c.name as course_name,
        c.code as course_code,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ar.status = 'verified' THEN ar.id END) as attended_sessions,
        ROUND(
          CASE WHEN COUNT(DISTINCT s.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ar.status = 'verified' THEN ar.id END)::DECIMAL / COUNT(DISTINCT s.id)) * 100
            ELSE 0 
          END, 1
        ) as attendance_pct
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN sessions s ON s.course_id = c.id AND s.status IN ('completed', 'active')
      LEFT JOIN attendance_records ar ON ar.session_id = s.id AND ar.student_id = $1
      WHERE e.student_id = $1
      GROUP BY c.id, c.name, c.code
      ORDER BY c.code`,
      [studentId]
    );

    // Recent attendance log (last 30 entries)
    const logResult = await query(
      `SELECT 
        ar.id,
        ar.status,
        ar.scanned_at,
        c.name as course_name,
        c.code as course_code,
        s.started_at as session_date
      FROM attendance_records ar
      JOIN sessions s ON ar.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE ar.student_id = $1
      ORDER BY ar.scanned_at DESC
      LIMIT 30`,
      [studentId]
    );

    res.json({
      summary: summaryResult.rows,
      log: logResult.rows,
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

/**
 * GET /api/student/profile
 * Returns student info + overall attendance + threshold warnings.
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const userResult = await query(
      `SELECT id, name, email, role, department, student_id, avatar_url, created_at
       FROM users WHERE id = $1`,
      [studentId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Overall attendance
    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ar.status = 'verified' THEN ar.id END) as attended,
        COUNT(DISTINCT e.course_id) as enrolled_courses
      FROM enrollments e
      LEFT JOIN sessions s ON s.course_id = e.course_id AND s.status IN ('completed', 'active')
      LEFT JOIN attendance_records ar ON ar.session_id = s.id AND ar.student_id = $1
      WHERE e.student_id = $1`,
      [studentId]
    );

    // Courses below 75%
    const warningResult = await query(
      `SELECT 
        c.name as course_name,
        c.code as course_code,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ar.status = 'verified' THEN ar.id END) as attended,
        ROUND(
          CASE WHEN COUNT(DISTINCT s.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ar.status = 'verified' THEN ar.id END)::DECIMAL / COUNT(DISTINCT s.id)) * 100
            ELSE 100 
          END, 1
        ) as pct
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN sessions s ON s.course_id = c.id AND s.status IN ('completed', 'active')
      LEFT JOIN attendance_records ar ON ar.session_id = s.id AND ar.student_id = $1
      WHERE e.student_id = $1
      GROUP BY c.id, c.name, c.code
      HAVING ROUND(
        CASE WHEN COUNT(DISTINCT s.id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN ar.status = 'verified' THEN ar.id END)::DECIMAL / COUNT(DISTINCT s.id)) * 100
          ELSE 100 
        END, 1
      ) < 75
      ORDER BY pct ASC`,
      [studentId]
    );

    const stats = statsResult.rows[0];
    const overallPct = stats.total_sessions > 0
      ? Math.round((stats.attended / stats.total_sessions) * 1000) / 10
      : 100;

    res.json({
      user: userResult.rows[0],
      stats: {
        totalSessions: parseInt(stats.total_sessions),
        attended: parseInt(stats.attended),
        enrolledCourses: parseInt(stats.enrolled_courses),
        overallPct,
      },
      warnings: warningResult.rows,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
