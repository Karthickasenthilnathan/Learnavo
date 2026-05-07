/**
 * Anomaly Detection Engine — Three-Layer Architecture
 * Layer 1: Real-time flags (per-scan)
 * Layer 2: Session-level predictions (post-class)
 * Layer 3: Cross-session pattern intelligence (periodic)
 */
import { query } from '../config/db.js';
import {
  CLUSTER_SYNC_WINDOW_MS,
  CLUSTER_SYNC_MIN_STUDENTS,
  DUPLICATE_DEVICE_WINDOW_MS,
  RISK_WEIGHTS,
  ATTENDANCE_THRESHOLD_PERCENT,
} from '../utils/constants.js';
import { calculateRSSIConsistency } from './ble.service.js';

// In-memory scan buffer for cluster detection
const scanBuffer = new Map(); // sessionId -> [{ studentId, timestamp }]

// ============================================================
// LAYER 1 — Real-Time Flags (fires on each scan)
// ============================================================

/**
 * Run all Layer 1 checks on an attendance event.
 * Returns array of anomaly flags.
 */
export async function runLayer1Checks(attendanceData, sessionId) {
  const flags = [];

  // 1. Duplicate Device Detection
  const dupFlag = await checkDuplicateDevice(attendanceData, sessionId);
  if (dupFlag) flags.push(dupFlag);

  // 2. Token Reuse (already handled in QR validation, but double-check)
  if (attendanceData.tokenReused) {
    flags.push({
      flag_type: 'token_reuse',
      severity: 0.9,
      details: {
        message: 'QR token was already used by another student',
        token_hash: attendanceData.qr_token_hash,
      },
    });
  }

  // 3. Cluster Sync Alert
  const clusterFlag = checkClusterSync(attendanceData.student_id, sessionId);
  if (clusterFlag) flags.push(clusterFlag);

  // 4. Weak Presence Flag
  if (attendanceData.qr_verified && !attendanceData.ble_verified) {
    flags.push({
      flag_type: 'weak_presence',
      severity: 0.7,
      details: {
        message: 'QR scan passed but BLE proximity check failed',
        rssi_median: attendanceData.rssi_median,
        threshold: parseInt(process.env.BLE_RSSI_THRESHOLD || '-75'),
      },
    });
  }

  // Persist flags to DB
  for (const flag of flags) {
    try {
      await query(
        `INSERT INTO anomaly_flags (attendance_id, session_id, student_id, flag_type, severity, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          attendanceData.attendance_id,
          sessionId,
          attendanceData.student_id,
          flag.flag_type,
          flag.severity,
          JSON.stringify(flag.details),
        ]
      );
    } catch (err) {
      console.warn('Anomaly flag DB insert skipped:', err.message);
    }
  }

  return flags;
}

/**
 * Check for duplicate device — same student, different device IDs within 5 minutes.
 */
async function checkDuplicateDevice(attendanceData, sessionId) {
  try {
    const result = await query(
      `SELECT device_fingerprint, scanned_at FROM attendance_records
       WHERE student_id = $1 AND session_id = $2
       AND scanned_at > NOW() - INTERVAL '5 minutes'
       AND device_fingerprint != $3`,
      [attendanceData.student_id, sessionId, attendanceData.device_fingerprint]
    );

    if (result.rows.length > 0) {
      return {
        flag_type: 'duplicate_device',
        severity: 0.95,
        details: {
          message: 'Same student scanned from multiple devices within 5 minutes',
          current_device: attendanceData.device_fingerprint,
          previous_device: result.rows[0].device_fingerprint,
          previous_scan: result.rows[0].scanned_at,
        },
      };
    }
  } catch {
    // DB unavailable
  }
  return null;
}

/**
 * Check for cluster sync — 5+ students scanning within 3-second window.
 */
function checkClusterSync(studentId, sessionId) {
  const now = Date.now();
  if (!scanBuffer.has(sessionId)) {
    scanBuffer.set(sessionId, []);
  }

  const buffer = scanBuffer.get(sessionId);
  buffer.push({ studentId, timestamp: now });

  // Clean old entries
  const cutoff = now - CLUSTER_SYNC_WINDOW_MS;
  const recent = buffer.filter((s) => s.timestamp > cutoff);
  scanBuffer.set(sessionId, recent);

  if (recent.length >= CLUSTER_SYNC_MIN_STUDENTS) {
    return {
      flag_type: 'cluster_sync',
      severity: 0.6,
      details: {
        message: `${recent.length} students scanned within ${CLUSTER_SYNC_WINDOW_MS / 1000}s window`,
        student_count: recent.length,
        window_ms: CLUSTER_SYNC_WINDOW_MS,
        students: recent.map((s) => s.studentId),
      },
    };
  }
  return null;
}

// ============================================================
// LAYER 2 — Session-Level Predictions (post-class)
// ============================================================

/**
 * Calculate per-student proxy risk scores for a completed session.
 */
export async function runLayer2Analysis(sessionId) {
  const scores = [];

  try {
    // Get all attendance records for this session
    const records = await query(
      `SELECT ar.*, u.name as student_name,
              (SELECT COUNT(*) FROM anomaly_flags af WHERE af.attendance_id = ar.id) as flag_count
       FROM attendance_records ar
       JOIN users u ON ar.student_id = u.id
       WHERE ar.session_id = $1`,
      [sessionId]
    );

    for (const record of records.rows) {
      const rssiReadings = record.rssi_readings || [];
      const rssiConsistency = calculateRSSIConsistency(rssiReadings);

      // Get historical flag count for this student
      let historicalFlags = 0;
      try {
        const hist = await query(
          `SELECT COUNT(*) as cnt FROM anomaly_flags WHERE student_id = $1`,
          [record.student_id]
        );
        historicalFlags = parseInt(hist.rows[0].cnt);
      } catch { /* skip */ }

      // Calculate weighted risk score
      const factors = {
        rssi_consistency: Math.min(rssiConsistency / 20, 1),       // normalized σ
        scan_timing: record.scan_attempts > 3 ? 0.8 : record.scan_attempts > 1 ? 0.4 : 0.1,
        attempt_count: Math.min(record.scan_attempts / 5, 1),
        historical_flags: Math.min(historicalFlags / 10, 1),
        cluster_score: record.flag_count > 0 ? 0.5 : 0,
      };

      const score = Object.entries(RISK_WEIGHTS).reduce(
        (total, [key, weight]) => total + (factors[key] || 0) * weight,
        0
      );

      const riskEntry = {
        student_id: record.student_id,
        session_id: sessionId,
        score: Math.round(score * 100) / 100,
        factors,
      };

      scores.push(riskEntry);

      // Persist to DB
      try {
        const session = await query(`SELECT course_id FROM sessions WHERE id = $1`, [sessionId]);
        await query(
          `INSERT INTO risk_scores (student_id, course_id, session_id, score, factors)
           VALUES ($1, $2, $3, $4, $5)`,
          [record.student_id, session.rows[0]?.course_id, sessionId, riskEntry.score, JSON.stringify(factors)]
        );
      } catch { /* skip */ }
    }
  } catch (err) {
    console.warn('Layer 2 analysis error:', err.message);
  }

  return scores;
}

// ============================================================
// LAYER 3 — Cross-Session Pattern Intelligence
// ============================================================

/**
 * Run cross-session pattern analysis.
 * Called periodically (e.g., weekly via cron).
 */
export async function runLayer3Analysis() {
  const results = { chronic_proxies: [], trajectory_warnings: [], class_anomalies: [] };

  try {
    // 1. Chronic Proxy Detection
    // Students with high attendance but consistently high risk scores
    const chronicResult = await query(
      `SELECT rs.student_id, u.name, u.student_id as enrollment,
              AVG(rs.score) as avg_risk, COUNT(*) as session_count,
              COUNT(CASE WHEN rs.score > 0.6 THEN 1 END) as high_risk_sessions
       FROM risk_scores rs
       JOIN users u ON rs.student_id = u.id
       GROUP BY rs.student_id, u.name, u.student_id
       HAVING AVG(rs.score) > 0.5 AND COUNT(*) >= 3
       ORDER BY avg_risk DESC
       LIMIT 20`
    );
    results.chronic_proxies = chronicResult.rows;

    // 2. Attendance Trajectory Prediction
    // Students approaching 75% threshold
    const trajectoryResult = await query(
      `SELECT e.student_id, u.name, u.student_id as enrollment,
              c.name as course_name, c.id as course_id,
              COUNT(DISTINCT s.id) as total_sessions,
              COUNT(DISTINCT ar.session_id) as attended_sessions,
              ROUND(COUNT(DISTINCT ar.session_id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 1) as attendance_pct
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       JOIN sessions s ON s.course_id = c.id AND s.status = 'completed'
       LEFT JOIN attendance_records ar ON ar.session_id = s.id AND ar.student_id = e.student_id AND ar.status = 'verified'
       GROUP BY e.student_id, u.name, u.student_id, c.name, c.id
       HAVING ROUND(COUNT(DISTINCT ar.session_id)::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 1) < $1
              AND COUNT(DISTINCT s.id) >= 5
       ORDER BY attendance_pct ASC`,
      [ATTENDANCE_THRESHOLD_PERCENT + 5] // warn at 80% (within 5% of threshold)
    );
    results.trajectory_warnings = trajectoryResult.rows;

    // 3. Class-Level Anomaly
    // Slots with consistently low attendance
    const classResult = await query(
      `SELECT c.name as course_name, c.code,
              COUNT(s.id) as session_count,
              AVG(s.total_verified::numeric / NULLIF(s.total_enrolled, 0) * 100) as avg_attendance_pct
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       WHERE s.status = 'completed'
       GROUP BY c.name, c.code
       HAVING AVG(s.total_verified::numeric / NULLIF(s.total_enrolled, 0) * 100) < 60
              AND COUNT(s.id) >= 3
       ORDER BY avg_attendance_pct ASC`
    );
    results.class_anomalies = classResult.rows;

  } catch (err) {
    console.warn('Layer 3 analysis error:', err.message);
  }

  return results;
}

/**
 * Clear scan buffer for a session (called when session ends).
 */
export function clearScanBuffer(sessionId) {
  scanBuffer.delete(sessionId);
}
