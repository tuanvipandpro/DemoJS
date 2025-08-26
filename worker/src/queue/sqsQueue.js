import { BaseQueue, QueueMessage, QueueOptions } from './base.js';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, ChangeMessageVisibilityCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

/**
 * AWS SQS queue implementation
 * Production-ready queue for AWS environments
 */
export class SQSQueue extends BaseQueue {
  constructor(options = {}) {
    super(options);
    
    this.queueOptions = new QueueOptions(options);
    this.sqsClient = null;
    this.queueUrl = options.queueUrl;
    this.region = options.region || 'us-east-1';
    
    if (!this.queueUrl) {
      throw new Error('SQS queue URL is required');
    }
  }

  async connect() {
    try {
      this.sqsClient = new SQSClient({
        region: this.region,
        credentials: {
          accessKeyId: this.options.accessKeyId,
          secretAccessKey: this.options.secretAccessKey
        }
      });

      // Test connection by getting queue attributes
      await this.sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: this.queueUrl,
        AttributeNames: ['QueueArn', 'ApproximateNumberOfMessages']
      }));

      this.isConnected = true;
      return Promise.resolve();
    } catch (error) {
      throw new Error(`Failed to connect to SQS: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.sqsClient) {
      this.sqsClient.destroy();
      this.sqsClient = null;
    }
    this.isConnected = false;
    return Promise.resolve();
  }

  async enqueue(message, options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    const { delay = 0, priority = 0, metadata = {} } = options;
    
    const messageBody = {
      data: message,
      metadata: {
        ...metadata,
        priority,
        timestamp: new Date().toISOString()
      }
    };

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
      DelaySeconds: Math.floor(delay / 1000), // Convert ms to seconds
      MessageAttributes: {
        Priority: {
          DataType: 'Number',
          StringValue: priority.toString()
        },
        Timestamp: {
          DataType: 'String',
          StringValue: new Date().toISOString()
        }
      }
    });

    try {
      const result = await this.sqsClient.send(command);
      return result.MessageId;
    } catch (error) {
      throw new Error(`Failed to enqueue message: ${error.message}`);
    }
  }

  async dequeue(options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    const { 
      maxMessages = 1, 
      visibilityTimeout = this.queueOptions.visibilityTimeout / 1000,
      waitTimeSeconds = this.queueOptions.receiveMessageWaitTimeSeconds 
    } = options;

    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: Math.min(maxMessages, 10), // SQS max is 10
      VisibilityTimeout: Math.floor(visibilityTimeout),
      WaitTimeSeconds: waitTimeSeconds,
      MessageAttributeNames: ['All'],
      AttributeNames: ['All']
    });

    try {
      const result = await this.sqsClient.send(command);
      
      if (!result.Messages || result.Messages.length === 0) {
        return null;
      }

      // Convert SQS message to our QueueMessage format
      const sqsMessage = result.Messages[0];
      const messageBody = JSON.parse(sqsMessage.Body);
      
      const queueMessage = new QueueMessage(messageBody.data, {
        id: sqsMessage.MessageId,
        timestamp: new Date(sqsMessage.Attributes.SentTimestamp),
        retryCount: parseInt(sqsMessage.Attributes.ApproximateReceiveCount || '0'),
        maxRetries: this.queueOptions.maxReceiveCount,
        priority: parseInt(sqsMessage.MessageAttributes?.Priority?.StringValue || '0'),
        metadata: {
          ...messageBody.metadata,
          receiptHandle: sqsMessage.ReceiptHandle,
          sqsAttributes: sqsMessage.Attributes
        }
      });

      return queueMessage;
    } catch (error) {
      throw new Error(`Failed to dequeue message: ${error.message}`);
    }
  }

  async ack(messageId) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    // For SQS, we need the receipt handle from the message metadata
    // This should be called with the full message object, not just the ID
    throw new Error('SQS ack requires the full message object with receipt handle. Use ackMessage() instead.');
  }

  /**
   * Acknowledge a message using the full message object
   * @param {QueueMessage} message - The message to acknowledge
   * @returns {Promise<void>}
   */
  async ackMessage(message) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    const receiptHandle = message.metadata.receiptHandle;
    if (!receiptHandle) {
      throw new Error('Message does not have receipt handle');
    }

    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    });

    try {
      await this.sqsClient.send(command);
    } catch (error) {
      throw new Error(`Failed to acknowledge message: ${error.message}`);
    }
  }

  async nack(messageId, options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    // For SQS, we need the full message object
    throw new Error('SQS nack requires the full message object. Use nackMessage() instead.');
  }

  /**
   * Negative acknowledge a message using the full message object
   * @param {QueueMessage} message - The message to nack
   * @param {Object} options - Nack options
   * @returns {Promise<void>}
   */
  async nackMessage(message, options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    const receiptHandle = message.metadata.receiptHandle;
    if (!receiptHandle) {
      throw new Error('Message does not have receipt handle');
    }

    const { delay = 0 } = options;

    if (delay > 0) {
      // Change message visibility to delay reprocessing
      const command = new ChangeMessageVisibilityCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: Math.floor(delay / 1000)
      });

      try {
        await this.sqsClient.send(command);
      } catch (error) {
        throw new Error(`Failed to change message visibility: ${error.message}`);
      }
    } else {
      // Delete message to remove it from queue
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle
      });

      try {
        await this.sqsClient.send(command);
      } catch (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
      }
    }
  }

  async getStats() {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    try {
      const command = new GetQueueAttributesCommand({
        QueueUrl: this.queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed'
        ]
      });

      const result = await this.sqsClient.send(command);
      const attributes = result.Attributes;

      return {
        queueSize: parseInt(attributes.ApproximateNumberOfMessages || '0'),
        pendingSize: parseInt(attributes.ApproximateNumberOfMessagesNotVisible || '0'),
        delayedSize: parseInt(attributes.ApproximateNumberOfMessagesDelayed || '0'),
        totalSize: parseInt(attributes.ApproximateNumberOfMessages || '0') + 
                  parseInt(attributes.ApproximateNumberOfMessagesNotVisible || '0') +
                  parseInt(attributes.ApproximateNumberOfMessagesDelayed || '0')
      };
    } catch (error) {
      throw new Error(`Failed to get queue stats: ${error.message}`);
    }
  }

  async purge() {
    if (!this.isConnected) {
      throw new Error('Queue is not connected');
    }

    // SQS doesn't have a direct purge method in the SDK
    // This would need to be implemented using AWS CLI or custom logic
    throw new Error('SQS purge not implemented. Use AWS CLI or console to purge queue.');
  }

  async isHealthy() {
    if (!this.isConnected || !this.sqsClient) {
      return false;
    }

    try {
      await this.sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: this.queueUrl,
        AttributeNames: ['QueueArn']
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  getName() {
    return this.queueOptions.name || 'sqs-queue';
  }

  /**
   * Get the SQS client instance
   * @returns {SQSClient}
   */
  getSQSClient() {
    return this.sqsClient;
  }

  /**
   * Get queue URL
   * @returns {string}
   */
  getQueueUrl() {
    return this.queueUrl;
  }
}
