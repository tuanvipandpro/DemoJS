import { logger } from '../utils/logger.js';

export const authMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || 'unknown';
  const authToken = req.headers['authorization'] || req.headers['x-api-key'];
  
  // Kiểm tra xem có token không
  if (!authToken) {
    logger.warn('Missing authentication token', {
      traceId,
      ip: req.ip,
      url: req.originalUrl
    });
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authentication token',
      traceId,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Trong thực tế, token sẽ được truyền từ orchestrator worker
    // Ở đây chúng ta chỉ validate format cơ bản
    const token = authToken.replace(/^Bearer\s+/i, '');
    
    if (!token || token.length < 10) {
      throw new Error('Invalid token format');
    }

    // Thêm thông tin vào request để sử dụng sau này
    req.auth = {
      token: token,
      traceId: traceId,
      timestamp: new Date().toISOString()
    };

    logger.info('Authentication successful', {
      traceId,
      ip: req.ip,
      url: req.originalUrl
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      traceId,
      error: error.message,
      ip: req.ip,
      url: req.originalUrl
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
      traceId,
      timestamp: new Date().toISOString()
    });
  }
};
