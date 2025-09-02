import { IRAGService } from './IRAGService.js';
import { 
  insertRAGDocument, 
  searchRAGDocuments, 
  getRAGDocumentsByNamespace, 
  deleteRAGDocument 
} from '../../db/init.js';
import { logger } from '../../utils/logger.js';

/**
 * PostgreSQL implementation của RAG Service
 * Sử dụng pgvector để lưu trữ và tìm kiếm vector embeddings
 */
export class PostgreSQLRAGService extends IRAGService {
  constructor() {
    super();
    this.logger = logger;
  }

  async insertDocument(projectId, namespace, content, embedding, metadata = {}) {
    try {
      this.logger.info(`Inserting RAG document for project ${projectId}, namespace: ${namespace}`);
      
      const result = await insertRAGDocument(projectId, namespace, content, embedding, metadata);
      
      this.logger.info(`RAG document inserted successfully with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('Error inserting RAG document:', error);
      throw error;
    }
  }

  async searchDocuments(projectId, namespace, embedding, limit = 5) {
    try {
      this.logger.info(`Searching RAG documents for project ${projectId}, namespace: ${namespace}`);
      
      const results = await searchRAGDocuments(projectId, namespace, embedding, limit);
      
      this.logger.info(`Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      this.logger.error('Error searching RAG documents:', error);
      throw error;
    }
  }

  async getDocumentsByNamespace(projectId, namespace, limit = 100) {
    try {
      this.logger.info(`Getting RAG documents for project ${projectId}, namespace: ${namespace}`);
      
      const documents = await getRAGDocumentsByNamespace(projectId, namespace, limit);
      
      this.logger.info(`Retrieved ${documents.length} documents`);
      return documents;
    } catch (error) {
      this.logger.error('Error getting RAG documents:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      this.logger.info(`Deleting RAG document with ID: ${id}`);
      
      const result = await deleteRAGDocument(id);
      
      if (result) {
        this.logger.info(`RAG document ${id} deleted successfully`);
      } else {
        this.logger.warn(`RAG document ${id} not found`);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error deleting RAG document:', error);
      throw error;
    }
  }

  async findTestContext(projectId, diffSummary, diffEmbedding) {
    try {
      this.logger.info(`Finding test context for project ${projectId}`);
      
      // Tìm kiếm guidelines phù hợp
      const guidelines = await this.searchDocuments(
        projectId, 
        'guideline', 
        diffEmbedding, 
        3
      );
      
      // Tìm kiếm test patterns phù hợp
      const testPatterns = await this.searchDocuments(
        projectId, 
        'test_pattern', 
        diffEmbedding, 
        2
      );
      
      // Tìm kiếm code chunks liên quan
      const codeChunks = await this.searchDocuments(
        projectId, 
        'code_chunk', 
        diffEmbedding, 
        5
      );
      
      const context = {
        guidelines: guidelines.map(doc => ({
          content: doc.content,
          metadata: doc.metadata,
          similarity: doc.similarity
        })),
        testPatterns: testPatterns.map(doc => ({
          content: doc.content,
          metadata: doc.metadata,
          similarity: doc.similarity
        })),
        codeChunks: codeChunks.map(doc => ({
          content: doc.content,
          metadata: doc.metadata,
          similarity: doc.similarity
        })),
        diffSummary,
        timestamp: new Date().toISOString()
      };
      
      this.logger.info(`Test context found with ${guidelines.length} guidelines, ${testPatterns.length} patterns, ${codeChunks.length} code chunks`);
      
      return context;
    } catch (error) {
      this.logger.error('Error finding test context:', error);
      throw error;
    }
  }

  async updateProjectGuidelines(projectId, guidelines) {
    try {
      this.logger.info(`Updating guidelines for project ${projectId}`);
      
      // Xóa guidelines cũ
      const oldGuidelines = await this.getDocumentsByNamespace(projectId, 'guideline');
      for (const doc of oldGuidelines) {
        await this.deleteDocument(doc.id);
      }
      
      // Thêm guidelines mới
      for (const guideline of guidelines) {
        // Tạo dummy embedding (trong thực tế sẽ dùng AI service)
        const dummyEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        
        await this.insertDocument(
          projectId,
          'guideline',
          guideline.content,
          dummyEmbedding,
          guideline.metadata || {}
        );
      }
      
      this.logger.info(`Updated ${guidelines.length} guidelines for project ${projectId}`);
      return true;
    } catch (error) {
      this.logger.error('Error updating project guidelines:', error);
      throw error;
    }
  }
}
