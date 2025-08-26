import express from 'express';
import { logger } from '../utils/logger.js';
import { getDiffTool } from '../tools/github.js';
import { runCiTool } from '../tools/docker.js';
import { getCoverageTool } from '../tools/coverage.js';
import { notifyTool } from '../tools/notify.js';
import { validateToolRequest } from '../utils/validation.js';

const router = express.Router();

// Middleware để log tất cả requests
router.use((req, res, next) => {
  const traceId = req.auth?.traceId || 'unknown';
  logger.info('Tool request received', {
    traceId,
    method: req.method,
    url: req.originalUrl,
    tool: req.path.replace('/', ''),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

/**
 * @swagger
 * /tools:
 *   get:
 *     summary: Liệt kê tất cả tools có sẵn
 *     description: Trả về danh sách các tools và thông tin cơ bản
 *     tags: [Tools]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       endpoint:
 *                         type: string
 *                       method:
 *                         type: string
 *                       schema:
 *                         type: object
 *                 count:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 traceId:
 *                   type: string
 */
router.get('/', (req, res) => {
  const tools = [
    {
      name: 'get_diff',
      description: 'Lấy diff từ GitHub API',
      endpoint: '/tools/get_diff',
      method: 'POST',
      schema: {
        repo: 'string (org/name)',
        commitId: 'string',
        paths: 'array (optional)',
        maxPatchBytes: 'number (optional)'
      }
    },
    {
      name: 'run_ci',
      description: 'Chạy test trong Docker sandbox',
      endpoint: '/tools/run_ci',
      method: 'POST',
      schema: {
        projectId: 'string',
        testPlan: 'string',
        runner: 'object',
        artifacts: 'array',
        timeoutSec: 'number (optional)'
      }
    },
    {
      name: 'get_coverage',
      description: 'Phân tích coverage report',
      endpoint: '/tools/get_coverage',
      method: 'POST',
      schema: {
        reportId: 'string',
        format: 'string (lcov|cobertura)'
      }
    },
    {
      name: 'notify',
      description: 'Gửi thông báo qua Slack/GitHub',
      endpoint: '/tools/notify',
      method: 'POST',
      schema: {
        channel: 'string',
        message: 'string',
        level: 'string (info|warning|error)'
      }
    }
  ];

  logger.info('Tools list requested', {
    traceId: req.auth?.traceId || 'unknown',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    toolsCount: tools.length,
    timestamp: new Date().toISOString()
  });

  res.json({
    tools,
    count: tools.length,
    timestamp: new Date().toISOString(),
    traceId: req.auth?.traceId || 'unknown'
  });
});

/**
 * @swagger
 * /tools/get_diff:
 *   post:
 *     summary: Lấy diff từ GitHub API
 *     description: Lấy thông tin diff giữa các commits từ GitHub repository
 *     tags: [Tools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - repo
 *               - commitId
 *             properties:
 *               repo:
 *                 type: string
 *                 description: Repository name (org/name)
 *                 example: "microsoft/vscode"
 *               commitId:
 *                 type: string
 *                 description: Commit hash
 *                 example: "abc123def456"
 *               paths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Filter paths (optional)
 *                 example: ["src/", "tests/"]
 *               maxPatchBytes:
 *                 type: number
 *                 description: Max patch size in bytes (optional)
 *                 example: 262144
 *     responses:
 *       200:
 *         description: Diff data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToolResponse'
 *       400:
 *         description: Validation error or missing GitHub token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Tool execution error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/get_diff', async (req, res) => {
  try {
    const traceId = req.auth?.traceId || 'unknown';
    
    // Validate input
    const validation = validateToolRequest('get_diff', req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.errors.join(', '),
        traceId,
        timestamp: new Date().toISOString()
      });
    }

    // Lấy token từ header (sẽ được truyền từ orchestrator)
    const githubToken = req.headers['x-github-token'] || req.body.githubToken;
    if (!githubToken) {
      return res.status(400).json({
        error: 'Missing GitHub Token',
        message: 'GitHub token is required for this operation',
        traceId,
        timestamp: new Date().toISOString()
      });
    }

    const result = await getDiffTool(req.body, githubToken, traceId);
    
    res.json({
      success: true,
      data: result,
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('get_diff tool error', {
      error: error.message,
      traceId: req.auth?.traceId || 'unknown',
      requestBody: req.body,
      endpoint: '/tools/get_diff',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Tool Execution Error',
      message: error.message,
      traceId: req.auth?.traceId || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /tools/run_ci:
 *   post:
 *     summary: Chạy test trong Docker sandbox
 *     description: Thực thi test cases trong môi trường Docker an toàn
 *     tags: [Tools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - testPlan
 *               - runner
 *               - artifacts
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: Project ID
 *                 example: "p-123"
 *               testPlan:
 *                 type: string
 *                 description: Test plan description
 *                 example: "Run unit tests for user service"
 *               runner:
 *                 type: object
 *                 description: Docker runner configuration
 *                 properties:
 *                   image:
 *                     type: string
 *                     example: "node:20"
 *                   workdir:
 *                     type: string
 *                     example: "/app"
 *                   cmd:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["npm", "test"]
 *               artifacts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Artifacts to collect
 *                 example: ["junit.xml", "coverage/"]
 *               timeoutSec:
 *                 type: number
 *                 description: Timeout in seconds (optional)
 *                 example: 900
 *     responses:
 *       200:
 *         description: CI run started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToolResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Tool execution error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/run_ci', async (req, res) => {
  try {
    const traceId = req.auth?.traceId || 'unknown';
    
    // Validate input
    const validation = validateToolRequest('run_ci', req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.errors.join(', '),
        traceId,
        timestamp: new Date().toISOString()
      });
    }

    const result = await runCiTool(req.body, traceId);
    
    res.json({
      success: true,
      data: result,
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('run_ci tool error', {
      error: error.message,
      traceId: req.auth?.traceId || 'unknown',
      requestBody: req.body,
      endpoint: '/tools/run_ci',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Tool Execution Error',
      message: error.message,
      traceId: req.auth?.traceId || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /tools/get_coverage:
 *   post:
 *     summary: Phân tích coverage report
 *     description: Phân tích và trả về thông tin coverage từ test reports
 *     tags: [Tools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportId
 *               - format
 *             properties:
 *               reportId:
 *                 type: string
 *                 description: Report ID
 *                 example: "cov-2024-01-20-001"
 *               format:
 *                 type: string
 *                 description: Report format
 *                 enum: [lcov, cobertura]
 *                 example: "lcov"
 *     responses:
 *       200:
 *         description: Coverage analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToolResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Tool execution error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/get_coverage', async (req, res) => {
  try {
    const traceId = req.auth?.traceId || 'unknown';
    
    // Validate input
    const validation = validateToolRequest('get_coverage', req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.errors.join(', '),
        traceId,
        timestamp: new Date().toISOString()
      });
    }

    const result = await getCoverageTool(req.body, traceId);
    
    res.json({
      success: true,
      data: result,
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('get_coverage tool error', {
      error: error.message,
      traceId: req.auth?.traceId || 'unknown',
      requestBody: req.body,
      endpoint: '/tools/get_coverage',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Tool Execution Error',
      message: error.message,
      traceId: req.auth?.traceId || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /tools/notify:
 *   post:
 *     summary: Gửi thông báo qua Slack/GitHub
 *     description: Gửi thông báo qua các kênh khác nhau
 *     tags: [Tools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *               - message
 *               - level
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Notification channel
 *                 example: "slack:#qa-alerts"
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: "Test run completed successfully"
 *               level:
 *                 type: string
 *                 description: Message level
 *                 enum: [info, warning, error]
 *                 example: "info"
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToolResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Tool execution error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/notify', async (req, res) => {
  try {
    const traceId = req.auth?.traceId || 'unknown';
    
    // Validate input
    const validation = validateToolRequest('notify', req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.errors.join(', '),
        traceId,
        timestamp: new Date().toISOString()
      });
    }

    // Lấy tokens từ header (sẽ được truyền từ orchestrator)
    const slackWebhook = req.headers['x-slack-webhook'] || req.body.slackWebhook;
    const githubToken = req.headers['x-github-token'] || req.body.githubToken;

    const result = await notifyTool(req.body, { slackWebhook, githubToken }, traceId);
    
    res.json({
      success: true,
      data: result,
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('notify tool error', {
      error: error.message,
      traceId: req.auth?.traceId || 'unknown',
      requestBody: req.body,
      endpoint: '/tools/notify',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: 'Tool Execution Error',
      message: error.message,
      traceId: req.auth?.traceId || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /tools/{toolName}:
 *   get:
 *     summary: Thông tin chi tiết về tool
 *     description: Lấy thông tin chi tiết về một tool cụ thể
 *     tags: [Tools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: toolName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên của tool
 *         example: "get_diff"
 *     responses:
 *       200:
 *         description: Tool information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tool:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     usage:
 *                       type: string
 *                     parameters:
 *                       type: object
 *                     example:
 *                       type: object
 *                 traceId:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Tool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:toolName', (req, res) => {
  const { toolName } = req.params;
  const traceId = req.auth?.traceId || 'unknown';

  const toolInfo = {
    get_diff: {
      name: 'get_diff',
      description: 'Lấy diff từ GitHub API',
      usage: 'POST /tools/get_diff',
      parameters: {
        repo: { type: 'string', required: true, description: 'Repository name (org/name)' },
        commitId: { type: 'string', required: true, description: 'Commit hash' },
        paths: { type: 'array', required: false, description: 'Filter paths' },
        maxPatchBytes: { type: 'number', required: false, description: 'Max patch size' }
      },
      example: {
        repo: 'microsoft/vscode',
        commitId: 'abc123def456',
        paths: ['src/', 'tests/'],
        maxPatchBytes: 262144
      }
    },
    run_ci: {
      name: 'run_ci',
      description: 'Chạy test trong Docker sandbox',
      usage: 'POST /tools/run_ci',
      parameters: {
        projectId: { type: 'string', required: true, description: 'Project ID' },
        testPlan: { type: 'string', required: true, description: 'Test plan description' },
        runner: { type: 'object', required: true, description: 'Docker runner config' },
        artifacts: { type: 'array', required: true, description: 'Artifacts to collect' },
        timeoutSec: { type: 'number', required: false, description: 'Timeout in seconds' }
      },
      example: {
        projectId: 'p-123',
        testPlan: 'Run unit tests for user service',
        runner: {
          image: 'node:20',
          workdir: '/app',
          cmd: ['npm', 'test']
        },
        artifacts: ['junit.xml', 'coverage/'],
        timeoutSec: 900
      }
    },
    get_coverage: {
      name: 'get_coverage',
      description: 'Phân tích coverage report',
      usage: 'POST /tools/get_coverage',
      parameters: {
        reportId: { type: 'string', required: true, description: 'Report ID' },
        format: { type: 'string', required: true, description: 'Report format' }
      },
      example: {
        reportId: 'cov-2024-01-20-001',
        format: 'lcov'
      }
    },
    notify: {
      name: 'notify',
      description: 'Gửi thông báo qua Slack/GitHub',
      usage: 'POST /tools/notify',
      parameters: {
        channel: { type: 'string', required: true, description: 'Notification channel' },
        message: { type: 'string', required: true, description: 'Message content' },
        level: { type: 'string', required: true, description: 'Message level' }
      },
      example: {
        channel: 'slack:#qa-alerts',
        message: 'Test run completed successfully',
        level: 'info'
      }
    }
  };

  if (!toolInfo[toolName]) {
    return res.status(404).json({
      error: 'Tool Not Found',
      message: `Tool '${toolName}' not found`,
      availableTools: Object.keys(toolInfo),
      traceId,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    tool: toolInfo[toolName],
    traceId,
    timestamp: new Date().toISOString()
  });
});

export { router as toolsRouter };
