/**
 * QR Routes — Generate & fetch current QR for a session
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { getActiveQR, generateQRToken } from '../services/qr.service.js';
import { getActiveSession } from '../services/session.service.js';

const router = Router();

// GET /api/qr/:sessionId — Get current QR code for a session
router.get('/:sessionId', authenticateToken, roleGuard('professor', 'hod'), (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const qr = getActiveQR(sessionId);

  if (!qr) {
    return res.status(404).json({ error: 'No active QR for this session' });
  }

  res.json({
    qrDataURL: qr.qrDataURL,
    expiresAt: qr.expiresAt,
    sessionId: qr.sessionId,
    remainingMs: qr.expiresAt - Date.now(),
  });
});

// POST /api/qr/:sessionId/regenerate — Force regenerate QR
router.post('/:sessionId/regenerate', authenticateToken, roleGuard('professor'), async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const session = getActiveSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not active' });
  }

  const tokenData = await generateQRToken(sessionId, session.qr_secret);
  res.json({
    qrDataURL: tokenData.qrDataURL,
    expiresAt: tokenData.expiresAt,
    sessionId: tokenData.sessionId,
  });
});

export default router;
