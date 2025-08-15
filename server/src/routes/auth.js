import { Router } from 'express';
import passport from 'passport';
import { logger } from '../utils/logger.js';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { pool } from '../db/init.js';
import { extractBearerToken, signAccessToken, verifyToken } from '../utils/jwt.js';
import { issueTokensForUser } from '../auth/tokenService.js';
import { verifyLocalUser, registerLocalUser } from '../auth/providers/localProvider.js';

const router = Router();

router.get('/me', async (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  // Try JWT bearer
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

// If using frontend OAuth, the frontend will DIRECT users to GitHub authorize page and receive ?code on frontend
// Then frontend posts code to backend for exchange

// Exchange GitHub code from frontend for access_token
router.post('/github/oauth/exchange', async (req, res) => {
  try {
    const { code, redirectUri } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code required' });
    const clientId = process.env.GITHUB_CLIENT_ID || '';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      logger.error('GitHub exchange missing credentials: check GITHUB_CLIENT_ID/SECRET');
      return res.status(500).json({ error: 'server_misconfigured', detail: 'Missing GitHub client credentials' });
    }
    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);
    params.set('code', code);
    if (redirectUri) params.set('redirect_uri', redirectUri);

    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await resp.json();
    if (!resp.ok || !data.access_token) {
      logger.error('GitHub code exchange failed:', data);
      return res.status(400).json({ error: 'exchange_failed', detail: data });
    }
    // persist token with current user
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await pool.query(
      `INSERT INTO user_provider_tokens (user_id, provider, access_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, provider) DO UPDATE SET access_token = EXCLUDED.access_token, updated_at = now()`,
      [userId, 'github', data.access_token]
    );
    return res.json({ ok: true });
  } catch (e) {
    logger.error('GitHub exchange error', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// GitHub OAuth callback endpoint for frontend (no authentication required)
router.post('/github/oauth/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code required' });
    
    const clientId = process.env.GITHUB_CLIENT_ID || '';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      logger.error('GitHub callback missing credentials: check GITHUB_CLIENT_ID/SECRET');
      return res.status(500).json({ error: 'server_misconfigured', detail: 'Missing GitHub client credentials' });
    }

    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);
    params.set('code', code);
    if (redirectUri) params.set('redirect_uri', redirectUri);

    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    
    const data = await resp.json();
    if (!resp.ok || !data.access_token) {
      logger.error('GitHub code exchange failed:', data);
      return res.status(400).json({ error: 'exchange_failed', detail: data });
    }

    // Return access_token to frontend for storage
    return res.json({ 
      access_token: data.access_token,
      token_type: data.token_type || 'bearer',
      scope: data.scope
    });
  } catch (e) {
    logger.error('GitHub callback error', e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
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
      case 'github':
        return res.status(400).json({ error: 'Use /api/auth/github to initiate GitHub OAuth' });
      case 'google':
        return res.status(400).json({ error: 'Google auth not implemented yet' });
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

// GitHub OAuth popup endpoint
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub client ID not configured' });
  }

  // Generate OAuth state for security
  const state = Math.random().toString(36).substring(7);
  
  // Store state in session for validation
  req.session.oauthState = state;
  
  // Redirect to GitHub OAuth
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=repo`;
  
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback for popup
router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Validate state
    if (!state || state !== req.session.oauthState) {
      return res.status(400).json({ error: 'Invalid OAuth state' });
    }
    
    // Clear OAuth state
    delete req.session.oauthState;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;

    if (!clientId || !clientSecret) {
      logger.error('GitHub callback missing credentials');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    // Exchange code for access token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok || !tokenData.access_token) {
      logger.error('GitHub token exchange failed:', tokenData);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    // Fetch user info and repos using the access token
    const userResp = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResp.json();
    if (!userResp.ok) {
      logger.error('Failed to fetch GitHub user:', userData);
      return res.status(400).json({ error: 'Failed to fetch user data' });
    }

    // Fetch repositories
    const reposResp = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const reposData = await reposResp.json();
    if (!reposResp.ok) {
      logger.error('Failed to fetch GitHub repos:', reposData);
      return res.status(400).json({ error: 'Failed to fetch repositories' });
    }

    // Return HTML page that sends message to parent window and closes
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GitHub OAuth Success</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="success">
          <h2>✅ GitHub Connected Successfully!</h2>
          <p>You can close this window now.</p>
        </div>
        <script>
          try {
            // Send success message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'GITHUB_OAUTH_SUCCESS',
                repos: ${JSON.stringify(reposData)},
                user: ${JSON.stringify(userData)},
                access_token: '${tokenData.access_token}'
              }, '${req.protocol}://${req.get('host').split(':')[0]}:${req.protocol === 'https' ? '443' : '3001'}');
            }
            
            // Close popup after a short delay
            setTimeout(() => {
              window.close();
            }, 1000);
          } catch (error) {
            console.error('Error sending message to parent:', error);
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
    
  } catch (error) {
    logger.error('GitHub OAuth callback error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GitHub OAuth Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ GitHub Connection Failed</h2>
          <p>Error: ${error.message}</p>
          <p>You can close this window and try again.</p>
        </div>
        <script>
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;
    
    res.send(errorHtml);
  }
});

export default router;


