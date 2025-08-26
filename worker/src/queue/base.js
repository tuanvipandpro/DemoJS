/**
 * Abstract base class for queue implementations
 * Provides a common interface for different queue providers
 */
export class BaseQueue {
  constructor(options = {}) {
    if (this.constructor === BaseQueue) {
      throw new Error('BaseQueue is an abstract class and cannot be instantiated directly');
    }
    
    this.options = options;
    this.isConnected = false;
  }

  /**
   * Connect to the queue service
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() method must be implemented by subclass');
  }

  /**
   * Disconnect from the queue service
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented by subclass');
  }

  /**
   * Enqueue a message
   * @param {Object} message - Message to enqueue
   * @param {Object} options - Queue options (delay, priority, etc.)
   * @returns {Promise<string>} - Message ID
   */
  async enqueue(message, options = {}) {
    throw new Error('enqueue() method must be implemented by subclass');
  }

  /**
   * Dequeue a message
   * @param {Object} options - Dequeue options (timeout, etc.)
   * @returns {Promise<Object|null>} - Message object or null if no messages
   */
  async dequeue(options = {}) {
    throw new Error('dequeue() method must be implemented by subclass');
  }

  /**
   * Acknowledge a message (mark as successfully processed)
   * @param {string} messageId - ID of the message to acknowledge
   * @returns {Promise<void>}
   */
  async ack(messageId) {
    throw new Error('ack() method must be implemented by subclass');
  }

  /**
   * Negative acknowledge a message (mark as failed, requeue if possible)
   * @param {string} messageId - ID of the message to nack
   * @param {Object} options - Nack options (requeue, delay, etc.)
   * @returns {Promise<void>}
   */
  async nack(messageId, options = {}) {
    throw new Error('nack() method must be implemented by subclass');
  }

  /**
   * Get queue statistics
   * @returns {Promise<Object>} - Queue stats (size, pending, etc.)
   */
  async getStats() {
    throw new Error('getStats() method must be implemented by subclass');
  }

  /**
   * Purge all messages from the queue
   * @returns {Promise<void>}
   */
  async purge() {
    throw new Error('purge() method must be implemented by subclass');
  }

  /**
   * Check if queue is healthy
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    throw new Error('isHealthy() method must be implemented by subclass');
  }

  /**
   * Get queue name/identifier
   * @returns {string}
   */
  getName() {
    throw new Error('getName() method must be implemented by subclass');
  }
}

/**
 * Message structure for queue operations
 */
export class QueueMessage {
  constructor(data, options = {}) {
    this.id = options.id || crypto.randomUUID();
    this.data = data;
    this.timestamp = options.timestamp || new Date();
    this.retryCount = options.retryCount || 0;
    this.maxRetries = options.maxRetries || 3;
    this.priority = options.priority || 0;
    this.delay = options.delay || 0;
    this.metadata = options.metadata || {};
  }

  /**
   * Check if message can be retried
   * @returns {boolean}
   */
  canRetry() {
    return this.retryCount < this.maxRetries;
  }

  /**
   * Increment retry count
   * @returns {number}
   */
  incrementRetry() {
    this.retryCount++;
    return this.retryCount;
  }

  /**
   * Create a copy of the message for retry
   * @returns {QueueMessage}
   */
  createRetryMessage() {
    return new QueueMessage(this.data, {
      ...this,
      id: crypto.randomUUID(),
      retryCount: this.retryCount + 1,
      timestamp: new Date()
    });
  }
}

/**
 * Queue options for configuration
 */
export class QueueOptions {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.visibilityTimeout = options.visibilityTimeout || 30000; // 30 seconds
    this.messageRetentionPeriod = options.messageRetentionPeriod || 1209600; // 14 days
    this.maxMessageSize = options.maxMessageSize || 262144; // 256 KB
    this.delaySeconds = options.delaySeconds || 0;
    this.receiveMessageWaitTimeSeconds = options.receiveMessageWaitTimeSeconds || 20;
    this.deadLetterQueueUrl = options.deadLetterQueueUrl;
    this.maxReceiveCount = options.maxReceiveCount || 3;
  }
}
