import express from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import axios from 'axios';
import { pool } from '../db/init.js';
import { decryptToken } from '../utils/tokenEncryption.js';

const router = express.Router();

/**
 * @swagger
 * /api/git/providers:
 *   get:
 *     summary: Get available git providers
 *     description: Retrieve list of all available git providers
 *     tags: [Git Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Git providers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "github"
 *                       displayName:
 *                         type: string
 *                         example: "GitHub"
 *                       domain:
 *                         type: string
 *                         example: "github.com"
 *                       isSelfhost:
 *                         type: boolean
 *                         example: false
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *       500:
 *         description: Failed to fetch git providers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/providers', ensureAuthenticated, async (req, res) => {
  try {
    const { pool } = await import('../db/init.js');
    const result = await pool.query(`
      SELECT id, name, display_name, domain, is_selfhost, is_active
      FROM git_providers 
      WHERE is_active = true 
      ORDER BY display_name
    `);
    
    res.json({
      success: true,
      providers: result.rows
    });
  } catch (error) {
    console.error('Error fetching git providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch git providers'
    });
  }
});

/**
 * @swagger
 * /api/git/connect-with-token:
 *   post:
 *     summary: Connect with personal access token
 *     description: Connect to a git provider using personal access token and retrieve user info and repositories
 *     tags: [Git Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Personal access token for the git provider
 *                 example: "ghp_xxxxxxxxxxxx"
 *               provider:
 *                 type: string
 *                 description: Git provider name
 *                 example: "github"
 *                 default: "github"
 *     responses:
 *       200:
 *         description: Successfully connected to git provider
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12345
 *                     login:
 *                       type: string
 *                       example: "username"
 *                     name:
 *                       type: string
 *                       example: "User Name"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     avatar_url:
 *                       type: string
 *                       example: "https://avatars.githubusercontent.com/u/12345"
 *                 repositories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 123456
 *                       name:
 *                         type: string
 *                         example: "my-repo"
 *                       full_name:
 *                         type: string
 *                         example: "username/my-repo"
 *                       description:
 *                         type: string
 *                         example: "My awesome repository"
 *                       private:
 *                         type: boolean
 *                         example: false
 *                       html_url:
 *                         type: string
 *                         example: "https://github.com/username/my-repo"
 *                       clone_url:
 *                         type: string
 *                         example: "https://github.com/username/my-repo.git"
 *                       default_branch:
 *                         type: string
 *                         example: "main"
 *                       language:
 *                         type: string
 *                         example: "JavaScript"
 *                       stargazers_count:
 *                         type: integer
 *                         example: 10
 *                       forks_count:
 *                         type: integer
 *                         example: 2
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 provider:
 *                   type: string
 *                   example: "github"
 *       400:
 *         description: Bad request - access token is required or unsupported provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid token or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to connect with token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/connect-with-token', ensureAuthenticated, async (req, res) => {
  try {
    const { token, provider = 'github' } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    // Validate token với GitHub API
    let userInfo, repositories;
    
    if (provider === 'github') {
      try {
        // Lấy thông tin user
        const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        userInfo = userResponse.data;

        // Lấy danh sách repositories
        const reposResponse = await axios.get('https://api.github.com/user/repos', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: {
            sort: 'updated',
            per_page: 100
          }
        });
        repositories = reposResponse.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          private: repo.private,
          html_url: repo.html_url,
          clone_url: repo.clone_url,
          default_branch: repo.default_branch,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          updated_at: repo.updated_at
        }));

      } catch (githubError) {
        console.error('GitHub API error:', githubError.response?.data || githubError.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid GitHub token or insufficient permissions'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported git provider'
      });
    }

    res.json({
      success: true,
      user: userInfo,
      repositories: repositories,
      provider: provider
    });
  } catch (error) {
    console.error('Error connecting with token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect with token'
    });
  }
});

// Get repositories (mock data for now)
router.get('/repositories', ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken, domain, provider } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    // Mock repository data
    const mockRepos = [
      {
        id: 1,
        name: 'sample-project',
        full_name: 'username/sample-project',
        description: 'A sample project for testing',
        private: false,
        html_url: 'https://github.com/username/sample-project',
        clone_url: 'https://github.com/username/sample-project.git',
        default_branch: 'main'
      },
      {
        id: 2,
        name: 'test-app',
        full_name: 'username/test-app',
        description: 'Test application',
        private: true,
        html_url: 'https://github.com/username/test-app',
        clone_url: 'https://github.com/username/test-app.git',
        default_branch: 'develop'
      }
    ];
    
    res.json({
      success: true,
      repositories: mockRepos
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch repositories'
    });
  }
});

/**
 * @swagger
 * /api/git/repos/{owner}/{repo}/branches:
 *   post:
 *     summary: Get repository branches
 *     description: Retrieve all branches for a specific repository
 *     tags: [Git Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository owner username
 *         example: "username"
 *       - in: path
 *         name: repo
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository name
 *         example: "my-repo"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - githubToken
 *             properties:
 *               githubToken:
 *                 type: string
 *                 description: GitHub personal access token
 *                 example: "ghp_xxxxxxxxxxxx"
 *     responses:
 *       200:
 *         description: Repository branches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 branches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "main"
 *                       commitSha:
 *                         type: string
 *                         example: "abc123def456"
 *                       protection:
 *                         type: boolean
 *                         example: false
 *       400:
 *         description: Bad request - GitHub token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Failed to fetch branches from GitHub
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch branches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/repos/:owner/:repo/branches', ensureAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { githubToken } = req.body;
    
    if (!githubToken) {
      return res.status(400).json({
        success: false,
        error: 'GitHub token is required'
      });
    }

    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const branches = response.data.map(branch => ({
        name: branch.name,
        commitSha: branch.commit?.sha,
        protection: branch.protection?.enabled || false
      }));

      res.json({
        success: true,
        branches: branches
      });
    } catch (githubError) {
      console.error('GitHub API error:', githubError.response?.data || githubError.message);
      return res.status(401).json({
        success: false,
        error: 'Failed to fetch branches from GitHub'
      });
    }
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branches'
    });
  }
});

/**
 * @swagger
 * /api/git/projects/{projectId}/branches:
 *   get:
 *     summary: Get repository branches for a specific project
 *     description: Retrieve all branches for a project's Git repository using stored credentials
 *     tags: [Git Integration]
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
 *     responses:
 *       200:
 *         description: Repository branches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 branches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "main"
 *                       commitSha:
 *                         type: string
 *                         example: "abc123def456"
 *                       protection:
 *                         type: boolean
 *                         example: false
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     repository:
 *                       type: string
 *                       example: "https://github.com/user/repo"
 *                     gitProvider:
 *                       type: string
 *                       example: "github"
 *       400:
 *         description: Bad request - project not configured or invalid URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Failed to fetch branches from GitHub - token may be invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch branches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/projects/:projectId/branches', ensureAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Check if user has access to this project
    const projectQuery = `
      SELECT p.id, p.repo_url, p.personal_access_token, p.git_provider_id, gp.name as git_provider_name
      FROM projects p
      LEFT JOIN git_providers gp ON p.git_provider_id = gp.id
      WHERE p.id = $1 AND p.is_delete = FALSE 
      AND (p.owner_id = $2 OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = $2
      ))
    `;
    
    const projectResult = await pool.query(projectQuery, [projectId, userId]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }
    
    const project = projectResult.rows[0];
    
    if (!project.repo_url || !project.personal_access_token) {
      return res.status(400).json({
        success: false,
        error: 'Project does not have Git repository configured'
      });
    }
    
    // Extract owner and repo from repository URL
    const repoUrl = project.repo_url;
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    
    if (!match) {
      return res.status(400).json({
        success: false,
        error: 'Invalid repository URL format'
      });
    }
    
    const [, owner, repoName] = match;
    
    // Giải mã token trước khi sử dụng
    const decryptedToken = decryptToken(project.personal_access_token);
    
    if (!decryptedToken) {
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt personal access token'
      });
    }
    
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
        headers: {
          'Authorization': `token ${decryptedToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const branches = response.data.map(branch => ({
        name: branch.name,
        commitSha: branch.commit?.sha,
        protection: branch.protection?.enabled || false
      }));

      res.json({
        success: true,
        branches: branches,
        project: {
          id: project.id,
          repository: project.repo_url,
          gitProvider: project.git_provider_name
        }
      });
    } catch (githubError) {
      console.error('GitHub API error:', githubError.response?.data || githubError.message);
      return res.status(401).json({
        success: false,
        error: 'Failed to fetch branches from GitHub. Token may be invalid or expired.'
      });
    }
  } catch (error) {
    console.error('Error fetching project branches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branches'
    });
  }
});

// Validate Git access token
router.post('/validate-token', ensureAuthenticated, async (req, res) => {
  try {
    const { accessToken, domain, provider } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    // Mock validation - in real implementation, this would validate with the Git provider
    res.json({
      success: true,
      message: 'Token validated successfully',
      provider: provider || 'unknown',
      domain: domain || 'unknown'
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate token'
    });
  }
});

export default router;
