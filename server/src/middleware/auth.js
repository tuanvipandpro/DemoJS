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
    
    // Kiểm tra xem project có tồn tại và thuộc về user không
    const checkQuery = 'SELECT owner_id FROM projects WHERE id = $1 AND is_delete = false';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    if (checkResult.rows[0].owner_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own projects.'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Project access check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Access check failed'
    });
  }
}

/**
 * Function để kiểm tra quyền truy cập project
 * Sử dụng cho việc kiểm tra quyền truy cập trong code
 * @param {number} userId - ID của user
 * @param {number} projectId - ID của project
 * @returns {Promise<boolean>} True nếu có quyền truy cập
 */
export async function checkProjectAccessById(userId, projectId) {
  try {
    if (!userId || !projectId) {
      return false;
    }
    
    // Kiểm tra xem project có tồn tại và thuộc về user không
    const checkQuery = 'SELECT owner_id FROM projects WHERE id = $1 AND is_delete = false';
    const checkResult = await pool.query(checkQuery, [projectId]);
    
    if (checkResult.rows.length === 0) {
      return false;
    }
    
    return checkResult.rows[0].owner_id === userId;
  } catch (error) {
    logger.error('Project access check by ID error:', error);
    return false;
  }
}
