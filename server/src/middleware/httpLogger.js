import { logger } from '../utils/logger.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'newPassword',
  'confirmPassword',
  'token',
  'access_token',
  'refresh_token',
  'client_secret',
  'secret',
  'authorization',
  'cookie',
]);

function generateRequestId() {
  // lightweight request id
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function truncate(value, max = 1000) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}…(${str.length - max} more)` : str;
}

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
      out[key] = '***';
    } else if (value && typeof value === 'object') {
      out[key] = redact(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function httpLogger(req, res, next) {
  const startHr = process.hrtime.bigint();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const logRequestBody = process.env.HTTP_LOG_REQUEST_BODY === '1';
  const logResponseBody = process.env.HTTP_LOG_RESPONSE_BODY === '1';

  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection?.remoteAddress || '';
  const userId = req.user?.id || null;

  const reqMeta = {
    id: requestId,
    method,
    url,
    ip,
    userId,
  };

  if (logRequestBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    try {
      const safeBody = redact(req.body);
      logger.debug('HTTP Request', reqMeta, 'query=', req.query || {}, 'body=', truncate(safeBody));
    } catch {
      logger.debug('HTTP Request', reqMeta, 'query=', req.query || {});
    }
  } else {
    logger.debug('HTTP Request', reqMeta, 'query=', req.query || {});
  }

  let responseBodySnapshot = undefined;
  const originalSend = res.send;
  if (logResponseBody) {
    res.send = function patchedSend(body) {
      responseBodySnapshot = body;
      return originalSend.call(this, body);
    };
  }

  res.on('finish', () => {
    const endHr = process.hrtime.bigint();
    const durationMs = Number(endHr - startHr) / 1_000_000;
    const status = res.statusCode;
    const length = res.getHeader('content-length');

    const resMeta = {
      id: requestId,
      method,
      url,
      status,
      durationMs: Math.round(durationMs),
      length: length ? Number(length) : undefined,
      userId,
    };

    if (logResponseBody && responseBodySnapshot !== undefined) {
      try {
        const printable = typeof responseBodySnapshot === 'string'
          ? responseBodySnapshot
          : JSON.stringify(redact(responseBodySnapshot));
        logger.info('HTTP Response', resMeta, truncate(printable));
        return;
      } catch {
        // fall through
      }
    }
    logger.info('HTTP Response', resMeta);
  });

  next();
}


