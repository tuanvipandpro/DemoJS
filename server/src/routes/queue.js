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
 * GET /api/queue/status - Lấy trạng thái queue
 */
router.get('/status', async (req, res) => {
  try {
    let queueStatus = 'unknown';
    let queueDetails = null;
    
    try {
      const response = await axios.get(`${WORKER_URL}/queue/status`, { timeout: 5000 });
      queueStatus = response.data.status || 'healthy';
      queueDetails = response.data;
    } catch (error) {
      queueStatus = 'unhealthy';
      logger.warn('Queue status check failed:', error.message);
    }

    res.json({
      success: true,
      status: queueStatus,
      details: queueDetails,
      workerUrl: WORKER_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error checking queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/queue/messages - Lấy danh sách messages trong queue
 */
router.get('/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = 'all' } = req.query;
    
    let messages = [];
    
    try {
      const response = await axios.get(`${WORKER_URL}/queue/messages`, {
        params: { limit, offset, status },
        timeout: 10000
      });
      messages = response.data.messages || [];
    } catch (error) {
      logger.warn('Failed to get messages from worker queue:', error.message);
    }

    res.json({
      success: true,
      messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting queue messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/queue/enqueue - Thêm message vào queue
 */
router.post('/enqueue', async (req, res) => {
  try {
    const { type, data, priority = 'normal', delay = 0 } = req.body;
    
    // Validation
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Message type and data are required'
      });
    }
    
    // Kiểm tra quyền truy cập project nếu có projectId
    if (data.projectId) {
      const hasAccess = await checkProjectAccess(req.user.id, data.projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to project'
        });
      }
    }
    
    // Enqueue message vào worker queue
    let enqueueResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/enqueue`, {
        type,
        data: {
          ...data,
          userId: req.user.id,
          timestamp: new Date().toISOString()
        },
        priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
        delay: parseInt(delay) || 0
      }, { timeout: 10000 });
      
      enqueueResult = response.data;
    } catch (error) {
      logger.warn('Failed to enqueue message to worker:', error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to enqueue message: ${error.message}`
      });
    }
    
    // Log message enqueue
    await pool.query(`
      INSERT INTO queue_messages (
        message_id, type, data, priority, delay, user_id, project_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      enqueueResult.messageId || null,
      type,
      JSON.stringify(data),
      priority,
      delay,
      req.user.id,
      data.projectId || null,
      'queued'
    ]);

    res.json({
      success: true,
      message: 'Message enqueued successfully',
      result: enqueueResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error enqueueing message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/queue/dequeue - Lấy message từ queue
 */
router.post('/dequeue', async (req, res) => {
  try {
    const { timeout = 30 } = req.body;
    
    let message = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/dequeue`, {
        timeout: parseInt(timeout)
      }, { timeout: (parseInt(timeout) + 5) * 1000 });
      
      message = response.data.message;
    } catch (error) {
      logger.warn('Failed to dequeue message from worker:', error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to dequeue message: ${error.message}`
      });
    }
    
    if (!message) {
      return res.json({
        success: true,
        message: null,
        message: 'No messages available'
      });
    }
    
    res.json({
      success: true,
      message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error dequeuing message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/queue/:messageId/ack - Acknowledge message
 */
router.post('/:messageId/ack', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    let ackResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/${messageId}/ack`, {}, { timeout: 10000 });
      ackResult = response.data;
    } catch (error) {
      logger.warn(`Failed to ack message ${messageId}:`, error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to acknowledge message: ${error.message}`
      });
    }
    
    // Cập nhật trạng thái message trong database
    await pool.query(`
      UPDATE queue_messages 
      SET status = 'acknowledged', updated_at = NOW()
      WHERE message_id = $1
    `, [messageId]);
    
    res.json({
      success: true,
      message: 'Message acknowledged successfully',
      result: ackResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error acknowledging message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/queue/:messageId/nack - Negative acknowledge message
 */
router.post('/:messageId/nack', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason, requeue = false } = req.body;
    
    let nackResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/${messageId}/nack`, {
        reason,
        requeue
      }, { timeout: 10000 });
      
      nackResult = response.data;
    } catch (error) {
      logger.warn(`Failed to nack message ${messageId}:`, error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to negative acknowledge message: ${error.message}`
      });
    }
    
    // Cập nhật trạng thái message trong database
    await pool.query(`
      UPDATE queue_messages 
      SET status = 'nack', error_reason = $1, updated_at = NOW()
      WHERE message_id = $1
    `, [reason || 'Negative acknowledged']);
    
    res.json({
      success: true,
      message: 'Message negative acknowledged successfully',
      result: nackResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error negative acknowledging message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/queue/:messageId - Xóa message khỏi queue
 */
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    let deleteResult = null;
    
    try {
      const response = await axios.delete(`${WORKER_URL}/queue/${messageId}`, { timeout: 10000 });
      deleteResult = response.data;
    } catch (error) {
      logger.warn(`Failed to delete message ${messageId}:`, error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to delete message: ${error.message}`
      });
    }
    
    // Cập nhật trạng thái message trong database
    await pool.query(`
      UPDATE queue_messages 
      SET status = 'deleted', updated_at = NOW()
      WHERE message_id = $1
    `, [messageId]);
    
    res.json({
      success: true,
      message: 'Message deleted successfully',
      result: deleteResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/queue/history - Lấy lịch sử queue messages
 */
router.get('/history', async (req, res) => {
  try {
    const { 
      projectId, 
      status, 
      type, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate
    } = req.query;
    
    let query = `
      SELECT 
        qm.id, qm.message_id, qm.type, qm.data, qm.priority, qm.delay,
        qm.user_id, qm.project_id, qm.status, qm.error_reason,
        qm.created_at, qm.updated_at,
        p.name as project_name,
        u.email as user_email
      FROM queue_messages qm
      LEFT JOIN projects p ON qm.project_id = p.id
      LEFT JOIN users u ON qm.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (projectId) {
      query += ` AND qm.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
      
      // Kiểm tra quyền truy cập project
      const hasAccess = await checkProjectAccess(req.user.id, projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to project'
        });
      }
    }
    
    if (status) {
      query += ` AND qm.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (type) {
      query += ` AND qm.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (startDate) {
      query += ` AND qm.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND qm.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    query += ` ORDER BY qm.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      messages: result.rows.map(row => ({
        id: row.id,
        messageId: row.message_id,
        type: row.type,
        data: row.data,
        priority: row.priority,
        delay: row.delay,
        userId: row.user_id,
        userEmail: row.user_email,
        projectId: row.project_id,
        projectName: row.project_name,
        status: row.status,
        errorReason: row.error_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching queue history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/queue/clear - Xóa tất cả messages trong queue
 */
router.post('/clear', async (req, res) => {
  try {
    const { status, type, projectId } = req.body;
    
    // Kiểm tra quyền truy cập project nếu có
    if (projectId) {
      const hasAccess = await checkProjectAccess(req.user.id, projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to project'
        });
      }
    }
    
    let clearResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/clear`, {
        status,
        type,
        projectId
      }, { timeout: 15000 });
      
      clearResult = response.data;
    } catch (error) {
      logger.warn('Failed to clear queue from worker:', error.message);
      return res.status(500).json({
        success: false,
        error: `Failed to clear queue: ${error.message}`
      });
    }
    
    // Cập nhật trạng thái messages trong database
    let updateQuery = `UPDATE queue_messages SET status = 'cleared', updated_at = NOW() WHERE 1=1`;
    const updateParams = [];
    let paramIndex = 1;
    
    if (status) {
      updateQuery += ` AND status = $${paramIndex}`;
      updateParams.push(status);
      paramIndex++;
    }
    
    if (type) {
      updateQuery += ` AND type = $${paramIndex}`;
      updateParams.push(type);
      paramIndex++;
    }
    
    if (projectId) {
      updateQuery += ` AND project_id = $${paramIndex}`;
      updateParams.push(projectId);
      paramIndex++;
    }
    
    await pool.query(updateQuery, updateParams);
    
    res.json({
      success: true,
      message: 'Queue cleared successfully',
      result: clearResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing queue:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
