import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const traceId = req.headers['x-trace-id'] || 'unknown';
  
  logger.error('Error occurred', {
    traceId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Nếu là validation error
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.details.map(detail => detail.message).join(', '),
      traceId,
      timestamp: new Date().toISOString()
    });
  }

  // Nếu là timeout error
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return res.status(408).json({
      error: 'Request Timeout',
      message: 'Request timed out',
      traceId,
      timestamp: new Date().toISOString()
    });
  }

  // Nếu là rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      traceId,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : message,
    traceId,
    timestamp: new Date().toISOString()
  });
};
