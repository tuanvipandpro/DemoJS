import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Kiểm tra sức khỏe cơ bản của server
 *     description: Trả về thông tin cơ bản về trạng thái server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server khỏe mạnh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Thời gian hoạt động (giây)
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version
  };

  logger.info('Health check requested', {
    endpoint: '/health',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(200).json(healthCheck);
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Kiểm tra sức khỏe chi tiết của server
 *     description: Trả về thông tin chi tiết về trạng thái server và các services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Thông tin chi tiết về server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 memory:
 *                   type: object
 *                   description: Thông tin sử dụng memory
 *                 platform:
 *                   type: string
 *                 nodeVersion:
 *                   type: string
 *                 env:
 *                   type: object
 *                   description: Các biến môi trường
 *                 services:
 *                   type: object
 *                   description: Trạng thái các services
 */
router.get('/detailed', (req, res) => {
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    env: {
      MCP_PORT: process.env.MCP_PORT,
      MCP_HOST: process.env.MCP_HOST,
      LOG_LEVEL: process.env.LOG_LEVEL,
      ALLOWED_TOOLS: process.env.ALLOWED_TOOLS
    },
    services: {
      logger: 'operational',
      rateLimiter: 'operational',
      auth: 'operational'
    }
  };

  logger.info('Detailed health check requested', {
    endpoint: '/health/detailed',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(200).json(detailedHealth);
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Kiểm tra readiness của server
 *     description: Kiểm tra xem server có sẵn sàng nhận traffic không
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server sẵn sàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Server chưa sẵn sàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/ready', (req, res) => {
  // Kiểm tra các dependencies cần thiết
  const isReady = true; // Trong thực tế sẽ kiểm tra DB, external services
  
  logger.info('Readiness check requested', {
    endpoint: '/health/ready',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    isReady: isReady,
    timestamp: new Date().toISOString()
  });

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      message: 'Service dependencies not available'
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Kiểm tra liveness của server
 *     description: Kiểm tra xem server có còn hoạt động không
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Thời gian hoạt động (giây)
 */
router.get('/live', (req, res) => {
  logger.info('Liveness check requested', {
    endpoint: '/health/live',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as healthRouter };
