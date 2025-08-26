import { Router } from 'express';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { pool } from '../db/init.js';
import { extractBearerToken, signAccessToken, verifyToken } from '../utils/jwt.js';
import { issueTokensForUser } from '../auth/tokenService.js';
import { verifyLocalUser, registerLocalUser } from '../auth/providers/localProvider.js';

const router = Router();

router.get('/me', async (req, res) => {
  // JWT-based authentication only
  try {
    const token = extractBearerToken(req);
    if (token) {
      const payload = verifyToken(token);
      // fetch user profile from DB for more details
      const result = await pool.query(
        `SELECT id, username, email, display_name FROM users WHERE id = $1`,
        [payload.sub]
      );
      if (result.rowCount > 0) {
        const row = result.rows[0];
        return res.json({
          user: {
            id: row.id,
            username: row.username,
            email: row.email,
            displayName: row.display_name,
            provider: 'jwt',
          },
        });
      }
      return res.json({ user: { id: payload.sub, username: payload.username, provider: 'jwt' } });
    }
  } catch (_e) {}
  return res.status(401).json({ user: null });
});

// Profile endpoints
router.get('/profile', async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(token);
    const result = await pool.query(
      `SELECT id, username, email, display_name, phone, address FROM users WHERE id = $1`,
      [payload.sub]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ profile: result.rows[0] });
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(token);

    const { displayName, email, phone, address } = req.body || {};
    const result = await pool.query(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address)
       WHERE id = $1
       RETURNING id, username, email, display_name, phone, address`,
      [payload.sub, displayName ?? null, email ?? null, phone ?? null, address ?? null]
    );
    res.json({ profile: result.rows[0] });
  } catch (e) {
    if (String(e?.message || '').includes('users_email_unique_idx')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/logout', (req, res) => {
  // JWT tokens are stateless, so logout is handled client-side
  // Client should remove tokens from storage
  res.json({ ok: true, message: 'Logout successful. Please remove tokens from client storage.' });
});

// Password-based auth
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, email } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username, password required' });
    const user = await registerLocalUser({ username, password, displayName, email });
    if (!user) return res.status(409).json({ error: 'username already exists' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Register failed', detail: String(e?.message || e) });
  }
});

// Unified login endpoint for multiple providers
router.post('/login', async (req, res) => {
  try {
    const { provider, username, password } = req.body || {};

    // Ưu tiên login local khi đủ username/password
    if (username && password) {
      const user = await verifyLocalUser({ username, password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const tokens = await issueTokensForUser(user);
      return res.json(tokens);
    }

    // Nếu không có đủ username/password -> dùng provider
    switch (provider) {
      case 'local':
      case undefined:
        return res.status(400).json({ error: 'username, password required for local login' });
      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }
  } catch (e) {
    res.status(500).json({ error: 'Login failed', detail: String(e?.message || e) });
  }
});

router.post('/token/refresh', async (req, res) => {
  try {
    const { refresh_token: refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refresh_token required' });

    // Check store
    const stored = await pool.query(
      `SELECT user_id, revoked, expires_at FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    );
    if (stored.rowCount === 0) return res.status(401).json({ error: 'Invalid refresh token' });
    const row = stored.rows[0];
    if (row.revoked) return res.status(401).json({ error: 'Refresh token revoked' });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(401).json({ error: 'Refresh token expired' });

    const payload = verifyToken(refreshToken);
    const accessToken = signAccessToken({ sub: payload.sub, username: payload.username });
    res.json({ access_token: accessToken, token_type: 'Bearer' });
  } catch (e) {
    res.status(401).json({ error: 'Invalid refresh token', detail: String(e?.message || e) });
  }
});

export default router;


