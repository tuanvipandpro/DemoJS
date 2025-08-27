import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMService } from './ILLMService.js';
import { logger } from '../../utils/logger.js';

/**
 * Gemini LLM Service Implementation
 * Sử dụng Google Gemini AI
 */
export class GeminiLLMService extends ILLMService {
  constructor(options = {}) {
    super();
    this.options = {
      apiKey: options.apiKey || process.env.GEMINI_API_KEY,
      model: options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      apiUrl: options.apiUrl || process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
      ...options
    };
    this.genAI = null;
    this.model = null;
  }

  async initialize() {
    try {
      if (!this.options.apiKey) {
        throw new Error('GEMINI_API_KEY is required');
      }

      this.genAI = new GoogleGenerativeAI(this.options.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.options.model });
      
      logger.info(`Gemini LLM Service initialized with model: ${this.options.model}`);
      return true;
    } catch (error) {
      logger.error('Failed to initialize Gemini LLM Service:', error);
      throw error;
    }
  }

  async generate(request) {
    try {
      if (!this.model) {
        throw new Error('Gemini LLM Service not initialized');
      }

      const { prompt, context, options = {} } = request;
      
      if (!prompt) {
        throw new Error('Prompt is required');
      }

      const generationConfig = {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 8192,
        ...options
      };

      // Tạo prompt với context nếu có
      let fullPrompt = prompt;
      if (context) {
        fullPrompt = `Context: ${JSON.stringify(context)}\n\nPrompt: ${prompt}`;
      }

      const result = await this.model.generateContent(fullPrompt, generationConfig);
      const response = await result.response;
      const text = response.text();

      logger.debug(`Gemini response generated successfully, length: ${text.length}`);

      return {
        success: true,
        text,
        model: this.options.model,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          responseTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0
        },
        metadata: {
          model: this.options.model,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to generate response from Gemini:', error);
      throw error;
    }
  }

  async isConnected() {
    return this.model !== null;
  }

  async getModelInfo() {
    return {
      provider: 'gemini',
      model: this.options.model,
      apiUrl: this.options.apiUrl,
      isConnected: this.isConnected()
    };
  }
}
