/**
 * Anomaly Routes — Flags, Risk Scores, Pattern Analysis
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { query } from '../config/db.js';
import { runLayer3Analysis } from '../services/anomaly.service.js';

const router = Router();

// GET /api/anomaly/flags/:sessionId — Get anomaly flags for a session
router.get('/flags/:sessionId', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const result = await query(
      `SELECT af.*, u.name as student_name, u.student_id as enrollment
       FROM anomaly_flags af
       LEFT JOIN users u ON af.student_id = u.id
       WHERE af.session_id = $1
       ORDER BY af.severity DESC, af.created_at DESC`,
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Anomaly flags error:', err);
    res.status(500).json({ error: 'Failed to get anomaly flags' });
  }
});

// GET /api/anomaly/risk-scores — Get risk scores (filterable)
router.get('/risk-scores', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const { course_id, student_id, min_score = 0 } = req.query;
    let sql = `
      SELECT rs.*, u.name as student_name, u.student_id as enrollment,
             c.name as course_name, c.code as course_code
      FROM risk_scores rs
      JOIN users u ON rs.student_id = u.id
      JOIN courses c ON rs.course_id = c.id
      WHERE rs.score >= $1
    `;
    const params = [parseFloat(min_score)];

    if (course_id) {
      params.push(course_id);
      sql += ` AND rs.course_id = $${params.length}`;
    }
    if (student_id) {
      params.push(student_id);
      sql += ` AND rs.student_id = $${params.length}`;
    }

    sql += ` ORDER BY rs.score DESC, rs.calculated_at DESC LIMIT 100`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Risk scores error:', err);
    res.status(500).json({ error: 'Failed to get risk scores' });
  }
});

// GET /api/anomaly/patterns — Cross-session pattern analysis (HOD)
router.get('/patterns', authenticateToken, roleGuard('hod'), async (req, res) => {
  try {
    const results = await runLayer3Analysis();
    res.json(results);
  } catch (err) {
    console.error('Pattern analysis error:', err);
    res.status(500).json({ error: 'Failed to run pattern analysis' });
  }
});

// POST /api/anomaly/flags/:id/resolve — Resolve an anomaly flag
router.post('/flags/:id/resolve', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    await query(
      `UPDATE anomaly_flags SET resolved = TRUE, resolved_by = $1, resolved_at = NOW()
       WHERE id = $2`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Flag resolved' });
  } catch (err) {
    console.error('Resolve flag error:', err);
    res.status(500).json({ error: 'Failed to resolve flag' });
  }
});

export default router;
