/**
 * Interface cho RAG (Retrieval Augmented Generation) Service
 * Cho phép thay đổi implementation dễ dàng
 */
export class IRAGService {
  /**
   * Thêm document vào RAG store
   * @param {number} projectId - ID của project
   * @param {string} namespace - Namespace của document (guideline, code_chunk, test_pattern)
   * @param {string} content - Nội dung document
   * @param {Array<number>} embedding - Vector embedding
   * @param {Object} metadata - Metadata bổ sung
   * @returns {Promise<Object>} Document đã tạo
   */
  async insertDocument(projectId, namespace, content, embedding, metadata = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm kiếm documents tương tự
   * @param {number} projectId - ID của project
   * @param {string} namespace - Namespace để tìm kiếm
   * @param {Array<number>} embedding - Vector embedding để so sánh
   * @param {number} limit - Số lượng kết quả tối đa
   * @returns {Promise<Array>} Danh sách documents tương tự
   */
  async searchDocuments(projectId, namespace, embedding, limit = 5) {
    throw new Error('Method not implemented');
  }

  /**
   * Lấy documents theo namespace
   * @param {number} projectId - ID của project
   * @param {string} namespace - Namespace để lấy
   * @param {number} limit - Số lượng kết quả tối đa
   * @returns {Promise<Array>} Danh sách documents
   */
  async getDocumentsByNamespace(projectId, namespace, limit = 100) {
    throw new Error('Method not implemented');
  }

  /**
   * Xóa document
   * @param {number} id - ID của document
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  async deleteDocument(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm kiếm context phù hợp cho test generation
   * @param {number} projectId - ID của project
   * @param {string} diffSummary - Tóm tắt code changes
   * @param {Array<number>} diffEmbedding - Vector embedding của diff
   * @returns {Promise<Object>} Context phù hợp cho test generation
   */
  async findTestContext(projectId, diffSummary, diffEmbedding) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật guidelines cho project
   * @param {number} projectId - ID của project
   * @param {Array<Object>} guidelines - Danh sách guidelines mới
   * @returns {Promise<boolean>} True nếu cập nhật thành công
   */
  async updateProjectGuidelines(projectId, guidelines) {
    throw new Error('Method not implemented');
  }
}
