import session from 'express-session';
import pgSimple from 'connect-pg-simple';
import { extractBearerToken, verifyToken } from '../utils/jwt.js';

const hourMs = 1000 * 60 * 60;

// Tạo PostgreSQL session store
const PostgresStore = pgSimple(session);

export const sessionConfig = {
  store: new PostgresStore({
    conObject: {
      user: process.env.DB_USER || 'insight',
      password: process.env.DB_PASS || 'insight',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'insighttestai',
    },
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: process.env.COOKIE_SECURE === '1',
    maxAge: Number(process.env.SESSION_MAXAGE_MS || 24 * hourMs),
  },
};

export function ensureAuthenticated(req, res, next) {
  // Session-based
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  // JWT-based (Bearer token)
  try {
    const token = extractBearerToken(req);
    if (token) {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, username: payload.username, provider: 'jwt' };
      return next();
    }
  } catch (_e) {
    // ignore and fallthrough
  }
  return res.status(401).json({ error: 'Unauthorized' });
}


