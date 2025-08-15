import bcrypt from 'bcryptjs';
import { pool } from '../../db/init.js';

export async function registerLocalUser({ username, password, displayName, email }) {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, display_name, email)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO NOTHING
     RETURNING id, username, display_name, email`,
    [username, hash, displayName || null, email || null]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0];
}

export async function verifyLocalUser({ username, password }) {
  const result = await pool.query(
    `SELECT id, username, password_hash FROM users WHERE username = $1 OR email = $1`,
    [username]
  );
  if (result.rowCount === 0) return null;
  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, username: user.username };
}


