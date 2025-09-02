import { extractBearerToken, verifyToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { pool } from '../db/init.js';

export function ensureAuthenticated(req, res, next) {
  // JWT-based authentication only
  try {
    const token = extractBearerToken(req);
    if (token) {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, username: payload.username, provider: 'jwt' };
      return next();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  return res.status(401).json({ error: 'Unauthorized - No valid token provided' });
}

/**
 * Middleware để kiểm tra xem user có quyền truy cập project không
 * Sử dụng cho Express routes
 * Hỗ trợ project ownership và membership
 */
export async function checkProjectAccess(req, res, next) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Kiểm tra xem project có tồn tại không
    const checkQuery = 'SELECT owner_id FROM projects WHERE id = $1 AND is_delete = false';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const project = checkResult.rows[0];
    
    // Kiểm tra xem user có phải là owner không
    if (project.owner_id === currentUserId) {
      return next();
    }
    
    // Kiểm tra xem user có phải là member không
    const memberQuery = 'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2';
    const memberResult = await pool.query(memberQuery, [id, currentUserId]);
    
    if (memberResult.rows.length > 0) {
      return next();
    }
    
    // User không có quyền truy cập
    return res.status(403).json({
      success: false,
      error: 'Access denied. You do not have permission to access this project.'
    });
    
  } catch (error) {
    logger.error('Project access check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Access check failed'
    });
  }
}

/**
 * Middleware để kiểm tra xem user có quyền admin trên project không
 * Chỉ owner và admin mới có thể thực hiện các thao tác quản trị
 */
export async function checkProjectAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Kiểm tra xem project có tồn tại không
    const checkQuery = 'SELECT owner_id FROM projects WHERE id = $1 AND is_delete = false';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const project = checkResult.rows[0];
    
    // Owner luôn có quyền admin
    if (project.owner_id === currentUserId) {
      return next();
    }
    
    // Kiểm tra xem user có phải là admin không
    const memberQuery = 'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2 AND role IN ($3, $4)';
    const memberResult = await pool.query(memberQuery, [id, currentUserId, 'owner', 'admin']);
    
    if (memberResult.rows.length > 0) {
      return next();
    }
    
    // User không có quyền admin
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
    
  } catch (error) {
    logger.error('Project admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin check failed'
    });
  }
}

/**
 * Function để kiểm tra quyền truy cập project
 * Sử dụng cho việc kiểm tra quyền truy cập trong code
 * Hỗ trợ project ownership và membership
 * @param {number} userId - ID của user
 * @param {number} projectId - ID của project
 * @returns {Promise<boolean>} True nếu có quyền truy cập
 */
export async function checkProjectAccessById(userId, projectId) {
  try {
    if (!userId || !projectId) {
      return false;
    }
    
    // Kiểm tra xem project có tồn tại không
    const checkQuery = 'SELECT owner_id FROM projects WHERE id = $1 AND is_delete = false';
    const checkResult = await pool.query(checkQuery, [projectId]);
    
    if (checkResult.rows.length === 0) {
      return false;
    }
    
    const project = checkResult.rows[0];
    
    // Kiểm tra xem user có phải là owner không
    if (project.owner_id === userId) {
      return true;
    }
    
    // Kiểm tra xem user có phải là member không
    const memberQuery = 'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2';
    const memberResult = await pool.query(memberQuery, [projectId, userId]);
    
    return memberResult.rows.length > 0;
  } catch (error) {
    logger.error('Project access check by ID error:', error);
    return false;
  }
}

/**
 * Function để kiểm tra quyền admin trên project
 * @param {number} userId - ID của user
 * @param {number} projectId - ID của project
 * @returns {Promise<boolean>} True nếu có quyền admin
 */
export async function checkProjectAdminById(userId, projectId) {
  try {
    if (!userId || !projectId) {
      return false;
    }
    
    // Kiểm tra xem project có tồn tại không
    const checkQuery = 'SELECT owner_id FROM projects WHERE id = $1 AND is_delete = false';
    const checkResult = await pool.query(checkQuery, [projectId]);
    
    if (checkResult.rows.length === 0) {
      return false;
    }
    
    const project = checkResult.rows[0];
    
    // Owner luôn có quyền admin
    if (project.owner_id === userId) {
      return true;
    }
    
    // Kiểm tra xem user có phải là admin không
    const memberQuery = 'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2 AND role IN ($3, $4)';
    const memberResult = await pool.query(memberQuery, [projectId, userId, 'owner', 'admin']);
    
    return memberResult.rows.length > 0;
  } catch (error) {
    logger.error('Project admin check by ID error:', error);
    return false;
  }
}
