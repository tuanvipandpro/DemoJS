import { PostgreSQLRAGService } from './PostgreSQLRAGService.js';
import { logger } from '../../utils/logger.js';

/**
 * Factory pattern cho RAG Service
 * Cho phép dễ dàng thay đổi implementation dựa trên configuration
 */
export class RAGFactory {
  static createRAGService(type = 'postgresql') {
    switch (type.toLowerCase()) {
      case 'postgresql':
      case 'pg':
        logger.info('Creating PostgreSQL RAG Service');
        return new PostgreSQLRAGService();
      
      case 'sqlite':
        // TODO: Implement SQLite RAG Service for demo
        logger.warn('SQLite RAG Service not implemented yet, falling back to PostgreSQL');
        return new PostgreSQLRAGService();
      
      case 'memory':
        // TODO: Implement In-Memory RAG Service for testing
        logger.warn('In-Memory RAG Service not implemented yet, falling back to PostgreSQL');
        return new PostgreSQLRAGService();
      
      default:
        logger.warn(`Unknown RAG service type: ${type}, falling back to PostgreSQL`);
        return new PostgreSQLRAGService();
    }
  }

  /**
   * Tạo RAG service dựa trên environment variables
   */
  static createDefaultRAGService() {
    const ragType = process.env.RAG_SERVICE_TYPE || 'postgresql';
    return this.createRAGService(ragType);
  }

  /**
   * Tạo RAG service với custom configuration
   */
  static createRAGServiceWithConfig(config) {
    const { type, options } = config;
    const service = this.createRAGService(type);
    
    // Apply custom configuration if needed
    if (options && typeof service.configure === 'function') {
      service.configure(options);
    }
    
    return service;
  }
}
