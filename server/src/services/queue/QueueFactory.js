import { RedisQueueService } from './RedisQueueService.js';
import { SQSQueueService } from './SQSQueueService.js';
import { logger } from '../../utils/logger.js';

/**
 * Queue Factory để chọn implementation phù hợp
 * Đảm bảo tính DI để có thể chuyển đổi giữa Redis và SQS
 */
export class QueueFactory {
  /**
   * Tạo Queue Service instance dựa trên configuration
   * @param {Object} options - Configuration options
   * @returns {IQueueService} Queue Service instance
   */
  static createQueueService(options = {}) {
    const queueType = options.type || process.env.QUEUE_TYPE || 'redis';
    
    logger.info(`Creating queue service with type: ${queueType}`);
    
    switch (queueType.toLowerCase()) {
      case 'redis':
        return new RedisQueueService(options);
      
      case 'sqs':
        return new SQSQueueService(options);
      
      default:
        logger.warn(`Unknown queue type: ${queueType}, falling back to Redis`);
        return new RedisQueueService(options);
    }
  }

  /**
   * Tạo Queue Service với configuration mặc định
   * @returns {IQueueService} Queue Service instance
   */
  static createDefaultQueueService() {
    return this.createQueueService();
  }
}
