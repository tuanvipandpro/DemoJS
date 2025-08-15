import { pool } from '../db/init.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js';

export async function issueTokensForUser(user) {
  const accessToken = signAccessToken({ sub: user.id, username: user.username });
  const refreshToken = signRefreshToken({ sub: user.id, username: user.username });

  const { exp } = verifyToken(refreshToken);
  const expiresAt = new Date(exp * 1000).toISOString();
  await pool.query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [refreshToken, user.id, expiresAt]
  );

  return { access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer' };
}


