import express from 'express';
import { logger } from '../utils/logger.js';
import { encryptToken, decryptToken, maskToken } from '../utils/tokenEncryption.js';
import { pool } from '../db/init.js';
import { authenticateJWT, checkProjectAccess } from '../middleware/auth.js';

const router = express.Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(authenticateJWT);

// GET /api/projects - Lấy danh sách dự án
router.get('/', async (req, res) => {
  try {
    const { owner_id } = req.query; // Lấy owner_id từ query params (cho admin)
    const currentUserId = req.user?.id; // Lấy user ID đang đăng nhập
    
    let query = `
      SELECT 
        id, name, description, git_provider, repository, branch, 
        owner_id, personal_access_token, notifications, created_at, is_delete, is_disable, status
      FROM projects
      WHERE is_delete = false
    `;
    
    const params = [];
    
    // Nếu không có owner_id trong query và user đã đăng nhập, chỉ trả về projects của user đó
    if (!owner_id && currentUserId) {
      query += ` AND owner_id = $1`;
      params.push(currentUserId);
    } else if (owner_id) {
      // Nếu có owner_id trong query (cho admin), filter theo owner_id đó
      query += ` AND owner_id = $1`;
      params.push(owner_id);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    
    // Format response - trả về personalAccessToken đã mã hóa
    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      gitProvider: project.git_provider,
      repository: project.repository,
      branch: project.branch,
      ownerId: project.owner_id,
      personalAccessToken: project.personal_access_token ? '***ENCRYPTED***' : null,
      notifications: project.notifications ? JSON.parse(project.notifications) : [],
      createdAt: project.created_at,
      isDelete: project.is_delete,
      isDisable: project.is_disable,
      status: project.status
    }));
    
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/projects - Tạo dự án mới
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      gitProvider, 
      personalAccessToken,
      repository, 
      branch, 
      notifications
    } = req.body;
    
    // Lấy owner_id từ user đang đăng nhập
    const ownerId = req.user?.id;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    // Log để debug
    logger.info('Creating project:', {
      name,
      hasToken: !!personalAccessToken,
      gitProvider,
      repository,
      ownerId
    });
    
    // Mã hóa Personal Access Token nếu có
    const encryptedToken = personalAccessToken ? encryptToken(personalAccessToken) : null;
    
    if (personalAccessToken && !encryptedToken) {
      logger.error('Failed to encrypt personal access token');
      return res.status(500).json({
        success: false,
        error: 'Failed to encrypt personal access token'
      });
    }
    
    const query = `
      INSERT INTO projects (
        name, description, git_provider, personal_access_token, 
        repository, branch, owner_id, notifications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const params = [
      name, description, gitProvider, encryptedToken,
      repository, branch, ownerId,
      notifications ? JSON.stringify(notifications) : '[]'
    ];
    
    const result = await pool.query(query, params);
    const newProject = result.rows[0];
    
    // Log saved project
    logger.info('Project created successfully:', {
      id: newProject.id,
      hasPersonalAccessToken: !!newProject.personal_access_token
    });
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      gitProvider: newProject.git_provider,
      repository: newProject.repository,
      branch: newProject.branch,
      ownerId: newProject.owner_id,
      personalAccessToken: newProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifications: newProject.notifications ? JSON.parse(newProject.notifications) : [],
      createdAt: newProject.created_at,
      isDelete: newProject.is_delete,
      isDisable: newProject.is_disable,
      status: newProject.status
    };
    
    res.status(201).json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/projects/:id - Lấy dự án theo ID
router.get('/:id', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id, name, description, git_provider, repository, branch, 
        owner_id, personal_access_token, notifications, created_at, is_delete, is_disable, status
      FROM projects 
      WHERE id = $1 AND is_delete = false
    `;
    
    const result = await pool.query(query, [id]);
    
    const project = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      gitProvider: project.git_provider,
      repository: project.repository,
      branch: project.branch,
      ownerId: project.owner_id,
      personalAccessToken: project.personal_access_token ? '***ENCRYPTED***' : null,
      notifications: project.notifications ? JSON.parse(project.notifications) : [],
      createdAt: project.created_at,
      isDelete: project.is_delete,
      isDisable: project.is_disable,
      status: project.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error fetching project by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/projects/:id - Cập nhật dự án
router.put('/:id', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Xóa các field không được phép update
    delete updateData.id;
    delete updateData.owner_id;
    delete updateData.created_at;
    delete updateData.is_delete;
    
    // Mã hóa token nếu có update
    if (updateData.personalAccessToken) {
      updateData.personal_access_token = encryptToken(updateData.personalAccessToken);
      delete updateData.personalAccessToken;
    }
    
    // Xử lý notifications
    if (updateData.notifications) {
      updateData.notifications = JSON.stringify(updateData.notifications);
    }
    
    // Xử lý git provider
    if (updateData.gitProvider) {
      updateData.git_provider = updateData.gitProvider;
      delete updateData.gitProvider;
    }
    
    // Tạo dynamic query
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE projects 
      SET ${setClause}
      WHERE id = $1 AND is_delete = false
      RETURNING *
    `;
    
    const params = [id, ...fields.map(field => updateData[field])];
    const result = await pool.query(query, params);
    
    const updatedProject = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      gitProvider: updatedProject.git_provider,
      repository: updatedProject.repository,
      branch: updatedProject.branch,
      ownerId: updatedProject.owner_id,
      personalAccessToken: updatedProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifications: updatedProject.notifications ? JSON.parse(updatedProject.notifications) : [],
      createdAt: updatedProject.created_at,
      isDelete: updatedProject.is_delete,
      isDisable: updatedProject.is_disable,
      status: updatedProject.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/projects/:id - Xóa dự án (soft delete)
router.delete('/:id', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'UPDATE projects SET is_delete = true WHERE id = $1 AND is_delete = false RETURNING id';
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      message: `Project with ID ${id} has been deleted successfully`
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/projects/:id/disable - Vô hiệu hóa dự án
router.patch('/:id/disable', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisable } = req.body;
    
    if (typeof isDisable !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isDisable must be a boolean value'
      });
    }
    
    const query = `
      UPDATE projects 
      SET is_disable = $2 
      WHERE id = $1 AND is_delete = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, isDisable]);
    
    const updatedProject = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      gitProvider: updatedProject.git_provider,
      repository: updatedProject.repository,
      branch: updatedProject.branch,
      ownerId: updatedProject.owner_id,
      personalAccessToken: updatedProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifications: updatedProject.notifications ? JSON.parse(updatedProject.notifications) : [],
      createdAt: updatedProject.created_at,
      isDelete: updatedProject.is_delete,
      isDisable: updatedProject.is_disable,
      status: updatedProject.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error updating project disable status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/projects/:id/status - Cập nhật trạng thái dự án
router.patch('/:id/status', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const query = `
      UPDATE projects 
      SET status = $2 
      WHERE id = $1 AND is_delete = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, status]);
    
    const updatedProject = result.rows[0];
    
    // Format response - trả về personalAccessToken đã mã hóa
    const formattedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      gitProvider: updatedProject.git_provider,
      repository: updatedProject.repository,
      branch: updatedProject.branch,
      ownerId: updatedProject.owner_id,
      personalAccessToken: updatedProject.personal_access_token ? '***ENCRYPTED***' : null,
      notifications: updatedProject.notifications ? JSON.parse(updatedProject.notifications) : [],
      createdAt: updatedProject.created_at,
      isDelete: updatedProject.is_delete,
      isDisable: updatedProject.is_disable,
      status: updatedProject.status
    };
    
    res.json({
      success: true,
      project: formattedProject
    });
  } catch (error) {
    logger.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/projects/:id/github-token - Lấy GitHub token đã lưu cho project
router.get('/:id/github-token', checkProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT personal_access_token, git_provider, repository
      FROM projects 
      WHERE id = $1 AND is_delete = false
    `;
    
    const result = await pool.query(query, [id]);
    
    const project = result.rows[0];
    
    if (!project.personal_access_token) {
      return res.status(404).json({
        success: false,
        error: 'No GitHub token found for this project'
      });
    }
    
    // Giải mã token để trả về
    const decryptedToken = decryptToken(project.personal_access_token);
    
    if (!decryptedToken) {
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt GitHub token'
      });
    }
    
    res.json({
      success: true,
      token: decryptedToken,
      gitProvider: project.git_provider,
      repository: project.repository
    });
    
  } catch (error) {
    logger.error('Error getting GitHub token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
