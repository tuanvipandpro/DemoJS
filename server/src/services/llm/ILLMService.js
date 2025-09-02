/**
 * Interface cho LLM (Large Language Model) Service
 * Cho phép thay đổi AI provider dễ dàng
 */
export class ILLMService {
  /**
   * Khởi tạo LLM service
   * @param {Object} config - Configuration cho LLM service
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Tạo test proposals dựa trên code diff và context
   * @param {string} diffSummary - Tóm tắt code changes
   * @param {Object} context - RAG context (guidelines, patterns, code chunks)
   * @param {Object} options - Options bổ sung
   * @returns {Promise<Array>} Danh sách test proposals
   */
  async generateTestProposals(diffSummary, context, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Tạo test plan dựa trên code changes
   * @param {string} diffSummary - Tóm tắt code changes
   * @param {Object} context - RAG context
   * @param {Object} options - Options bổ sung
   * @returns {Promise<Object>} Test plan
   */
  async generateTestPlan(diffSummary, context, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Phân tích impact của code changes
   * @param {string} diffSummary - Tóm tắt code changes
   * @param {Object} context - RAG context
   * @returns {Promise<Object>} Impact analysis
   */
  async analyzeImpact(diffSummary, context) {
    throw new Error('Method not implemented');
  }

  /**
   * Tạo embedding cho text
   * @param {string} text - Text cần tạo embedding
   * @returns {Promise<Array<number>>} Vector embedding
   */
  async createEmbedding(text) {
    throw new Error('Method not implemented');
  }

  /**
   * Kiểm tra trạng thái của LLM service
   * @returns {Promise<Object>} Service status
   */
  async healthCheck() {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật configuration
   * @param {Object} newConfig - Configuration mới
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}
