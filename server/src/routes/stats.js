import express from 'express';
import { logger } from '../utils/logger.js';
import { pool } from '../db/init.js';

const router = express.Router();

// GET /api/stats/summary?range=7d
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

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN state = 'SUCCESS' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failed_runs,
        COUNT(CASE WHEN state = 'RUNNING' THEN 1 END) as running_runs,
        COUNT(CASE WHEN state = 'QUEUED' THEN 1 END) as queued_runs,
        AVG(CASE WHEN finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (finished_at - created_at)) END) as avg_duration_seconds,
        COUNT(DISTINCT project_id) as active_projects
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
        COUNT(CASE WHEN state = 'SUCCESS' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failed_runs
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
        COUNT(CASE WHEN r.state = 'SUCCESS' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN r.state = 'FAILED' THEN 1 END) as failed_runs,
        ROUND(
          COUNT(CASE WHEN r.state = 'SUCCESS' THEN 1 END)::decimal / 
          NULLIF(COUNT(r.id), 0) * 100, 2
        ) as success_rate
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
        END as duration_seconds
      FROM runs r
      JOIN projects p ON r.project_id = p.id
      WHERE r.created_at >= $1
      ORDER BY r.created_at DESC
      LIMIT 20
    `;

    const recentActivityResult = await pool.query(recentActivityQuery, [cutoffDate]);

    const response = {
      range,
      summary: {
        total_runs: parseInt(summary.total_runs) || 0,
        successful_runs: parseInt(summary.successful_runs) || 0,
        failed_runs: parseInt(summary.failed_runs) || 0,
        running_runs: parseInt(summary.running_runs) || 0,
        queued_runs: parseInt(summary.queued_runs) || 0,
        success_rate: summary.total_runs > 0 
          ? Math.round((summary.successful_runs / summary.total_runs) * 100) 
          : 0,
        avg_duration_minutes: summary.avg_duration_seconds 
          ? Math.round(summary.avg_duration_seconds / 60) 
          : 0,
        active_projects: parseInt(summary.active_projects) || 0
      },
      daily_runs: dailyRunsResult.rows.map(row => ({
        date: row.date,
        total_runs: parseInt(row.total_runs),
        successful_runs: parseInt(row.successful_runs),
        failed_runs: parseInt(row.failed_runs)
      })),
      project_performance: projectPerformanceResult.rows.map(row => ({
        project_name: row.project_name,
        total_runs: parseInt(row.total_runs),
        successful_runs: parseInt(row.successful_runs),
        failed_runs: parseInt(row.failed_runs),
        success_rate: parseFloat(row.success_rate) || 0
      })),
      recent_activity: recentActivityResult.rows.map(row => ({
        id: row.id,
        state: row.state,
        created_at: row.created_at,
        finished_at: row.finished_at,
        project_name: row.project_name,
        duration_minutes: row.duration_seconds 
          ? Math.round(row.duration_seconds / 60) 
          : null
      }))
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching stats summary:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/stats/projects/:id/summary
router.get('/projects/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const { range = '7d' } = req.query;
    
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

    // Get project-specific statistics
    const projectStatsQuery = `
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN state = 'SUCCESS' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failed_runs,
        COUNT(CASE WHEN state = 'RUNNING' THEN 1 END) as running_runs,
        AVG(CASE WHEN finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (finished_at - created_at)) END) as avg_duration_seconds,
        MIN(created_at) as first_run,
        MAX(created_at) as last_run
      FROM runs 
      WHERE project_id = $1 AND created_at >= $2
    `;

    const projectStatsResult = await pool.query(projectStatsQuery, [id, cutoffDate]);
    const projectStats = projectStatsResult.rows[0];

    // Get daily run counts for this project
    const dailyRunsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN state = 'SUCCESS' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failed_runs
      FROM runs 
      WHERE project_id = $1 AND created_at >= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const dailyRunsResult = await pool.query(dailyRunsQuery, [id, cutoffDate]);

    // Get run history
    const runHistoryQuery = `
      SELECT 
        id,
        state,
        created_at,
        finished_at,
        CASE 
          WHEN finished_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (finished_at - created_at))
          ELSE NULL
        END as duration_seconds
      FROM runs 
      WHERE project_id = $1 AND created_at >= $2
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const runHistoryResult = await pool.query(runHistoryQuery, [id, cutoffDate]);

    const response = {
      project_id: id,
      range,
      summary: {
        total_runs: parseInt(projectStats.total_runs) || 0,
        successful_runs: parseInt(projectStats.successful_runs) || 0,
        failed_runs: parseInt(projectStats.failed_runs) || 0,
        running_runs: parseInt(projectStats.running_runs) || 0,
        success_rate: projectStats.total_runs > 0 
          ? Math.round((projectStats.successful_runs / projectStats.total_runs) * 100) 
          : 0,
        avg_duration_minutes: projectStats.avg_duration_seconds 
          ? Math.round(projectStats.avg_duration_seconds / 60) 
          : 0,
        first_run: projectStats.first_run,
        last_run: projectStats.last_run
      },
      daily_runs: dailyRunsResult.rows.map(row => ({
        date: row.date,
        total_runs: parseInt(row.total_runs),
        successful_runs: parseInt(row.successful_runs),
        failed_runs: parseInt(row.failed_runs)
      })),
      run_history: runHistoryResult.rows.map(row => ({
        id: row.id,
        state: row.state,
        created_at: row.created_at,
        finished_at: row.finished_at,
        duration_minutes: row.duration_seconds 
          ? Math.round(row.duration_seconds / 60) 
          : null
      }))
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching project stats:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/stats/trends
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    // Get trend data
    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN state = 'SUCCESS' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failed_runs,
        AVG(CASE WHEN finished_at IS NOT NULL THEN EXTRACT(EPOCH FROM (finished_at - created_at)) END) as avg_duration_seconds
      FROM runs 
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const trendsResult = await pool.query(trendsQuery, [cutoffDate]);

    // Calculate moving averages
    const trends = trendsResult.rows.map((row, index) => {
      const data = {
        date: row.date,
        total_runs: parseInt(row.total_runs),
        successful_runs: parseInt(row.successful_runs),
        failed_runs: parseInt(row.failed_runs),
        success_rate: row.total_runs > 0 
          ? Math.round((row.successful_runs / row.total_runs) * 100) 
          : 0,
        avg_duration_minutes: row.avg_duration_seconds 
          ? Math.round(row.avg_duration_seconds / 60) 
          : 0
      };

      // Calculate 7-day moving average for success rate
      if (index >= 6) {
        const weekData = trendsResult.rows.slice(index - 6, index + 1);
        const weekSuccessRate = weekData.reduce((sum, day) => {
          const daySuccessRate = day.total_runs > 0 
            ? (day.successful_runs / day.total_runs) * 100 
            : 0;
          return sum + daySuccessRate;
        }, 0) / 7;
        data.moving_avg_success_rate = Math.round(weekSuccessRate);
      }

      return data;
    });

    res.json({
      days: parseInt(days),
      trends
    });
  } catch (error) {
    logger.error('Error fetching trends:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

export default router;
