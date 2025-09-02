import { Router } from 'express';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { pool } from '../db/init.js';
import { extractBearerToken, signAccessToken, verifyToken } from '../utils/jwt.js';
import { issueTokensForUser } from '../auth/tokenService.js';
import { verifyLocalUser, registerLocalUser } from '../auth/providers/localProvider.js';

const router = Router();

// API /auth/me đã được loại bỏ, sử dụng /auth/profile thay thế

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the current user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the current user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City, Country"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Update failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the current user (client-side token removal)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful. Please remove tokens from client storage."
 */
router.post('/logout', (req, res) => {
  // JWT tokens are stateless, so logout is handled client-side
  // Client should remove tokens from storage
  res.json({ ok: true, message: 'Logout successful. Please remove tokens from client storage.' });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *               provider:
 *                 type: string
 *                 example: "local"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refresh_token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 token_type:
 *                   type: string
 *                   example: "Bearer"
 *       400:
 *         description: Bad request - missing credentials or unsupported provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Login failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/token/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 token_type:
 *                   type: string
 *                   example: "Bearer"
 *       400:
 *         description: Bad request - refresh token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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


