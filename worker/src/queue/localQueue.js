import { BaseQueue, QueueMessage, QueueOptions } from './base.js';
import { EventEmitter } from 'events';

/**
 * Local in-memory queue implementation
 * Suitable for development and testing
 */
export class LocalQueue extends BaseQueue {
  constructor(options = {}) {
    super(options);
    
    this.queueOptions = new QueueOptions(options);
    this.messages = new Map(); // id -> message
    this.pending = new Map(); // id -> message (being processed)
    this.failed = new Map(); // id -> message (failed)
    this.eventEmitter = new EventEmitter();
    this.processing = false;
    this.stats = {
      enqueued: 0,
      dequeued: 0,
      acked: 0,
      nacked: 0,
      failed: 0
    };
  }

  async connect() {
    this.isConnected = true;
    this.eventEmitter.emit('connected');
    return Promise.resolve();
  }

  async disconnect() {
    this.isConnected = false;
    this.eventEmitter.emit('disconnected');
    return Promise.resolve();
  }

  async enqueue(message, options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    const queueMessage = new QueueMessage(message, {
      ...options,
      id: crypto.randomUUID()
    });

    // Add delay if specified
    if (queueMessage.delay > 0) {
      setTimeout(() => {
        this.messages.set(queueMessage.id, queueMessage);
        this.stats.enqueued++;
        this.eventEmitter.emit('message:enqueued', queueMessage);
      }, queueMessage.delay);
    } else {
      this.messages.set(queueMessage.id, queueMessage);
      this.stats.enqueued++;
      this.eventEmitter.emit('message:enqueued', queueMessage);
    }

    return queueMessage.id;
  }

  async dequeue(options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    const { timeout = 5000 } = options;

    // Find available message (not pending, not failed)
    const availableMessage = Array.from(this.messages.values()).find(msg => 
      !this.pending.has(msg.id) && !this.failed.has(msg.id)
    );

    if (availableMessage) {
      // Move to pending
      this.messages.delete(availableMessage.id);
      this.pending.set(availableMessage.id, availableMessage);
      this.stats.dequeued++;
      
      this.eventEmitter.emit('message:dequeued', availableMessage);
      return availableMessage;
    }

    // Wait for message with timeout
    if (timeout > 0) {
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          this.eventEmitter.off('message:enqueued', messageHandler);
          resolve(null);
        }, timeout);

        const messageHandler = (message) => {
          clearTimeout(timeoutId);
          this.eventEmitter.off('message:enqueued', messageHandler);
          
          // Move to pending
          this.messages.delete(message.id);
          this.pending.set(message.id, message);
          this.stats.dequeued++;
          
          this.eventEmitter.emit('message:dequeued', message);
          resolve(message);
        };

        this.eventEmitter.once('message:enqueued', messageHandler);
      });
    }

    return null;
  }

  async ack(messageId) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    if (!this.pending.has(messageId)) {
      throw new Error(`Message ${messageId} is not pending`);
    }

    const message = this.pending.get(messageId);
    this.pending.delete(messageId);
    this.stats.acked++;
    
    this.eventEmitter.emit('message:acked', message);
    return Promise.resolve();
  }

  async nack(messageId, options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    if (!this.pending.has(messageId)) {
      throw new Error(`Message ${messageId} is not pending`);
    }

    const message = this.pending.get(messageId);
    this.pending.delete(messageId);
    
    const { requeue = true, delay = 0 } = options;

    if (requeue && message.canRetry()) {
      const retryMessage = message.createRetryMessage();
      
      if (delay > 0) {
        setTimeout(() => {
          this.messages.set(retryMessage.id, retryMessage);
          this.eventEmitter.emit('message:requeued', retryMessage);
        }, delay);
      } else {
        this.messages.set(retryMessage.id, retryMessage);
        this.eventEmitter.emit('message:requeued', retryMessage);
      }
    } else {
      this.failed.set(messageId, message);
      this.stats.failed++;
      this.eventEmitter.emit('message:failed', message);
    }

    this.stats.nacked++;
    return Promise.resolve();
  }

  async getStats() {
    return {
      ...this.stats,
      queueSize: this.messages.size,
      pendingSize: this.pending.size,
      failedSize: this.failed.size,
      totalSize: this.messages.size + this.pending.size + this.failed.size
    };
  }

  async purge() {
    this.messages.clear();
    this.pending.clear();
    this.failed.clear();
    this.stats = {
      enqueued: 0,
      dequeued: 0,
      acked: 0,
      nacked: 0,
      failed: 0
    };
    
    this.eventEmitter.emit('queue:purged');
    return Promise.resolve();
  }

  async isHealthy() {
    return this.isConnected;
  }

  getName() {
    return this.queueOptions.name;
  }

  /**
   * Get event emitter for listening to queue events
   * @returns {EventEmitter}
   */
  getEventEmitter() {
    return this.eventEmitter;
  }

  /**
   * Get all pending messages (for debugging)
   * @returns {Array<QueueMessage>}
   */
  getPendingMessages() {
    return Array.from(this.pending.values());
  }

  /**
   * Get all failed messages (for debugging)
   * @returns {Array<QueueMessage>}
   */
  getFailedMessages() {
    return Array.from(this.failed.values());
  }

  /**
   * Reset failed messages back to queue (for recovery)
   * @returns {number} Number of messages reset
   */
  resetFailedMessages() {
    const count = this.failed.size;
    for (const [id, message] of this.failed) {
      this.messages.set(id, message);
    }
    this.failed.clear();
    this.stats.failed = 0;
    
    this.eventEmitter.emit('failed:messages:reset', count);
    return count;
  }
}
