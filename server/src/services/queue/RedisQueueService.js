import Redis from 'ioredis';
import { logger } from '../../utils/logger.js';
import { IQueueService } from './IQueueService.js';

/**
 * Redis Queue Service Implementation
 * Sử dụng Redis làm queue system
 */
export class RedisQueueService extends IQueueService {
  constructor(options = {}) {
    super();
    this.redis = null;
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || parseInt(process.env.REDIS_PORT) || 6379,
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || 0,
      keyPrefix: options.keyPrefix || 'queue:',
      ...options
    };
  }

  async connect() {
    try {
      this.redis = new Redis({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        showFriendlyErrorStack: process.env.NODE_ENV === 'development'
      });

      this.redis.on('connect', () => {
        logger.info('Redis queue connected successfully');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis queue connection error:', error);
      });

      this.redis.on('close', () => {
        logger.warn('Redis queue connection closed');
      });

      await this.redis.connect();
      logger.info(`Redis queue connected to ${this.options.host}:${this.options.port}`);
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis queue:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
        logger.info('Redis queue disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Redis queue:', error);
    }
  }

  async enqueue(message) {
    try {
      if (!this.redis || !this.redis.status === 'ready') {
        throw new Error('Redis queue not connected');
      }

      const { type, data, priority = 'normal', delay = 0 } = message;
      
      if (!type || !data) {
        throw new Error('Message type and data are required');
      }

      const messageId = this._generateMessageId();
      const queueKey = this._getQueueKey(priority);
      
      const messageData = {
        id: messageId,
        type,
        data,
        priority,
        delay,
        timestamp: Date.now(),
        attempts: 0
      };

      // Nếu có delay, sử dụng Redis sorted set
      if (delay > 0) {
        const score = Date.now() + (delay * 1000);
        await this.redis.zadd(`${this.options.keyPrefix}delayed`, score, JSON.stringify(messageData));
        logger.debug(`Message ${messageId} queued with delay ${delay}s`);
      } else {
        // Nếu không có delay, push vào queue ngay lập tức
        await this.redis.lpush(queueKey, JSON.stringify(messageData));
        logger.debug(`Message ${messageId} queued immediately`);
      }

      return {
        success: true,
        messageId,
        queueKey,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Failed to enqueue message:', error);
      throw error;
    }
  }

  async isConnected() {
    return this.redis && this.redis.status === 'ready';
  }

  _generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _getQueueKey(priority) {
    const priorityMap = {
      high: 'high',
      normal: 'default',
      low: 'low'
    };
    return `${this.options.keyPrefix}${priorityMap[priority] || 'default'}`;
  }
}
