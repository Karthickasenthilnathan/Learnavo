import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'learnavo-jwt-secret';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Optional auth — tries to verify JWT but falls back to a demo user.
 * Used for routes that should work in demo mode without a real token.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && token !== 'demo-token') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.isDemo = false;
      return next();
    } catch {
      // Fall through to demo user
    }
  }

  // Inject demo user based on query hint or default to professor
  const roleHint = req.query._role || req.headers['x-demo-role'] || 'professor';
  const demoUsers = {
    professor: { id: 1, name: 'Dr. Ananya Sharma', email: 'ananya@university.edu', role: 'professor' },
    hod: { id: 3, name: 'Dr. Priya Menon', email: 'priya@university.edu', role: 'hod' },
    student: { id: 4, name: 'Arjun Patel', email: 'arjun@student.edu', role: 'student' },
  };
  req.user = demoUsers[roleHint] || demoUsers.professor;
  req.isDemo = true;
  next();
}

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * Generate a real JWT for a demo user (used by /api/auth/demo-login).
 */
export function generateDemoToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'learnavo-refresh-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}
