/**
 * Attendance Routes — Dual-gate verification & history
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { query } from '../config/db.js';
import { validateQRToken } from '../services/qr.service.js';
import { validateBLEProximity, simulateBLEReadings } from '../services/ble.service.js';
import { runLayer1Checks } from '../services/anomaly.service.js';
import { getActiveSession } from '../services/session.service.js';

const router = Router();

/**
 * POST /api/attendance/verify — Dual-gate attendance verification
 * Body: { session_id, qr_data, rssi_readings, device_fingerprint }
 */
router.post('/verify', authenticateToken, async (req, res) => {
  const { session_id, qr_data, rssi_readings, device_fingerprint, simulate_ble } = req.body;

  if (!session_id || !qr_data) {
    return res.status(400).json({ error: 'session_id and qr_data are required' });
  }

  const session = getActiveSession(session_id);
  if (!session) {
    return res.status(404).json({ error: 'Session not active' });
  }

  // GATE 1: QR Verification
  const qrResult = await validateQRToken(session_id, qr_data, session.qr_secret);

  // GATE 2: BLE Proximity Verification
  const bleReadings = rssi_readings || (simulate_ble ? simulateBLEReadings(simulate_ble) : null);
  const bleResult = bleReadings
    ? validateBLEProximity(bleReadings)
    : { valid: false, rssiMedian: null, reason: 'No BLE readings provided' };

  // Determine overall status
  let status;
  if (qrResult.valid && bleResult.valid) {
    status = 'verified';
  } else if (qrResult.valid || bleResult.valid) {
    status = 'flagged';
  } else {
    status = 'rejected';
  }

  // Build attendance record
  const attendanceData = {
    session_id,
    student_id: req.user.id,
    qr_token_hash: qrResult.tokenHash || null,
    rssi_median: bleResult.rssiMedian,
    rssi_readings: bleReadings,
    device_fingerprint: device_fingerprint || `device-${req.user.id}`,
    qr_verified: qrResult.valid,
    ble_verified: bleResult.valid,
    status,
    tokenReused: qrResult.reason === 'Token already used',
  };

  // Save to DB
  let recordId;
  try {
    const result = await query(
      `INSERT INTO attendance_records
       (session_id, student_id, qr_token_hash, rssi_median, rssi_readings, device_fingerprint, qr_verified, ble_verified, status, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (session_id, student_id) DO UPDATE SET
         qr_token_hash = EXCLUDED.qr_token_hash,
         rssi_median = EXCLUDED.rssi_median,
         rssi_readings = EXCLUDED.rssi_readings,
         qr_verified = EXCLUDED.qr_verified,
         ble_verified = EXCLUDED.ble_verified,
         status = EXCLUDED.status,
         scan_attempts = attendance_records.scan_attempts + 1,
         scanned_at = NOW()
       RETURNING id, scan_attempts`,
      [
        session_id, req.user.id, attendanceData.qr_token_hash,
        attendanceData.rssi_median, JSON.stringify(bleReadings),
        attendanceData.device_fingerprint, qrResult.valid, bleResult.valid,
        status, status === 'verified' ? new Date() : null,
      ]
    );
    recordId = result.rows[0].id;
    attendanceData.attendance_id = recordId;
    attendanceData.scan_attempts = result.rows[0].scan_attempts;

    // Update session counters
    if (status === 'verified') {
      await query(
        `UPDATE sessions SET total_verified = total_verified + 1 WHERE id = $1`,
        [session_id]
      );
    } else if (status === 'flagged') {
      await query(
        `UPDATE sessions SET total_flagged = total_flagged + 1 WHERE id = $1`,
        [session_id]
      );
    } else {
      await query(
        `UPDATE sessions SET total_rejected = total_rejected + 1 WHERE id = $1`,
        [session_id]
      );
    }
  } catch (err) {
    console.warn('Attendance DB write skipped:', err.message);
    attendanceData.attendance_id = Date.now();
  }

  // Run Layer 1 anomaly checks
  const anomalyFlags = await runLayer1Checks(attendanceData, session_id);

  // Broadcast via WebSocket
  const io = req.app.get('io');
  if (io) {
    const verifiedPayload = {
      student: { id: req.user.id, name: req.user.name },
      status,
      qr_verified: qrResult.valid,
      ble_verified: bleResult.valid,
      rssi_median: bleResult.rssiMedian,
      timestamp: new Date().toISOString(),
    };
    // Broadcast to session-specific room
    io.to(`session:${session_id}`).emit('session:student_verified', verifiedPayload);
    // Broadcast to global dashboard live feed
    io.to('dashboard:live').emit('session:student_verified', verifiedPayload);

    // Broadcast anomaly flags
    for (const flag of anomalyFlags) {
      const flagPayload = {
        ...flag,
        student: { id: req.user.id, name: req.user.name },
        timestamp: new Date().toISOString(),
      };
      io.to(`session:${session_id}`).emit('session:anomaly_flag', flagPayload);
      io.to('dashboard:live').emit('session:anomaly_flag', flagPayload);
    }
  }

  res.json({
    status,
    gates: {
      qr: { verified: qrResult.valid, reason: qrResult.reason || 'Valid' },
      ble: { verified: bleResult.valid, reason: bleResult.reason, rssi_median: bleResult.rssiMedian },
    },
    anomaly_flags: anomalyFlags,
    message:
      status === 'verified'
        ? 'Attendance recorded ✓'
        : status === 'flagged'
          ? 'Attendance flagged for review'
          : 'Attendance rejected — both gates must pass',
  });
});

// GET /api/attendance/session/:id — Get all attendance for a session
router.get('/session/:id', authenticateToken, roleGuard('professor', 'hod'), async (req, res) => {
  try {
    const result = await query(
      `SELECT ar.*, u.name as student_name, u.student_id as enrollment, u.email
       FROM attendance_records ar
       JOIN users u ON ar.student_id = u.id
       WHERE ar.session_id = $1
       ORDER BY ar.scanned_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Attendance list error:', err);
    res.status(500).json({ error: 'Failed to list attendance' });
  }
});

// GET /api/attendance/student/:id — Get attendance history for a student
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT ar.*, s.started_at as session_date, c.name as course_name, c.code as course_code
       FROM attendance_records ar
       JOIN sessions s ON ar.session_id = s.id
       JOIN courses c ON s.course_id = c.id
       WHERE ar.student_id = $1
       ORDER BY ar.scanned_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Student attendance error:', err);
    res.status(500).json({ error: 'Failed to get student attendance' });
  }
});

/**
 * POST /api/attendance/generate-token
 * Student-initiated: generates HMAC-SHA256 signed one-time token
 * Body: { studentId, classroomId, subjectId, courseId, staffId, rssiMedian, timestamp }
 */
router.post('/generate-token', authenticateToken, async (req, res) => {
  try {
    const { classroomId, courseId, staffId, rssiMedian, timestamp } = req.body;
    const studentId = req.user.id;
    const HMAC_SECRET = process.env.HMAC_SECRET || process.env.QR_HMAC_SECRET;

    // 1. Confirm role is student
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can generate attendance tokens' });
    }

    // 2. Check student is enrolled in this course
    try {
      const enrollCheck = await query(
        `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );
      if (enrollCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You are not enrolled in this course' });
      }
    } catch (dbErr) {
      console.warn('Enrollment check skipped (DB):', dbErr.message);
    }

    // 3. Check RSSI >= -70 (server-side validation)
    if (rssiMedian !== undefined && rssiMedian < -70) {
      return res.status(400).json({ error: 'BLE verification failed — too far from classroom' });
    }

    // 4. Generate nonce + HMAC token
    const crypto = await import('crypto');
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = JSON.stringify({
      studentId, classroomId, courseId, staffId, timestamp: timestamp || Date.now(), nonce
    });
    const token = crypto.createHmac('sha256', HMAC_SECRET)
      .update(payload)
      .digest('hex');
    const qrString = payload + '.' + token;
    const validUntil = new Date(Date.now() + 60000); // 60 seconds

    // 5. Find or create a session for this class today
    let sessionId = null;
    try {
      const sessionCheck = await query(
        `SELECT id FROM sessions 
         WHERE course_id = $1 AND classroom_id = $2 AND DATE(started_at) = CURRENT_DATE
         LIMIT 1`,
        [courseId, classroomId]
      );
      if (sessionCheck.rows.length > 0) {
        sessionId = sessionCheck.rows[0].id;
      } else {
        // Auto-create a session for student-initiated attendance
        const newSession = await query(
          `INSERT INTO sessions (course_id, classroom_id, professor_id, qr_secret, status, started_at)
           VALUES ($1, $2, $3, $4, 'active', NOW())
           RETURNING id`,
          [courseId, classroomId, staffId, crypto.randomBytes(32).toString('hex')]
        );
        sessionId = newSession.rows[0].id;
      }

      // 6. Check no existing verified attendance today
      const existingCheck = await query(
        `SELECT id FROM attendance_records 
         WHERE session_id = $1 AND student_id = $2 AND status = 'verified'`,
        [sessionId, studentId]
      );
      if (existingCheck.rows.length > 0) {
        return res.status(409).json({ error: 'You have already marked attendance for this class' });
      }

      // 7. Store token in marking_tokens
      await query(
        `INSERT INTO marking_tokens (student_id, session_id, course_id, token, qr_payload, rssi_at_generation, valid_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [studentId, sessionId, courseId, token, payload, rssiMedian || null, validUntil]
      );
    } catch (dbErr) {
      console.warn('Token DB insert skipped:', dbErr.message);
    }

    res.json({
      token,
      qrString,
      qrPayload: payload,
      sessionId,
      expiresAt: validUntil.toISOString(),
    });
  } catch (err) {
    console.error('Generate token error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

/**
 * POST /api/attendance/verify-scan
 * Validates HMAC token and records attendance.
 * Body: { token, qrPayload, rssiMedian, deviceFingerprint }
 */
router.post('/verify-scan', authenticateToken, async (req, res) => {
  try {
    const { token, qrPayload, rssiMedian, deviceFingerprint } = req.body;
    const studentId = req.user.id;
    const HMAC_SECRET = process.env.HMAC_SECRET || process.env.QR_HMAC_SECRET;

    if (!token || !qrPayload) {
      return res.status(400).json({ error: 'Token and QR payload are required' });
    }

    // 1. Look up token in marking_tokens
    let tokenRow = null;
    try {
      const tokenResult = await query(
        `SELECT * FROM marking_tokens WHERE token = $1 AND student_id = $2`,
        [token, studentId]
      );
      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid token' });
      }
      tokenRow = tokenResult.rows[0];
    } catch (dbErr) {
      console.warn('Token lookup skipped (DB):', dbErr.message);
      // Fallback: verify HMAC directly without DB
    }

    // 2. Check token not already used
    if (tokenRow && tokenRow.used) {
      return res.status(400).json({ success: false, error: 'Token already used' });
    }

    // 3. Check expiry
    if (tokenRow && new Date(tokenRow.valid_until) < new Date()) {
      return res.status(400).json({ success: false, error: 'Token expired' });
    }

    // 4. Recompute HMAC and compare
    const crypto = await import('crypto');
    const expectedToken = crypto.createHmac('sha256', HMAC_SECRET)
      .update(qrPayload)
      .digest('hex');
    if (expectedToken !== token) {
      return res.status(400).json({ success: false, error: 'Token tampered' });
    }

    // 5. Check RSSI >= -70
    if (rssiMedian !== undefined && rssiMedian < -70) {
      return res.status(400).json({ success: false, error: 'BLE verification failed' });
    }

    const sessionId = tokenRow ? tokenRow.session_id : null;

    // 6. Check no existing attendance record
    if (sessionId) {
      try {
        const existingCheck = await query(
          `SELECT id FROM attendance_records 
           WHERE session_id = $1 AND student_id = $2 AND status = 'verified'`,
          [sessionId, studentId]
        );
        if (existingCheck.rows.length > 0) {
          return res.status(409).json({ success: false, error: 'Already marked' });
        }
      } catch (dbErr) {
        console.warn('Duplicate check skipped:', dbErr.message);
      }
    }

    // 7. INSERT attendance record
    let markedAt = new Date();
    if (sessionId) {
      try {
        await query(
          `INSERT INTO attendance_records 
           (session_id, student_id, qr_token_hash, rssi_median, device_fingerprint, 
            qr_verified, ble_verified, status, verified_at, scanned_at)
           VALUES ($1, $2, $3, $4, $5, true, true, 'verified', NOW(), NOW())
           ON CONFLICT (session_id, student_id) DO UPDATE SET
             status = 'verified', verified_at = NOW(), scanned_at = NOW(),
             qr_verified = true, ble_verified = true`,
          [sessionId, studentId, token, rssiMedian || null, deviceFingerprint || null]
        );

        // Update session counters
        await query(
          `UPDATE sessions SET total_verified = total_verified + 1 WHERE id = $1`,
          [sessionId]
        );
      } catch (dbErr) {
        console.warn('Attendance insert skipped:', dbErr.message);
      }
    }

    // 8. Mark token as used
    if (tokenRow) {
      try {
        await query(
          `UPDATE marking_tokens SET used = true, used_at = NOW(), device_fingerprint = $2 WHERE id = $1`,
          [tokenRow.id, deviceFingerprint || null]
        );
      } catch (dbErr) {
        console.warn('Token update skipped:', dbErr.message);
      }
    }

    // 9. Fire anomaly engine Layer 1 (async, non-blocking)
    if (sessionId) {
      runLayer1Checks({
        session_id: sessionId,
        student_id: studentId,
        rssi_median: rssiMedian,
        device_fingerprint: deviceFingerprint,
        attendance_id: null,
      }, sessionId).catch(err => console.warn('Anomaly check error:', err.message));
    }

    // 10. Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      const verifiedPayload = {
        student: { id: studentId, name: req.user.name },
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
    }

    res.json({
      success: true,
      markedAt: markedAt.toISOString(),
      sessionId,
    });
  } catch (err) {
    console.error('Verify scan error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

export default router;

