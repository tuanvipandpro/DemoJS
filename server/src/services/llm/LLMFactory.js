import { LangChainService } from './langchainService.js';
import { logger } from '../../utils/logger.js';

/**
 * Factory pattern cho LLM Service
 * Cho phép dễ dàng thay đổi AI provider dựa trên configuration
 */
export class LLMFactory {
  static createLLMService(type = 'gemini') {
    switch (type.toLowerCase()) {
      case 'gemini':
        logger.info('Creating LangChain Gemini Service');
        return new LangChainService();
      
      case 'openai':
        // TODO: Implement OpenAI LLM Service
        logger.warn('OpenAI LLM Service not implemented yet, falling back to Gemini');
        return new LangChainService();
      
      case 'bedrock':
        // TODO: Implement AWS Bedrock LLM Service
        logger.warn('AWS Bedrock LLM Service not implemented yet, falling back to Gemini');
        return new LangChainService();
      
      case 'lmstudio':
        // TODO: Implement LM Studio LLM Service
        logger.warn('LM Studio LLM Service not implemented yet, falling back to Gemini');
        return new LangChainService();
      
      default:
        logger.warn(`Unknown LLM service type: ${type}, falling back to Gemini`);
        return new LangChainService();
    }
  }

  /**
   * Tạo LLM service dựa trên environment variables
   */
  static createDefaultLLMService() {
    const llmType = process.env.LLM_SERVICE_TYPE || 'gemini';
    return this.createLLMService(llmType);
  }

  /**
   * Tạo LLM service với custom configuration
   */
  static createLLMServiceWithConfig(config) {
    const { type, options } = config;
    const service = this.createLLMService(type);
    
    // Apply custom configuration
    if (options) {
      service.updateConfig(options);
    }
    
    return service;
  }

  /**
   * Tạo LLM service dựa trên project configuration
   */
  static createLLMServiceForProject(projectConfig) {
    const llmType = projectConfig.llmProvider || process.env.LLM_SERVICE_TYPE || 'gemini';
    const config = {
      ...projectConfig.llmConfig,
      projectId: projectConfig.id,
      projectName: projectConfig.name
    };
    
    return this.createLLMServiceWithConfig({ type: llmType, options: config });
  }
}
