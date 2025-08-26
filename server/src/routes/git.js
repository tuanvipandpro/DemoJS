import express from 'express';
import { logger } from '../utils/logger.js';
import { extractBearerToken, verifyToken } from '../utils/jwt.js';

const router = express.Router();

// Middleware để kiểm tra JWT token
const authenticateJWT = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};



// POST /api/git/repos - Lấy danh sách repository của user
router.post('/repos', authenticateJWT, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Git token required',
        message: 'Please provide Git token in request body'
      });
    }
    
    // Call GitHub API to get user repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'InsightTestAI'
      }
    });
    
    if (!reposResponse.ok) {
      logger.error('Git API repos error:', {
        status: reposResponse.status,
        statusText: reposResponse.statusText
      });
      return res.status(500).json({
        error: 'Failed to fetch repositories',
        message: 'Unable to fetch repositories from Git'
      });
    }
    
    const repos = await reposResponse.json();
    
    // Transform repositories to match our expected format
    const transformedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count
    }));

    // Lấy branches cho mỗi repository (chỉ lấy 5 repositories đầu tiên để tránh rate limit)
    const reposWithBranches = [];
    for (let i = 0; i < Math.min(transformedRepos.length, 5); i++) {
      const repo = transformedRepos[i];
      try {
        const [owner, repoName] = repo.full_name.split('/');
        const branchesResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'InsightTestAI'
          }
        });
        
        if (branchesResponse.ok) {
          const branches = await branchesResponse.json();
          repo.branches = branches.map(branch => ({
            name: branch.name,
            commitSha: branch.commit.sha
          }));
          logger.info(`Successfully fetched ${repo.branches.length} branches for ${repo.full_name}`);
        } else {
          logger.warn(`Failed to fetch branches for ${repo.full_name}:`, {
            status: branchesResponse.status,
            statusText: branchesResponse.statusText
          });
          repo.branches = [];
        }
      } catch (error) {
        logger.error(`Error fetching branches for ${repo.full_name}:`, error);
        repo.branches = [];
      }
      reposWithBranches.push(repo);
    }
    
    const response = {
      success: true,
      repositories: reposWithBranches
    };
    
    // Log successful response
    logger.info('Git repos fetched successfully:', {
      userId: req.user.sub,
      reposCount: transformedRepos.length
    });
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching Git repos:', error);
    res.status(500).json({
      error: 'Failed to fetch repositories',
      message: error.message || 'Internal server error'
    });
  }
});

// GET /api/git/repos/{owner}/{repo}/branches - Lấy danh sách branch của repository
router.post('/repos/:owner/:repo/branches', authenticateJWT, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { githubToken } = req.body;
    
    // Log request for debugging
    logger.info('Git branches request:', {
      userId: req.user.sub,
      owner,
      repo,
      hasToken: !!githubToken
    });
    
    // Validation
    if (!githubToken) {
      return res.status(400).json({
        error: 'Git token is required',
        message: 'Please provide Git token to fetch branches'
      });
    }
    
    // Call GitHub API to get branches for specific repository
    const branchesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'InsightTestAI'
      }
    });
    
    if (!branchesResponse.ok) {
      logger.error('Git API branches error:', {
        status: branchesResponse.status,
        statusText: branchesResponse.statusText,
        owner,
        repo
      });
      
      if (branchesResponse.status === 404) {
        return res.status(404).json({
          error: 'Repository not found',
          message: `Repository ${owner}/${repo} not found or access denied`
        });
      }
      
      return res.status(branchesResponse.status).json({
        error: 'Failed to fetch branches',
        message: `Git API error: ${branchesResponse.statusText}`
      });
    }
    
    const branches = await branchesResponse.json();
    
    // Transform branches to match our expected format
    const transformedBranches = branches.map(branch => ({
      name: branch.name,
      commitSha: branch.commit.sha,
      commitUrl: branch.commit.url,
      commitMessage: branch.commit.commit?.message || '',
      commitAuthor: branch.commit.commit?.author?.name || '',
      commitDate: branch.commit.commit?.author?.date || ''
    }));

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      branches: transformedBranches
    });
  } catch (error) {
    logger.error('Error fetching Git branches:', error);
    res.status(500).json({
      error: 'Failed to fetch branches',
      message: error.message || 'Internal server error'
    });
  }
});

// POST /api/git/connect-with-token - Kết nối Git bằng Personal Access Token
router.post('/connect-with-token', authenticateJWT, async (req, res) => {
  try {
    const { token, provider } = req.body;
    
    // Log request for debugging
    logger.info('Git connect request:', {
      userId: req.user.sub,
      provider,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    
    // Validation
    if (!token) {
      return res.status(400).json({
        error: 'Git token is required'
      });
    }
    
    if (!provider || provider !== 'github') {
      return res.status(400).json({
        error: 'Provider must be "github"'
      });
    }
    
    // Validate token format (GitHub tokens are typically 40 characters)
    if (token.length < 20) {
      return res.status(400).json({
        error: 'Invalid Git token format'
      });
    }
    
    // Call GitHub API to get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'InsightTestAI'
      }
    });
    
    if (!userResponse.ok) {
      logger.error('Git API user error:', {
        status: userResponse.status,
        statusText: userResponse.statusText
      });
      return res.status(401).json({
        error: 'Invalid Git token',
        message: 'Unable to authenticate with Git'
      });
    }
    
    const user = await userResponse.json();
    
    // Call GitHub API to get user repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'InsightTestAI'
      }
    });
    
    if (!reposResponse.ok) {
      logger.error('Git API repos error:', {
        status: reposResponse.status,
        statusText: reposResponse.statusText
      });
      return res.status(500).json({
        error: 'Failed to fetch repositories',
        message: 'Unable to fetch repositories from Git'
      });
    }
    
    const repos = await reposResponse.json();
    
    // Transform repositories to match our expected format
    const transformedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count
    }));

    // Lấy branches cho mỗi repository (chỉ lấy 5 repositories đầu tiên để tránh rate limit)
    const reposWithBranches = [];
    for (let i = 0; i < Math.min(transformedRepos.length, 5); i++) {
      const repo = transformedRepos[i];
      try {
        const [owner, repoName] = repo.full_name.split('/');
        const branchesResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/branches`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'InsightTestAI'
          }
        });
        
        if (branchesResponse.ok) {
          const branches = await branchesResponse.json();
          repo.branches = branches.map(branch => ({
            name: branch.name,
            commitSha: branch.commit.sha
          }));
          logger.info(`Successfully fetched ${repo.branches.length} branches for ${repo.full_name}`);
        } else {
          logger.warn(`Failed to fetch branches for ${repo.full_name}:`, {
            status: branchesResponse.status,
            statusText: branchesResponse.statusText
          });
          repo.branches = [];
        }
      } catch (error) {
        logger.error(`Error fetching branches for ${repo.full_name}:`, error);
        repo.branches = [];
      }
      reposWithBranches.push(repo);
    }
    
    const response = {
      success: true,
      user: {
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        id: user.id,
        type: user.type,
        company: user.company,
        location: user.location,
        bio: user.bio,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following
      },
      repositories: reposWithBranches
    };
    
    // Log successful response
    logger.info('Git connect successful:', {
      userId: req.user.sub,
      gitUser: user.login,
      reposCount: transformedRepos.length
    });
    
    res.json(response);
  } catch (error) {
    logger.error('Error connecting to Git:', error);
    res.status(500).json({
      error: 'Failed to connect to Git',
      message: error.message || 'Internal server error'
    });
  }
});

export default router;
