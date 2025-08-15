import { Router } from 'express';
import { Octokit } from '@octokit/rest';
import { ensureAuthenticated } from '../config/session.js';
import { pool } from '../db/init.js';
import { logger } from '../utils/logger.js';

const router = Router();

async function getOctokitForUser(req) {
  const tokenFromSession = req.user?.accessToken;
  if (tokenFromSession) return new Octokit({ auth: tokenFromSession });
  // Try DB stored token
  const userId = req.user?.id;
  if (!userId) return null;
  const result = await pool.query(
    `SELECT access_token FROM user_provider_tokens WHERE user_id = $1 AND provider = 'github'`,
    [userId]
  );
  const token = result.rows?.[0]?.access_token;
  return token ? new Octokit({ auth: token }) : null;
}

router.get('/repos', ensureAuthenticated, async (req, res) => {
  try {
    const octokit = await getOctokitForUser(req);
    if (!octokit) return res.status(401).json({ error: 'GitHub OAuth required' });
    const username = req.user?.username;
    const { data } = await octokit.rest.repos.listForUser({ username, per_page: 100 });
    res.json(data.map((r) => ({ name: r.name, full_name: r.full_name, private: r.private })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch repos', detail: String(e?.message || e) });
  }
});

router.get('/repos/:owner/:repo/branches', ensureAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const octokit = await getOctokitForUser(req);
    if (!octokit) return res.status(401).json({ error: 'GitHub OAuth required' });
    const { data } = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
    res.json(data.map((b) => ({ name: b.name, commitSha: b.commit?.sha })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch branches', detail: String(e?.message || e) });
  }
});

// New endpoint: Get repos using OAuth code from frontend
router.post('/repos/with-code', async (req, res) => {
  try {
    logger.info('=== GitHub OAuth Flow Started ===');
    
    // Step 1: Validate request
    const { code } = req.body || {};
    if (!code) {
      logger.error('Missing OAuth code');
      return res.status(400).json({ error: 'missing_code', message: 'OAuth code is required' });
    }
    
    logger.info(`Received OAuth code: ${code.substring(0, 10)}...`);
    
    // Step 2: Get GitHub credentials
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      logger.error('GitHub credentials not configured');
      return res.status(500).json({ 
        error: 'server_config_error', 
        message: 'GitHub OAuth not configured on server' 
      });
    }
    
    logger.info('GitHub credentials validated');
    
    // Step 3: Exchange code for access token
    logger.info('Exchanging OAuth code for access token...');
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });
    
    if (!tokenResponse.ok) {
      logger.error(`GitHub token exchange failed: ${tokenResponse.status}`);
      return res.status(400).json({ 
        error: 'token_exchange_failed', 
        message: 'Failed to exchange OAuth code for access token' 
      });
    }
    
    const tokenData = await tokenResponse.json();
    logger.info('Token exchange response received');
    
    if (!tokenData.access_token) {
      logger.error('No access token in response:', tokenData);
      return res.status(400).json({ 
        error: 'no_access_token', 
        message: 'GitHub did not return access token',
        details: tokenData
      });
    }
    
    logger.info('Access token received successfully');
    
    // Step 4: Create GitHub client with access token
    logger.info('Creating GitHub API client...');
    const octokit = new Octokit({ 
      auth: tokenData.access_token 
    });
    
    // Step 5: Get user information
    logger.info('Fetching user information...');
    const { data: user } = await octokit.rest.users.getAuthenticated();
    logger.info(`User authenticated: ${user.login}`);
    
    // Step 6: Get user repositories
    logger.info('Fetching user repositories...');
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated'
    });
    logger.info(`Found ${repos.length} repositories`);
    
    // Step 7: Prepare response
    const response = {
      success: true,
      user: {
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      repositories: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description,
        language: repo.language,
        updated_at: repo.updated_at,
        html_url: repo.html_url,
        clone_url: repo.clone_url
      })),
      access_token: tokenData.access_token
    };
    
    logger.info('=== GitHub OAuth Flow Completed Successfully ===');
    res.json(response);
    
  } catch (error) {
    logger.error('=== GitHub OAuth Flow Failed ===');
    logger.error(`Error type: ${error.constructor.name}`);
    logger.error(`Error message: ${error.message}`);
    
    // Check if it's a GitHub API error
    if (error.status) {
      logger.error(`GitHub API status: ${error.status}`);
    }
    
    if (error.response) {
      logger.error('GitHub API response:', error.response);
    }
    
    res.status(500).json({
      error: 'oauth_flow_failed',
      message: 'GitHub OAuth flow failed',
      details: {
        error_type: error.constructor.name,
        error_message: error.message,
        github_status: error.status || 'unknown'
      }
    });
  }
});

// New endpoint: Connect with Personal Access Token
router.post('/connect-with-token', ensureAuthenticated, async (req, res) => {
  try {
    logger.info('=== GitHub Connect with Token Started ===');
    
    // Step 1: Validate request
    const { token, provider } = req.body || {};
    if (!token) {
      logger.error('Missing Personal Access Token');
      return res.status(400).json({ error: 'missing_token', message: 'Personal Access Token is required' });
    }
    
    if (provider !== 'github') {
      logger.error('Unsupported provider:', provider);
      return res.status(400).json({ error: 'unsupported_provider', message: 'Only GitHub is supported for now' });
    }
    
    logger.info(`Received token for provider: ${provider}`);
    
    // Step 2: Create GitHub client with access token
    logger.info('Creating GitHub API client...');
    const octokit = new Octokit({ 
      auth: token 
    });
    
    // Step 3: Test token by getting user information
    logger.info('Testing token by fetching user information...');
    const { data: user } = await octokit.rest.users.getAuthenticated();
    logger.info(`User authenticated: ${user.login}`);
    
    // Step 4: Get user repositories
    logger.info('Fetching user repositories...');
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated'
    });
    logger.info(`Found ${repos.length} repositories`);
    
    // Step 5: Store token in database for future use
    const userId = req.user?.id;
    if (userId) {
      logger.info('Storing token in database...');
      await pool.query(
        `INSERT INTO user_provider_tokens (user_id, provider, access_token, updated_at) 
         VALUES ($1, $2, $3, now()) 
         ON CONFLICT (user_id, provider) 
         DO UPDATE SET access_token = $3, updated_at = now()`,
        [userId, provider, token]
      );
      logger.info('Token stored successfully in database');
    }
    
    // Step 6: Prepare response
    const response = {
      success: true,
      user: {
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      repositories: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description,
        language: repo.language,
        updated_at: repo.updated_at,
        html_url: repo.html_url,
        clone_url: repo.clone_url
      }))
    };
    
    logger.info('=== GitHub Connect with Token Completed Successfully ===');
    res.json(response);
    
  } catch (error) {
    logger.error('=== GitHub Connect with Token Failed ===');
    logger.error(`Error type: ${error.constructor.name}`);
    logger.error(`Error message: ${error.message}`);
    
    // Check if it's a GitHub API error
    if (error.status) {
      logger.error(`GitHub API status: ${error.status}`);
      
      // Handle specific GitHub API errors
      if (error.status === 401) {
        return res.status(401).json({
          error: 'invalid_token',
          message: 'Invalid Personal Access Token. Please check your token and try again.'
        });
      }
      
      if (error.status === 403) {
        return res.status(403).json({
          error: 'insufficient_permissions',
          message: 'Token does not have sufficient permissions. Please ensure your token has repo access.'
        });
      }
    }
    
    res.status(500).json({
      error: 'connection_failed',
      message: 'Failed to connect with Personal Access Token',
      details: {
        error_type: error.constructor.name,
        error_message: error.message,
        github_status: error.status || 'unknown'
      }
    });
  }
});

// New endpoint: Get projects from server
router.get('/projects', ensureAuthenticated, async (req, res) => {
  try {
    logger.info('=== Get Projects Started ===');
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User not authenticated' });
    }
    
    // Get projects from database
    const result = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.progress,
        p.start_date,
        p.end_date,
        p.team,
        p.priority,
        p.budget,
        p.coverage,
        p.last_run,
        p.created_at,
        p.updated_at,
        p.git_provider,
        p.repository,
        p.branch,
        p.notifications,
        p.personal_access_token
       FROM projects p 
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      startDate: project.start_date,
      endDate: project.end_date,
      team: project.team,
      priority: project.priority,
      budget: project.budget,
      coverage: project.coverage,
      lastRun: project.last_run,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      gitProvider: project.git_provider,
      repository: project.repository,
      branch: project.branch,
      notifications: project.notifications ? JSON.parse(project.notifications) : [],
      // Note: personal_access_token is not returned for security
    }));
    
    logger.info(`Found ${projects.length} projects for user ${userId}`);
    res.json(projects);
    
  } catch (error) {
    logger.error('=== Get Projects Failed ===');
    logger.error(`Error: ${error.message}`);
    res.status(500).json({
      error: 'get_projects_failed',
      message: 'Failed to get projects',
      details: error.message
    });
  }
});

// New endpoint: Create project
router.post('/projects', ensureAuthenticated, async (req, res) => {
  try {
    logger.info('=== Create Project Started ===');
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User not authenticated' });
    }
    
    const {
      name,
      description,
      startDate,
      endDate,
      team,
      priority,
      budget,
      gitProvider,
      repository,
      branch,
      notifications
    } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ error: 'missing_fields', message: 'Name and description are required' });
    }
    
    // Insert project into database
    const result = await pool.query(
      `INSERT INTO projects (
        user_id, name, description, start_date, end_date, team, priority, 
        budget, git_provider, repository, branch, notifications, status, progress
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        name,
        description,
        startDate || new Date(),
        endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        team || 'Default Team',
        priority || 'Medium',
        budget || '$0',
        gitProvider || '',
        repository || '',
        branch || '',
        notifications ? JSON.stringify(notifications) : '[]',
        'Planning',
        0
      ]
    );
    
    const newProject = result.rows[0];
    
    logger.info(`Project created successfully: ${newProject.id}`);
    res.status(201).json({
      success: true,
      project: {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        progress: newProject.progress,
        startDate: newProject.start_date,
        endDate: newProject.end_date,
        team: newProject.team,
        priority: newProject.priority,
        budget: newProject.budget,
        coverage: newProject.coverage || 0,
        lastRun: newProject.last_run || 'Not run',
        createdAt: newProject.created_at,
        updatedAt: newProject.updated_at,
        gitProvider: newProject.git_provider,
        repository: newProject.repository,
        branch: newProject.branch,
        notifications: newProject.notifications ? JSON.parse(newProject.notifications) : []
      }
    });
    
  } catch (error) {
    logger.error('=== Create Project Failed ===');
    logger.error(`Error: ${error.message}`);
    res.status(500).json({
      error: 'create_project_failed',
      message: 'Failed to create project',
      details: error.message
    });
  }
});

export default router;


