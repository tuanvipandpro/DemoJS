import { extractBearerToken, verifyToken } from '../utils/jwt.js';
import { pool } from '../db/init.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware để xác thực JWT token và set req.user
 */
export async function authenticateJWT(req, res, next) {
  try {
    const token = extractBearerToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    try {
      // Verify JWT token
      const payload = verifyToken(token);
      
      // Fetch user từ database để lấy thông tin đầy đủ
      const result = await pool.query(
        `SELECT id, username, email, display_name FROM users WHERE id = $1`,
        [payload.sub]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const user = result.rows[0];
      
      // Set user vào request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name
      };
      
      next();
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Middleware để kiểm tra xem user có quyền truy cập project không
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
