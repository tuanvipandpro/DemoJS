import express from 'express';
import { logger } from '../utils/logger.js';
import { pool } from '../db/init.js';
import { ensureAuthenticated, checkProjectAccessById } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(ensureAuthenticated);

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:3002';

/**
 * GET /api/runs - Lấy danh sách agent runs
 */
router.get('/', async (req, res) => {
  try {
    const { 
      projectId, 
      status, 
      limit = 50, 
      offset = 0,
      userId,
      startDate,
      endDate
    } = req.query;
    
    let query = `
      SELECT 
        ar.id, ar.project_id, ar.user_id, ar.status, ar.state, ar.commit_id, 
        ar.branch, ar.diff_summary, ar.test_plan, ar.test_results, ar.coverage,
        ar.confidence_score, ar.error_message, ar.created_at, ar.updated_at,
        p.name as project_name, p.repository as project_repository,
        u.email as user_email
      FROM agent_runs ar
      LEFT JOIN projects p ON ar.project_id = p.id
      LEFT JOIN users u ON ar.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (projectId) {
      query += ` AND ar.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND ar.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (userId) {
      query += ` AND ar.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (startDate) {
      query += ` AND ar.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND ar.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Kiểm tra quyền truy cập project nếu có projectId
    if (projectId) {
      const hasAccess = await checkProjectAccess(req.user.id, projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to project'
        });
      }
    }
    
    query += ` ORDER BY ar.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      runs: result.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        projectName: row.project_name,
        projectRepository: row.project_repository,
        userId: row.user_id,
        userEmail: row.user_email,
        status: row.status,
        state: row.state,
        commitId: row.commit_id,
        branch: row.branch,
        diffSummary: row.diff_summary,
        testPlan: row.test_plan,
        testResults: row.test_results,
        coverage: row.coverage,
        confidenceScore: row.confidence_score,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching agent runs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/runs/:id - Lấy chi tiết agent run
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ar.id, ar.project_id, ar.user_id, ar.status, ar.state, ar.commit_id, 
        ar.branch, ar.diff_summary, ar.test_plan, ar.test_results, ar.coverage,
        ar.confidence_score, ar.error_message, ar.created_at, ar.updated_at,
        p.name as project_name, p.repository as project_repository,
        u.email as user_email
      FROM agent_runs ar
      LEFT JOIN projects p ON ar.project_id = p.id
      LEFT JOIN users u ON ar.user_id = u.id
      WHERE ar.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent run not found'
      });
    }
    
    const run = result.rows[0];
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, run.project_id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    res.json({
      success: true,
      run: {
        id: run.id,
        projectId: run.project_id,
        projectName: run.project_name,
        projectRepository: run.project_repository,
        userId: run.user_id,
        userEmail: run.user_email,
        status: run.status,
        state: run.state,
        commitId: run.commit_id,
        branch: run.branch,
        diffSummary: run.diff_summary,
        testPlan: run.test_plan,
        testResults: run.test_results,
        coverage: run.coverage,
        confidenceScore: run.confidence_score,
        errorMessage: run.error_message,
        createdAt: run.created_at,
        updatedAt: run.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching agent run:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/runs - Tạo agent run mới
 */
router.post('/', async (req, res) => {
  try {
    const { 
      projectId, 
      commitId, 
      branch, 
      diffSummary,
      priority = 'normal'
    } = req.body;
    
    // Validation
    if (!projectId || !commitId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and commit ID are required'
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
    
    // Kiểm tra project có tồn tại không
    const projectResult = await pool.query(`
      SELECT id, name, repository FROM projects WHERE id = $1 AND is_delete = false
    `, [projectId]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Tạo agent run trong database
    const runResult = await pool.query(`
      INSERT INTO agent_runs (
        project_id, user_id, status, state, commit_id, branch, 
        diff_summary, priority, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `, [
      projectId, 
      req.user.id, 
      'queued', 
      'QUEUED', 
      commitId, 
      branch || 'main',
      diffSummary || null,
      priority
    ]);
    
    const runId = runResult.rows[0].id;
    
    // Enqueue message vào worker queue
    let enqueueResult = null;
    
    try {
      const response = await axios.post(`${WORKER_URL}/queue/enqueue`, {
        type: 'agent_run',
        data: {
          runId,
          projectId,
          userId: req.user.id,
          commitId,
          branch: branch || 'main',
          diffSummary,
          priority
        },
        priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2
      }, { timeout: 10000 });
      
      enqueueResult = response.data;
    } catch (error) {
      logger.warn('Failed to enqueue message to worker:', error.message);
      // Cập nhật status thành failed nếu không thể enqueue
      await pool.query(`
        UPDATE agent_runs 
        SET status = 'failed', error_message = $1, updated_at = NOW()
        WHERE id = $2
      `, [`Failed to enqueue: ${error.message}`, runId]);
    }
    
    res.status(201).json({
      success: true,
      message: 'Agent run created and queued successfully',
      run: {
        id: runId,
        projectId,
        userId: req.user.id,
        status: 'queued',
        state: 'QUEUED',
        commitId,
        branch: branch || 'main',
        diffSummary,
        priority,
        createdAt: new Date().toISOString()
      },
      enqueueResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error creating agent run:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/runs/:id/status - Cập nhật trạng thái agent run
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, state, errorMessage, testResults, coverage, confidenceScore } = req.body;
    
    // Kiểm tra agent run có tồn tại không
    const runResult = await pool.query(`
      SELECT project_id FROM agent_runs WHERE id = $1
    `, [id]);
    
    if (runResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent run not found'
      });
    }
    
    const run = runResult.rows[0];
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, run.project_id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Cập nhật trạng thái
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(status);
      paramIndex++;
    }
    
    if (state) {
      updateFields.push(`state = $${paramIndex}`);
      updateValues.push(state);
      paramIndex++;
    }
    
    if (errorMessage !== undefined) {
      updateFields.push(`error_message = $${paramIndex}`);
      updateValues.push(errorMessage);
      paramIndex++;
    }
    
    if (testResults !== undefined) {
      updateFields.push(`test_results = $${paramIndex}`);
      updateValues.push(JSON.stringify(testResults));
      paramIndex++;
    }
    
    if (coverage !== undefined) {
      updateFields.push(`coverage = $${paramIndex}`);
      updateValues.push(coverage);
      paramIndex++;
    }
    
    if (confidenceScore !== undefined) {
      updateFields.push(`confidence_score = $${paramIndex}`);
      updateValues.push(confidenceScore);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);
    
    const query = `
      UPDATE agent_runs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, updateValues);
    
    res.json({
      success: true,
      message: 'Agent run status updated successfully',
      run: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating agent run status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/runs/:id - Xóa agent run
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra agent run có tồn tại không
    const runResult = await pool.query(`
      SELECT project_id FROM agent_runs WHERE id = $1
    `, [id]);
    
    if (runResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent run not found'
      });
    }
    
    const run = runResult.rows[0];
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, run.project_id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Soft delete
    await pool.query(`
      UPDATE agent_runs 
      SET is_delete = true, updated_at = NOW()
      WHERE id = $1
    `, [id]);
    
    res.json({
      success: true,
      message: 'Agent run deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting agent run:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/runs/:id/logs - Lấy logs của agent run
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    // Kiểm tra agent run có tồn tại không
    const runResult = await pool.query(`
      SELECT project_id FROM agent_runs WHERE id = $1
    `, [id]);
    
    if (runResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent run not found'
      });
    }
    
    const run = runResult.rows[0];
    
    // Kiểm tra quyền truy cập project
    const hasAccess = await checkProjectAccessById(req.user.id, run.project_id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to project'
      });
    }
    
    // Lấy logs từ database
    const logsResult = await pool.query(`
      SELECT 
        id, run_id, level, message, metadata, created_at
      FROM run_logs
      WHERE run_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);
    
    res.json({
      success: true,
      runId: id,
      logs: logsResult.rows.map(log => ({
        id: log.id,
        runId: log.run_id,
        level: log.level,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.created_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: logsResult.rows.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching run logs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/runs/stats/summary - Lấy thống kê tổng quan
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { range = '7d', projectId } = req.query;
    
    let timeFilter = '';
    let params = [];
    let paramIndex = 1;
    
    switch (range) {
      case '1d':
        timeFilter = `AND created_at >= NOW() - INTERVAL '1 day'`;
        break;
      case '7d':
        timeFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case '30d':
        timeFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case '90d':
        timeFilter = `AND created_at >= NOW() - INTERVAL '90 days'`;
        break;
      default:
        timeFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
    }
    
    let projectFilter = '';
    if (projectId) {
      projectFilter = `AND project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
      
      // Kiểm tra quyền truy cập project
      const hasAccess = await checkProjectAccessById(req.user.id, projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to project'
        });
      }
    }
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_runs,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_runs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
        AVG(confidence_score) as avg_confidence,
        AVG(coverage) as avg_coverage
      FROM agent_runs
      WHERE 1=1 ${timeFilter} ${projectFilter}
    `, params);
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      range,
      projectId: projectId || null,
      statistics: {
        totalRuns: parseInt(stats.total_runs) || 0,
        queuedRuns: parseInt(stats.queued_runs) || 0,
        runningRuns: parseInt(stats.running_runs) || 0,
        completedRuns: parseInt(stats.completed_runs) || 0,
        failedRuns: parseInt(stats.failed_runs) || 0,
        avgConfidence: parseFloat(stats.avg_confidence) || 0,
        avgCoverage: parseFloat(stats.avg_coverage) || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching run statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
