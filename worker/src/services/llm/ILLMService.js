/**
 * Interface cho LLM Service
 * Đảm bảo tính DI để có thể chuyển đổi giữa Gemini và Bedrock
 */
export class ILLMService {
  /**
   * Khởi tạo LLM service
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented');
  }

  /**
   * Gọi LLM để generate response
   * @param {Object} request - Request object
   * @param {string} request.prompt - Prompt text
   * @param {Object} request.context - Context data
   * @param {Object} request.options - Additional options
   * @returns {Promise<Object>} LLM response
   */
  async generate(request) {
    throw new Error('Method generate() must be implemented');
  }

  /**
   * Kiểm tra trạng thái kết nối
   * @returns {Promise<boolean>} Trạng thái kết nối
   */
  async isConnected() {
    throw new Error('Method isConnected() must be implemented');
  }

  /**
   * Lấy thông tin model
   * @returns {Promise<Object>} Model information
   */
  async getModelInfo() {
    throw new Error('Method getModelInfo() must be implemented');
  }
}
