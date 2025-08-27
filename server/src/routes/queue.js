import express from 'express';
import { logger } from '../utils/logger.js';
import { ensureAuthenticated, checkProjectAccessById } from '../middleware/auth.js';
import { QueueFactory } from '../services/queue/QueueFactory.js';

const router = express.Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(ensureAuthenticated);

// Get queue service instance
const queueService = QueueFactory.createDefaultQueueService();

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
      const hasAccess = await checkProjectAccessById(req.user.id, data.projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to project'
        });
      }
    }
    
    // Enqueue message vào queue service
    const enqueueResult = await queueService.enqueue({
      type,
      data: {
        ...data,
        userId: req.user.id,
        timestamp: new Date().toISOString()
      },
      priority,
      delay: parseInt(delay) || 0
    });

    logger.info(`Message enqueued successfully: ${enqueueResult.messageId}`);

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

export default router;
