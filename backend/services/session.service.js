/**
 * Session Service — Manages session lifecycle and live state.
 */
import { query } from '../config/db.js';
import { generateSecret } from '../utils/hmac.js';
import { startQRRotation, clearSessionQR } from './qr.service.js';
import { runLayer2Analysis, clearScanBuffer } from './anomaly.service.js';

// In-memory store for active sessions
const activeSessions = new Map(); // sessionId -> { cleanup, io, ... }

/**
 * Start a new attendance session.
 */
export async function startSession(courseId, classroomId, professorId, io) {
  const qrSecret = generateSecret();

  let session;
  try {
    // Get enrollment count
    const enrollment = await query(
      `SELECT COUNT(*) as cnt FROM enrollments WHERE course_id = $1`,
      [courseId]
    );
    const totalEnrolled = parseInt(enrollment.rows[0].cnt) || 0;

    const result = await query(
      `INSERT INTO sessions (course_id, classroom_id, professor_id, qr_secret, status, total_enrolled)
       VALUES ($1, $2, $3, $4, 'active', $5) RETURNING *`,
      [courseId, classroomId, professorId, qrSecret, totalEnrolled]
    );
    session = result.rows[0];
  } catch (err) {
    // Fallback for demo mode without DB
    session = {
      id: Date.now(),
      course_id: courseId,
      classroom_id: classroomId,
      professor_id: professorId,
      qr_secret: qrSecret,
      status: 'active',
      total_enrolled: 0,
      started_at: new Date().toISOString(),
    };
  }

  // Start QR rotation with WebSocket broadcasting
  const stopRotation = startQRRotation(session.id, qrSecret, (tokenData) => {
    if (io) {
      io.to(`session:${session.id}`).emit('session:qr_update', {
        qrDataURL: tokenData.qrDataURL,
        expiresAt: tokenData.expiresAt,
        sessionId: session.id,
      });
    }
  });

  activeSessions.set(session.id, {
    ...session,
    stopRotation,
    io,
    startedAt: Date.now(),
  });

  return session;
}

/**
 * End an active session and trigger Layer 2 analysis.
 */
export async function endSession(sessionId) {
  const activeSession = activeSessions.get(sessionId);

  if (activeSession?.stopRotation) {
    activeSession.stopRotation();
  }

  try {
    await query(
      `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = $1`,
      [sessionId]
    );

    // Run Layer 2 post-session analysis
    const riskScores = await runLayer2Analysis(sessionId);

    // Notify via WebSocket
    if (activeSession?.io) {
      activeSession.io.to(`session:${sessionId}`).emit('session:ended', {
        sessionId,
        riskScores,
      });
    }
  } catch (err) {
    console.warn('End session DB update skipped:', err.message);
  }

  clearSessionQR(sessionId);
  clearScanBuffer(sessionId);
  activeSessions.delete(sessionId);
}

/**
 * Get active session data.
 */
export function getActiveSession(sessionId) {
  return activeSessions.get(sessionId) || null;
}

/**
 * Get all active sessions.
 */
export function getAllActiveSessions() {
  return Array.from(activeSessions.values()).map((s) => ({
    id: s.id,
    course_id: s.course_id,
    classroom_id: s.classroom_id,
    professor_id: s.professor_id,
    status: s.status,
    total_enrolled: s.total_enrolled,
    started_at: s.started_at,
  }));
}
