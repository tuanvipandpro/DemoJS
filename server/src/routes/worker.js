import express from 'express';
import { logger } from '../utils/logger.js';
import { pool } from '../db/init.js';
import { ensureAuthenticated, checkProjectAccess } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(ensureAuthenticated);

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:3002';

/**
 * GET /api/worker/status - Kiểm tra trạng thái worker
 */
router.get('/status', async (req, res) => {
  try {
    // Kiểm tra worker health
    let workerStatus = 'unknown';
    let workerDetails = null;
    
    try {
      const workerResponse = await axios.get(`${WORKER_URL}/health`, { timeout: 5000 });
      workerStatus = workerResponse.data.status || 'healthy';
      workerDetails = workerResponse.data;
    } catch (error) {
      workerStatus = 'unhealthy';
      logger.warn('Worker health check failed:', error.message);
    }

    // Kiểm tra database connection
    let dbStatus = 'unknown';
    try {
      await pool.query('SELECT 1');
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
      logger.warn('Database health check failed:', error.message);
    }

    res.json({
      success: true,
      status: {
        overall: workerStatus === 'healthy' && dbStatus === 'healthy' ? 'healthy' : 'degraded',
        worker: {
          status: workerStatus,
          url: WORKER_URL,
          details: workerDetails
        },
        database: {
          status: dbStatus
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error checking worker status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/worker/queue/stats - Lấy thống kê queue
 */
router.get('/queue/stats', async (req, res) => {
  try {
    // Lấy thống kê từ worker queue
    let queueStats = null;
    
    try {
      const response = await axios.get(`${WORKER_URL}/queue/stats`, { timeout: 5000 });
      queueStats = response.data;
    } catch (error) {
      logger.warn('Failed to get queue stats from worker:', error.message);
    }

    // Lấy thống kê từ database
    const dbStats = await pool.query(`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_runs,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_runs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs
      FROM agent_runs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);

    res.json({
      success: true,
      queue: queueStats,
      database: {
        last24h: dbStats.rows[0]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/worker/queue/purge - Xóa tất cả messages trong queue
 */
router.post('/queue/purge', async (req, res) => {
  try {
    // Purge queue từ worker
    let purgeResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/purge`, {}, { timeout: 10000 });
      purgeResult = response.data;
    } catch (error) {
      logger.warn('Failed to purge queue from worker:', error.message);
    }

    res.json({
      success: true,
      message: 'Queue purged successfully',
      result: purgeResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error purging queue:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/worker/configuration - Lấy cấu hình worker
 */
router.get('/configuration', async (req, res) => {
  try {
    // Lấy cấu hình từ worker
    let workerConfig = null;
    
    try {
      const response = await axios.get(`${WORKER_URL}/configuration`, { timeout: 5000 });
      workerConfig = response.data;
    } catch (error) {
      logger.warn('Failed to get worker configuration:', error.message);
    }

    res.json({
      success: true,
      configuration: workerConfig,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WORKER_URL: WORKER_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting worker configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/worker/restart - Khởi động lại worker (nếu supported)
 */
router.post('/restart', async (req, res) => {
  try {
    // Gửi restart signal đến worker
    let restartResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/restart`, {}, { timeout: 10000 });
      restartResult = response.data;
    } catch (error) {
      logger.warn('Failed to restart worker:', error.message);
    }

    res.json({
      success: true,
      message: 'Restart signal sent to worker',
      result: restartResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error restarting worker:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
