import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Lấy diff từ GitHub API
 * @param {object} params - Tham số đầu vào
 * @param {string} githubToken - GitHub token
 * @param {string} traceId - Trace ID
 * @returns {object} - Kết quả diff
 */
export const getDiffTool = async (params, githubToken, traceId) => {
  const startTime = Date.now();
  
  try {
    logger.info('Starting get_diff tool', {
      traceId,
      repo: params.repo,
      commitId: params.commitId,
      paths: params.paths
    });

    // Validate GitHub token
    if (!githubToken || githubToken.length < 10) {
      throw new Error('GitHub token không hợp lệ');
    }

    // Lấy thông tin commit
    const commitResponse = await axios.get(
      `https://api.github.com/repos/${params.repo}/commits/${params.commitId}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'InsightTestAI-MCP-Server'
        },
        timeout: 10000
      }
    );

    const commit = commitResponse.data;
    
    // Lấy diff của commit
    const diffResponse = await axios.get(
      `https://api.github.com/repos/${params.repo}/commits/${params.commitId}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3.diff',
          'User-Agent': 'InsightTestAI-MCP-Server'
        },
        timeout: 15000
      }
    );

    const diff = diffResponse.data;
    
    // Parse diff và lọc theo paths nếu có
    const files = parseDiff(diff, params.paths, params.maxPatchBytes);
    
    // Tạo scoped context cho RAG
    const scopedContext = generateScopedContext(files, commit);
    
    const duration = Date.now() - startTime;
    
    logger.info('get_diff tool completed successfully', {
      traceId,
      repo: params.repo,
      commitId: params.commitId,
      filesCount: files.length,
      duration
    });

    return {
      commitId: params.commitId,
      repo: params.repo,
      commitMessage: commit.commit.message,
      author: commit.commit.author.name,
      timestamp: commit.commit.author.date,
      files,
      scopedContext,
      metadata: {
        totalFiles: files.length,
        totalAdditions: files.reduce((sum, f) => sum + (f.additions || 0), 0),
        totalDeletions: files.reduce((sum, f) => sum + (f.deletions || 0), 0),
        durationMs: duration
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('get_diff tool failed', {
      traceId,
      repo: params.repo,
      commitId: params.commitId,
      error: error.message,
      duration
    });

    if (error.response) {
      // GitHub API error
      if (error.response.status === 404) {
        throw new Error(`Repository hoặc commit không tìm thấy: ${params.repo}@${params.commitId}`);
      } else if (error.response.status === 401) {
        throw new Error('GitHub token không hợp lệ hoặc hết hạn');
      } else if (error.response.status === 403) {
        throw new Error('Không có quyền truy cập repository');
      } else {
        throw new Error(`GitHub API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout khi gọi GitHub API');
    } else {
      throw new Error(`Lỗi khi lấy diff: ${error.message}`);
    }
  }
};

/**
 * Parse diff content và lọc theo paths
 * @param {string} diff - Raw diff content
 * @param {array} paths - Paths để filter
 * @param {number} maxPatchBytes - Max patch size
 * @returns {array} - Danh sách files đã parse
 */
const parseDiff = (diff, paths = null, maxPatchBytes = 262144) => {
  const files = [];
  const lines = diff.split('\n');
  let currentFile = null;
  let currentPatch = '';
  
  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      // Lưu file trước đó nếu có
      if (currentFile && currentPatch) {
        currentFile.patch = currentPatch;
        if (currentPatch.length > maxPatchBytes) {
          currentFile.patch = currentPatch.substring(0, maxPatchBytes) + '\n... (truncated)';
        }
        files.push(currentFile);
      }
      
      // Parse tên file mới
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      if (match) {
        const filePath = match[1];
        
        // Filter theo paths nếu có
        if (paths && !paths.some(path => filePath.startsWith(path))) {
          currentFile = null;
          currentPatch = '';
          continue;
        }
        
        currentFile = {
          path: filePath,
          status: 'modified',
          additions: 0,
          deletions: 0,
          hunks: []
        };
        currentPatch = line + '\n';
      }
    } else if (currentFile) {
      currentPatch += line + '\n';
      
      // Parse hunk headers
      if (line.startsWith('@@')) {
        const hunkMatch = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
        if (hunkMatch) {
          currentFile.hunks.push({
            oldStart: parseInt(hunkMatch[1]),
            oldLines: parseInt(hunkMatch[2] || 1),
            newStart: parseInt(hunkMatch[3]),
            newLines: parseInt(hunkMatch[4] || 1)
          });
        }
      }
      
      // Đếm additions/deletions
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentFile.additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentFile.deletions++;
      }
    }
  }
  
  // Lưu file cuối cùng
  if (currentFile && currentPatch) {
    currentFile.patch = currentPatch;
    if (currentPatch.length > maxPatchBytes) {
      currentFile.patch = currentPatch.substring(0, maxPatchBytes) + '\n... (truncated)';
    }
    files.push(currentFile);
  }
  
  return files;
};

/**
 * Tạo scoped context cho RAG
 * @param {array} files - Danh sách files
 * @param {object} commit - Thông tin commit
 * @returns {string} - Scoped context
 */
const generateScopedContext = (files, commit) => {
  const summary = {
    commitMessage: commit.commit.message,
    author: commit.commit.author.name,
    timestamp: commit.commit.author.date,
    filesChanged: files.length,
    totalAdditions: files.reduce((sum, f) => sum + (f.additions || 0), 0),
    totalDeletions: files.reduce((sum, f) => sum + (f.deletions || 0), 0),
    fileTypes: [...new Set(files.map(f => f.path.split('.').pop()))],
    criticalPaths: files.filter(f => 
      f.path.includes('src/') || 
      f.path.includes('tests/') || 
      f.path.includes('package.json') ||
      f.path.includes('Dockerfile')
    ).map(f => f.path)
  };
  
  return `Commit: ${summary.commitMessage} by ${summary.author}
Files changed: ${summary.filesChanged}
Additions: +${summary.totalAdditions}, Deletions: -${summary.totalDeletions}
File types: ${summary.fileTypes.join(', ')}
Critical paths: ${summary.criticalPaths.join(', ')}`;
};
