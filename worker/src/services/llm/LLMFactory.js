import { GeminiLLMService } from './GeminiLLMService.js';
import { BedrockLLMService } from './BedrockLLMService.js';
import { logger } from '../../utils/logger.js';

/**
 * LLM Factory để chọn implementation phù hợp
 * Đảm bảo tính DI để có thể chuyển đổi giữa Gemini và Bedrock
 */
export class LLMFactory {
  /**
   * Tạo LLM Service instance dựa trên configuration
   * @param {Object} options - Configuration options
   * @returns {ILLMService} LLM Service instance
   */
  static createLLMService(options = {}) {
    const llmProvider = options.provider || process.env.LLM_PROVIDER || 'gemini';
    
    logger.info(`Creating LLM service with provider: ${llmProvider}`);
    
    switch (llmProvider.toLowerCase()) {
      case 'gemini':
        return new GeminiLLMService(options);
      
      case 'bedrock':
        return new BedrockLLMService(options);
      
      default:
        logger.warn(`Unknown LLM provider: ${llmProvider}, falling back to Gemini`);
        return new GeminiLLMService(options);
    }
  }

  /**
   * Tạo LLM Service với configuration mặc định
   * @returns {ILLMService} LLM Service instance
   */
  static createDefaultLLMService() {
    return this.createLLMService();
  }
}
