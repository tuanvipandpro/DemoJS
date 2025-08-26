import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

const maxRequestsPerMinute = parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100;

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: maxRequestsPerMinute,
  message: {
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Maximum ${maxRequestsPerMinute} requests per minute.`,
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = req.ip;
    logger.warn('Rate limit exceeded', {
      ip: clientIp,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${maxRequestsPerMinute} requests per minute.`,
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  keyGenerator: (req) => {
    // Sử dụng IP + User-Agent để tạo key unique hơn
    return `${req.ip}-${req.get('User-Agent')}`;
  }
});
