/**
 * QR Service — HMAC-SHA256 Dynamic QR Code Generation
 * Rotates every 30 seconds with one-time-use tokens.
 */
import QRCode from 'qrcode';
import { generateHMAC, verifyHMAC, generateNonce } from '../utils/hmac.js';
import { query } from '../config/db.js';
import { QR_ROTATION_SECONDS } from '../utils/constants.js';

// In-memory store for active session QR states
const activeQRs = new Map();

/**
 * Generate a new QR token for a session.
 * Returns QR data URL and token metadata.
 */
export async function generateQRToken(sessionId, qrSecret) {
  const nonce = generateNonce();
  const timestamp = Date.now();
  const payload = { sessionId, timestamp, nonce };
  const signature = generateHMAC(payload, qrSecret);
  const tokenHash = generateHMAC({ signature, nonce }, qrSecret);

  // Store token in DB for reuse detection
  try {
    await query(
      `INSERT INTO qr_tokens (session_id, token_hash, nonce, generated_at)
       VALUES ($1, $2, $3, NOW())`,
      [sessionId, tokenHash, nonce]
    );
  } catch (err) {
    // DB might not be available in demo mode — continue
    console.warn('QR token DB insert skipped:', err.message);
  }

  // Build QR content
  const qrContent = JSON.stringify({
    s: sessionId,
    t: timestamp,
    n: nonce,
    h: signature,
  });

  // Generate QR image as data URL
  const qrDataURL = await QRCode.toDataURL(qrContent, {
    width: 400,
    margin: 2,
    color: { dark: '#0A0E27', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });

  const tokenData = {
    sessionId,
    tokenHash,
    nonce,
    signature,
    timestamp,
    qrDataURL,
    expiresAt: timestamp + QR_ROTATION_SECONDS * 1000,
  };

  // Update in-memory state
  activeQRs.set(sessionId, tokenData);

  return tokenData;
}

/**
 * Validate a submitted QR token.
 * Returns { valid, reason }
 */
export async function validateQRToken(sessionId, scannedData, qrSecret) {
  try {
    const parsed = typeof scannedData === 'string' ? JSON.parse(scannedData) : scannedData;
    const { s, t, n, h } = parsed;

    // Check session ID matches
    if (s !== sessionId) {
      return { valid: false, reason: 'Session mismatch' };
    }

    // Verify HMAC signature
    const payload = { sessionId: s, timestamp: t, nonce: n };
    try {
      const isValid = verifyHMAC(payload, h, qrSecret);
      if (!isValid) {
        return { valid: false, reason: 'Invalid signature' };
      }
    } catch {
      return { valid: false, reason: 'Signature verification failed' };
    }

    // Check expiration (30s window + 5s grace)
    const age = Date.now() - t;
    if (age > (QR_ROTATION_SECONDS + 5) * 1000) {
      return { valid: false, reason: 'Token expired' };
    }

    // Check for reuse
    const tokenHash = generateHMAC({ signature: h, nonce: n }, qrSecret);
    try {
      const result = await query(
        `SELECT used_at FROM qr_tokens WHERE token_hash = $1`,
        [tokenHash]
      );
      if (result.rows.length > 0 && result.rows[0].used_at) {
        return { valid: false, reason: 'Token already used', flagType: 'token_reuse' };
      }
      // Mark as used
      await query(
        `UPDATE qr_tokens SET used_at = NOW(), used_by = $2 WHERE token_hash = $1`,
        [tokenHash, null] // user ID will be set by caller
      );
    } catch {
      // DB unavailable — skip reuse check in demo
    }

    return { valid: true, tokenHash };
  } catch (err) {
    return { valid: false, reason: 'Malformed QR data' };
  }
}

/**
 * Get the current active QR for a session.
 */
export function getActiveQR(sessionId) {
  return activeQRs.get(sessionId) || null;
}

/**
 * Clear QR state when session ends.
 */
export function clearSessionQR(sessionId) {
  activeQRs.delete(sessionId);
}

/**
 * Start QR rotation interval for a session.
 * Returns cleanup function.
 */
export function startQRRotation(sessionId, qrSecret, onNewQR) {
  // Generate immediately
  generateQRToken(sessionId, qrSecret).then(onNewQR);

  const interval = setInterval(async () => {
    const tokenData = await generateQRToken(sessionId, qrSecret);
    onNewQR(tokenData);
  }, QR_ROTATION_SECONDS * 1000);

  return () => {
    clearInterval(interval);
    clearSessionQR(sessionId);
  };
}
