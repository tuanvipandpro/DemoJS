import express from 'express';
import { logger } from '../utils/logger.js';
import { pool } from '../db/init.js';

const router = express.Router();

/**
 * @swagger
 * /api/stats/summary:
 *   get:
 *     summary: Get system statistics summary
 *     description: Retrieve comprehensive statistics about test runs, projects, and system performance
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time range for statistics
 *         example: "7d"
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 range:
 *                   type: string
 *                   example: "7d"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalRuns:
 *                       type: integer
 *                       example: 150
 *                     successfulRuns:
 *                       type: integer
 *                       example: 120
 *                     failedRuns:
 *                       type: integer
 *                       example: 20
 *                     runningRuns:
 *                       type: integer
 *                       example: 5
 *                     queuedRuns:
 *                       type: integer
 *                       example: 3
 *                     planningRuns:
 *                       type: integer
 *                       example: 2
 *                     proposalsRuns:
 *                       type: integer
 *                       example: 0
 *                     avgDurationSeconds:
 *                       type: number
 *                       format: float
 *                       example: 45.5
 *                     activeProjects:
 *                       type: integer
 *                       example: 10
 *                     avgConfidenceScore:
 *                       type: number
 *                       format: float
 *                       example: 0.85
 *                 dailyRuns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       totalRuns:
 *                         type: integer
 *                         example: 20
 *                       successfulRuns:
 *                         type: integer
 *                         example: 18
 *                       failedRuns:
 *                         type: integer
 *                         example: 2
 *                 projectPerformance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       projectName:
 *                         type: string
 *                         example: "My Test Project"
 *                       totalRuns:
 *                         type: integer
 *                         example: 50
 *                       successfulRuns:
 *                         type: integer
 *                         example: 45
 *                       failedRuns:
 *                         type: integer
 *                         example: 5
 *                       successRate:
 *                         type: number
 *                         format: float
 *                         example: 90.0
 *                       avgConfidence:
 *                         type: number
 *                         format: float
 *                         example: 0.88
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       state:
 *                         type: string
 *                         example: "completed"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       finishedAt:
 *                         type: string
 *                         format: date-time
 *                       projectName:
 *                         type: string
 *                         example: "My Test Project"
 *                       durationSeconds:
 *                         type: number
 *                         format: float
 *                         example: 45.5
 *                       confidenceScore:
 *                         type: number
 *                         format: float
 *                         example: 0.85
 *                 decisionStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       decision:
 *                         type: string
 *                         example: "commit"
 *                       count:
 *                         type: integer
 *                         example: 25
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/summary', async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    // Parse range parameter
    let days;
    switch (range) {
      case '24h':
        days = 1;
        break;
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 7;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get summary statistics from runs table
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN state = 'completed' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'failed' THEN 1 END) as failed_runs,
        COUNT(CASE WHEN state = 'executing' THEN 1 END) as running_runs,
        COUNT(CASE WHEN state = 'queued' THEN 1 END) as queued_runs,
        COUNT(CASE WHEN state = 'planning' THEN 1 END) as planning_runs,
        COUNT(CASE WHEN state = 'proposals' THEN 1 END) as proposals_runs,
        AVG(CASE WHEN finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (finished_at - created_at)) END) as avg_duration_seconds,
        COUNT(DISTINCT project_id) as active_projects,
        AVG(confidence_score) as avg_confidence_score
      FROM runs 
      WHERE created_at >= $1
    `;

    const summaryResult = await pool.query(summaryQuery, [cutoffDate]);
    const summary = summaryResult.rows[0];

    // Get daily run counts for chart
    const dailyRunsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN state = 'completed' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'failed' THEN 1 END) as failed_runs
      FROM runs 
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const dailyRunsResult = await pool.query(dailyRunsQuery, [cutoffDate]);

    // Get project performance
    const projectPerformanceQuery = `
      SELECT 
        p.name as project_name,
        COUNT(r.id) as total_runs,
        COUNT(CASE WHEN r.state = 'completed' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN r.state = 'failed' THEN 1 END) as failed_runs,
        ROUND(
          COUNT(CASE WHEN r.state = 'completed' THEN 1 END)::decimal / 
          NULLIF(COUNT(r.id), 0) * 100, 2
        ) as success_rate,
        AVG(r.confidence_score) as avg_confidence
      FROM projects p
      LEFT JOIN runs r ON p.id = r.project_id AND r.created_at >= $1
      GROUP BY p.id, p.name
      HAVING COUNT(r.id) > 0
      ORDER BY total_runs DESC
      LIMIT 10
    `;

    const projectPerformanceResult = await pool.query(projectPerformanceQuery, [cutoffDate]);

    // Get recent activity
    const recentActivityQuery = `
      SELECT 
        r.id,
        r.state,
        r.created_at,
        r.finished_at,
        p.name as project_name,
        CASE 
          WHEN r.finished_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (r.finished_at - r.created_at))
          ELSE NULL
        END as duration_seconds,
        r.confidence_score
      FROM runs r
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.created_at >= $1
      ORDER BY r.created_at DESC
      LIMIT 20
    `;

    const recentActivityResult = await pool.query(recentActivityQuery, [cutoffDate]);

    // Get decision statistics
    const decisionStatsQuery = `
      SELECT 
        decision,
        COUNT(*) as count
      FROM runs 
      WHERE created_at >= $1 AND decision IS NOT NULL
      GROUP BY decision
      ORDER BY count DESC
    `;

    const decisionStatsResult = await pool.query(decisionStatsQuery, [cutoffDate]);

    res.json({
      success: true,
      range,
      summary: {
        totalRuns: parseInt(summary.total_runs) || 0,
        successfulRuns: parseInt(summary.successful_runs) || 0,
        failedRuns: parseInt(summary.failed_runs) || 0,
        runningRuns: parseInt(summary.running_runs) || 0,
        queuedRuns: parseInt(summary.queued_runs) || 0,
        planningRuns: parseInt(summary.planning_runs) || 0,
        proposalsRuns: parseInt(summary.proposals_runs) || 0,
        avgDurationSeconds: parseFloat(summary.avg_duration_seconds) || 0,
        activeProjects: parseInt(summary.active_projects) || 0,
        avgConfidenceScore: parseFloat(summary.avg_confidence_score) || 0
      },
      dailyRuns: dailyRunsResult.rows.map(row => ({
        date: row.date,
        totalRuns: parseInt(row.total_runs) || 0,
        successfulRuns: parseInt(row.successful_runs) || 0,
        failedRuns: parseInt(row.failed_runs) || 0
      })),
      projectPerformance: projectPerformanceResult.rows.map(row => ({
        projectName: row.project_name,
        totalRuns: parseInt(row.total_runs) || 0,
        successfulRuns: parseInt(row.successful_runs) || 0,
        failedRuns: parseInt(row.failed_runs) || 0,
        successRate: parseFloat(row.success_rate) || 0,
        avgConfidence: parseFloat(row.avg_confidence) || 0
      })),
      recentActivity: recentActivityResult.rows.map(row => ({
        id: row.id,
        state: row.state,
        createdAt: row.created_at,
        finishedAt: row.finished_at,
        projectName: row.project_name,
        durationSeconds: parseFloat(row.duration_seconds) || null,
        confidenceScore: parseFloat(row.confidence_score) || null
      })),
      decisionStats: decisionStatsResult.rows.map(row => ({
        decision: row.decision,
        count: parseInt(row.count) || 0
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching summary statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/stats/projects/:id
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { range = '7d' } = req.query;
    
    // Parse range parameter
    let days;
    switch (range) {
      case '24h':
        days = 1;
        break;
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 7;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get project statistics
    const projectStatsQuery = `
      SELECT 
        p.name as project_name,
        p.description,
        p.repo_url,
        p.branch,
        COUNT(r.id) as total_runs,
        COUNT(CASE WHEN r.state = 'completed' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN r.state = 'failed' THEN 1 END) as failed_runs,
        COUNT(CASE WHEN r.state = 'executing' THEN 1 END) as running_runs,
        COUNT(CASE WHEN r.state = 'queued' THEN 1 END) as queued_runs,
        AVG(r.confidence_score) as avg_confidence_score,
        AVG(CASE WHEN r.finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (r.finished_at - r.created_at)) END) as avg_duration_seconds
      FROM projects p
      LEFT JOIN runs r ON p.id = r.project_id AND r.created_at >= $1
      WHERE p.id = $2
      GROUP BY p.id, p.name, p.description, p.repo_url, p.branch
    `;

    const projectStatsResult = await pool.query(projectStatsQuery, [cutoffDate, id]);
    
    if (projectStatsResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const projectStats = projectStatsResult.rows[0];

    // Get recent runs for this project
    const recentRunsQuery = `
      SELECT 
        r.id,
        r.state,
        r.commit_id,
        r.branch,
        r.created_at,
        r.finished_at,
        r.confidence_score,
        r.decision
      FROM runs r
      WHERE r.project_id = $1 AND r.created_at >= $2
      ORDER BY r.created_at DESC
      LIMIT 20
    `;

    const recentRunsResult = await pool.query(recentRunsQuery, [id, cutoffDate]);

    // Get state distribution
    const stateDistributionQuery = `
      SELECT 
        state,
        COUNT(*) as count
      FROM runs 
      WHERE project_id = $1 AND created_at >= $2
      GROUP BY state
      ORDER BY count DESC
    `;

    const stateDistributionResult = await pool.query(stateDistributionQuery, [id, cutoffDate]);

    res.json({
      success: true,
      range,
      project: {
        id: parseInt(id),
        name: projectStats.project_name,
        description: projectStats.description,
        repoUrl: projectStats.repo_url,
        branch: projectStats.branch
      },
      statistics: {
        totalRuns: parseInt(projectStats.total_runs) || 0,
        successfulRuns: parseInt(projectStats.successful_runs) || 0,
        failedRuns: parseInt(projectStats.failed_runs) || 0,
        runningRuns: parseInt(projectStats.running_runs) || 0,
        queuedRuns: parseInt(projectStats.queued_runs) || 0,
        avgConfidenceScore: parseFloat(projectStats.avg_confidence_score) || 0,
        avgDurationSeconds: parseFloat(projectStats.avg_duration_seconds) || 0
      },
      recentRuns: recentRunsResult.rows.map(row => ({
        id: row.id,
        state: row.state,
        commitId: row.commit_id,
        branch: row.branch,
        createdAt: row.created_at,
        finishedAt: row.finished_at,
        confidenceScore: parseFloat(row.confidence_score) || null,
        decision: row.decision
      })),
      stateDistribution: stateDistributionResult.rows.map(row => ({
        state: row.state,
        count: parseInt(row.count) || 0
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching project statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/stats/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { range = '7d' } = req.query;
    
    // Parse range parameter
    let days;
    switch (range) {
      case '24h':
        days = 1;
        break;
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 7;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get user statistics
    const userStatsQuery = `
      SELECT 
        u.username,
        u.email,
        u.display_name,
        COUNT(r.id) as total_runs,
        COUNT(CASE WHEN r.state = 'completed' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN r.state = 'failed' THEN 1 END) as failed_runs,
        AVG(r.confidence_score) as avg_confidence_score,
        AVG(CASE WHEN r.finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (r.finished_at - r.created_at)) END) as avg_duration_seconds
      FROM users u
      LEFT JOIN runs r ON u.id = r.user_id AND r.created_at >= $1
      WHERE u.id = $2
      GROUP BY u.id, u.username, u.email, u.display_name
    `;

    const userStatsResult = await pool.query(userStatsQuery, [cutoffDate, id]);
    
    if (userStatsResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userStats = userStatsResult.rows[0];

    // Get recent runs for this user
    const recentRunsQuery = `
      SELECT 
        r.id,
        r.state,
        r.commit_id,
        r.branch,
        r.created_at,
        r.finished_at,
        r.confidence_score,
        p.name as project_name
      FROM runs r
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.user_id = $1 AND r.created_at >= $2
      ORDER BY r.created_at DESC
      LIMIT 20
    `;

    const recentRunsResult = await pool.query(recentRunsQuery, [id, cutoffDate]);

    // Get projects this user has worked on
    const userProjectsQuery = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.description,
        p.repo_url
      FROM projects p
      INNER JOIN runs r ON p.id = r.project_id
      WHERE r.user_id = $1 AND r.created_at >= $2
      ORDER BY p.name
    `;

    const userProjectsResult = await pool.query(userProjectsQuery, [id, cutoffDate]);

    res.json({
      success: true,
      range,
      user: {
        id: parseInt(id),
        username: userStats.username,
        email: userStats.email,
        displayName: userStats.display_name
      },
      statistics: {
        totalRuns: parseInt(userStats.total_runs) || 0,
        successfulRuns: parseInt(userStats.successful_runs) || 0,
        failedRuns: parseInt(userStats.failed_runs) || 0,
        avgConfidenceScore: parseFloat(userStats.avg_confidence_score) || 0,
        avgDurationSeconds: parseFloat(userStats.avg_duration_seconds) || 0
      },
      recentRuns: recentRunsResult.rows.map(row => ({
        id: row.id,
        state: row.state,
        commitId: row.commit_id,
        branch: row.branch,
        createdAt: row.created_at,
        finishedAt: row.finished_at,
        confidenceScore: parseFloat(row.confidence_score) || null,
        projectName: row.project_name
      })),
      projects: userProjectsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        repoUrl: row.repo_url
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
