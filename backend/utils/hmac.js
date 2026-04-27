// HMAC-SHA256 utility for QR token signing
import crypto from 'crypto';

export function generateHMAC(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function verifyHMAC(payload, signature, secret) {
  const expected = generateHMAC(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

export function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

export function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}
