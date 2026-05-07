/**
 * Auth Routes — Login, Register, Profile
 */
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import { authenticateToken, generateAccessToken, generateRefreshToken, generateDemoToken } from '../middleware/auth.js';
import { getDemoUser } from '../utils/demoData.js';

const router = Router();

// POST /api/auth/demo-login — generates a real JWT for demo users (no DB needed)
router.post('/demo-login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = getDemoUser(email);
  const accessToken = generateDemoToken(user);

  console.log(`[Auth] Demo login: ${user.name} (${user.role})`);

  res.json({
    user,
    accessToken,
    refreshToken: accessToken, // same token for demo
    demo: true,
  });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', department, student_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, department, student_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, department, student_id`,
      [name, email, passwordHash, role, department || null, student_id || null]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      `SELECT id, name, email, password_hash, role, department, student_id, avatar_url
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const accessToken = generateAccessToken(userWithoutPassword);
    const refreshToken = generateRefreshToken(userWithoutPassword);

    res.json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, department, student_id, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
