/**
 * Interface cho Queue Service
 * Đảm bảo tính DI để có thể chuyển đổi giữa Redis và SQS
 */
export class IQueueService {
  /**
   * Kết nối đến queue system
   */
  async connect() {
    throw new Error('Method connect() must be implemented');
  }

  /**
   * Ngắt kết nối queue system
   */
  async disconnect() {
    throw new Error('Method disconnect() must be implemented');
  }

  /**
   * Enqueue message vào queue
   * @param {Object} message - Message object
   * @param {string} message.type - Loại message
   * @param {Object} message.data - Dữ liệu message
   * @param {string} message.priority - Priority (low, normal, high)
   * @param {number} message.delay - Delay trước khi xử lý (giây)
   * @returns {Promise<Object>} Kết quả enqueue
   */
  async enqueue(message) {
    throw new Error('Method enqueue() must be implemented');
  }

  /**
   * Kiểm tra trạng thái kết nối
   * @returns {Promise<boolean>} Trạng thái kết nối
   */
  async isConnected() {
    throw new Error('Method isConnected() must be implemented');
  }
}
