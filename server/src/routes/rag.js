import express from 'express';
import { logger } from '../utils/logger.js';
import { ensureAuthenticated, checkProjectAccessById } from '../middleware/auth.js';
import { RAGFactory } from '../services/rag/RAGFactory.js';

const router = express.Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(ensureAuthenticated);

/**
 * @swagger
 * /api/rag/{projectId}/insert:
 *   post:
 *     summary: Insert document into RAG system
 *     description: Add guideline or code chunk to the project's RAG vector store
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content to be stored in the vector store
 *                 example: "Always use async/await for database operations"
 *               embedding:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Pre-computed embedding vector (optional)
 *                 example: [0.1, 0.2, 0.3, ...]
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the document
 *                 properties:
 *                   namespace:
 *                     type: string
 *                     example: "guideline"
 *                   source:
 *                     type: string
 *                     example: "manual"
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["testing", "best-practices"]
 *     responses:
 *       200:
 *         description: Document inserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 document:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "doc_123"
 *                     content:
 *                       type: string
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Bad request - content is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:projectId/insert', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, embedding, metadata = {} } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Tạo RAG service
    const ragService = RAGFactory.createDefaultRAGService();
    
    // Tạo embedding nếu không được cung cấp
    let finalEmbedding = embedding;
    if (!finalEmbedding) {
      // Tạo dummy embedding (trong thực tế sẽ dùng AI service)
      finalEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      
      // Normalize vector
      const magnitude = Math.sqrt(finalEmbedding.reduce((sum, val) => sum + val * val, 0));
      finalEmbedding = finalEmbedding.map(val => val / magnitude);
    }
    
    // Xác định namespace từ metadata hoặc content
    const namespace = metadata.namespace || 'guideline';
    
    // Thêm document
    const result = await ragService.insertDocument(
      projectId,
      namespace,
      content,
      finalEmbedding,
      metadata
    );
    
    logger.info(`RAG document inserted for project ${projectId}: ${result.id}`);
    
    res.json({
      success: true,
      document: result
    });
    
  } catch (error) {
    logger.error('Error inserting RAG document:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/rag/{projectId}/search:
 *   post:
 *     summary: Search for relevant context
 *     description: Find relevant documents in the RAG vector store using similarity search
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - embedding
 *             properties:
 *               embedding:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Query embedding vector for similarity search
 *                 example: [0.1, 0.2, 0.3, ...]
 *               namespace:
 *                 type: string
 *                 description: Namespace to search in
 *                 example: "guideline"
 *                 default: "guideline"
 *               limit:
 *                 type: integer
 *                 description: Maximum number of results to return
 *                 example: 5
 *                 default: 5
 *                 minimum: 1
 *                 maximum: 50
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "doc_123"
 *                       content:
 *                         type: string
 *                         example: "Always use async/await for database operations"
 *                       similarity:
 *                         type: number
 *                         format: float
 *                         example: 0.85
 *                       metadata:
 *                         type: object
 *       400:
 *         description: Bad request - embedding is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:projectId/search', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { embedding, namespace, limit = 5 } = req.body;
    
    if (!embedding) {
      return res.status(400).json({
        success: false,
        error: 'Embedding is required'
      });
    }
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Tạo RAG service
    const ragService = RAGFactory.createDefaultRAGService();
    
    // Tìm kiếm documents
    const results = await ragService.searchDocuments(
      projectId,
      namespace || 'guideline',
      embedding,
      limit
    );
    
    logger.info(`RAG search completed for project ${projectId}: ${results.length} results`);
    
    res.json({
      success: true,
      results
    });
    
  } catch (error) {
    logger.error('Error searching RAG documents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/rag/{projectId}/documents:
 *   get:
 *     summary: Get project documents
 *     description: Retrieve all documents stored in the project's RAG vector store
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: Filter by namespace
 *         example: "guideline"
 *         default: "guideline"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: Maximum number of documents to return
 *         example: 50
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "doc_123"
 *                       content:
 *                         type: string
 *                         example: "Always use async/await for database operations"
 *                       metadata:
 *                         type: object
 *                         properties:
 *                           namespace:
 *                             type: string
 *                             example: "guideline"
 *                           source:
 *                             type: string
 *                             example: "manual"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:projectId/documents', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { namespace, limit = 100 } = req.query;
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Tạo RAG service
    const ragService = RAGFactory.createDefaultRAGService();
    
    // Lấy documents
    const documents = await ragService.getDocumentsByNamespace(
      projectId,
      namespace || 'guideline',
      limit
    );
    
    logger.info(`RAG documents retrieved for project ${projectId}: ${documents.length} documents`);
    
    res.json({
      success: true,
      documents
    });
    
  } catch (error) {
    logger.error('Error getting RAG documents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/rag/{projectId}/documents/{id}:
 *   delete:
 *     summary: Delete document from RAG system
 *     description: Remove a document from the project's RAG vector store
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID to delete
 *         example: "doc_123"
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Document deleted successfully"
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:projectId/documents/:id', async (req, res) => {
  try {
    const { projectId, id } = req.params;
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Tạo RAG service
    const ragService = RAGFactory.createDefaultRAGService();
    
    // Xóa document
    const deleted = await ragService.deleteDocument(id);
    
    if (deleted) {
      logger.info(`RAG document ${id} deleted from project ${projectId}`);
      
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
  } catch (error) {
    logger.error('Error deleting RAG document:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/rag/{projectId}/guidelines:
 *   post:
 *     summary: Update project guidelines
 *     description: Update the guidelines for a project in the RAG system
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guidelines
 *             properties:
 *               guidelines:
 *                 type: array
 *                 description: Array of guideline objects
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "guideline_1"
 *                     title:
 *                       type: string
 *                       example: "Database Testing Guidelines"
 *                     content:
 *                       type: string
 *                       example: "Always test database operations with proper mocking"
 *                     category:
 *                       type: string
 *                       example: "database"
 *                     priority:
 *                       type: integer
 *                       example: 1
 *                       minimum: 1
 *                       maximum: 5
 *     responses:
 *       200:
 *         description: Guidelines updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Updated 5 guidelines successfully"
 *       400:
 *         description: Bad request - guidelines must be an array
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:projectId/guidelines', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { guidelines } = req.body;
    
    if (!Array.isArray(guidelines)) {
      return res.status(400).json({
        success: false,
        error: 'Guidelines must be an array'
      });
    }
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Tạo RAG service
    const ragService = RAGFactory.createDefaultRAGService();
    
    // Cập nhật guidelines
    const result = await ragService.updateProjectGuidelines(projectId, guidelines);
    
    if (result) {
      logger.info(`Project ${projectId} guidelines updated: ${guidelines.length} guidelines`);
      
      res.json({
        success: true,
        message: `Updated ${guidelines.length} guidelines successfully`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update guidelines'
      });
    }
    
  } catch (error) {
    logger.error('Error updating project guidelines:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/rag/{projectId}/context:
 *   get:
 *     summary: Get test context
 *     description: Retrieve relevant context for test generation based on diff summary
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *       - in: query
 *         name: diffSummary
 *         required: true
 *         schema:
 *           type: string
 *         description: Summary of code changes to find relevant context for
 *         example: "Added new user authentication function with input validation"
 *     responses:
 *       200:
 *         description: Test context retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 context:
 *                   type: object
 *                   properties:
 *                     relevantDocuments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "doc_123"
 *                           content:
 *                             type: string
 *                             example: "Always validate user input before processing"
 *                           similarity:
 *                             type: number
 *                             format: float
 *                             example: 0.92
 *                           metadata:
 *                             type: object
 *                     guidelines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "guideline_1"
 *                           title:
 *                             type: string
 *                             example: "Authentication Testing"
 *                           content:
 *                             type: string
 *                             example: "Test all authentication flows including edge cases"
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [
 *                         "Test input validation for all user inputs",
 *                         "Verify authentication token handling",
 *                         "Check error handling for invalid credentials"
 *                       ]
 *       400:
 *         description: Bad request - diff summary is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:projectId/context', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { diffSummary } = req.query;
    
    if (!diffSummary) {
      return res.status(400).json({
        success: false,
        error: 'Diff summary is required'
      });
    }
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, projectId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Tạo RAG service
    const ragService = RAGFactory.createDefaultRAGService();
    
    // Tạo dummy embedding (trong thực tế sẽ dùng AI service)
    const diffEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
    const magnitude = Math.sqrt(diffEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = diffEmbedding.map(val => val / magnitude);
    
    // Tìm test context
    const context = await ragService.findTestContext(projectId, diffSummary, normalizedEmbedding);
    
    logger.info(`Test context retrieved for project ${projectId}`);
    
    res.json({
      success: true,
      context
    });
    
  } catch (error) {
    logger.error('Error getting test context:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
