import { LocalQueue } from './localQueue.js';
import { SQSQueue } from './sqsQueue.js';
import { RedisQueue } from './redisQueue.js';
import config from '../config/env.js';

/**
 * Queue factory for creating queue instances based on configuration
 */
export class QueueFactory {
  /**
   * Create a queue instance based on configuration
   * @param {Object} options - Queue options
   * @returns {BaseQueue} Queue instance
   */
  static createQueue(options = {}) {
    const queueType = options.type || config.queue.type;
    
    switch (queueType.toLowerCase()) {
      case 'local':
        return new LocalQueue({
          name: options.name || 'local-queue',
          ...options
        });
        
      case 'sqs':
        return new SQSQueue({
          name: options.name || 'sqs-queue',
          queueUrl: config.queue.sqs.url,
          region: config.queue.sqs.region,
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
          ...options
        });
        
      case 'redis':
        return new RedisQueue({
          name: options.name || 'redis-queue',
          host: config.queue.redis?.host || process.env.REDIS_HOST || 'localhost',
          port: config.queue.redis?.port || process.env.REDIS_PORT || 6379,
          password: config.queue.redis?.password || process.env.REDIS_PASSWORD,
          db: config.queue.redis?.db || 0,
          ...options
        });
        
      default:
        throw new Error(`Unsupported queue type: ${queueType}`);
    }
  }

  /**
   * Create a queue with default configuration
   * @returns {BaseQueue} Queue instance
   */
  static createDefaultQueue() {
    return this.createQueue();
  }

  /**
   * Create multiple queues for different purposes
   * @param {Object} queueConfigs - Configuration for multiple queues
   * @returns {Object} Map of queue instances
   */
  static createQueues(queueConfigs) {
    const queues = {};
    
    for (const [name, config] of Object.entries(queueConfigs)) {
      queues[name] = this.createQueue({
        name,
        ...config
      });
    }
    
    return queues;
  }

  /**
   * Get available queue types
   * @returns {Array<string>} Available queue types
   */
  static getAvailableQueueTypes() {
    return ['local', 'sqs', 'redis'];
  }

  /**
   * Validate queue configuration
   * @param {Object} config - Queue configuration
   * @returns {boolean} Is configuration valid
   */
  static validateConfig(config) {
    const requiredFields = {
      local: [],
      sqs: ['queueUrl'],
      redis: ['url']
    };

    const queueType = config.type || 'local';
    const required = requiredFields[queueType] || [];
    
    for (const field of required) {
      if (!config[field]) {
        return false;
      }
    }
    
    return true;
  }
}

export default QueueFactory;
