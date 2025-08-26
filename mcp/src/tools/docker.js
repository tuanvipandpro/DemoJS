import Docker from 'dockerode';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Khởi tạo Docker client
const docker = new Docker({
  socketPath: process.platform === 'win32' ? undefined : '/var/run/docker.sock'
});

/**
 * Chạy test trong Docker sandbox
 * @param {object} params - Tham số đầu vào
 * @param {string} traceId - Trace ID
 * @returns {object} - Kết quả test run
 */
export const runCiTool = async (params, traceId) => {
  const startTime = Date.now();
  let container = null;
  
  try {
    logger.info('Starting run_ci tool', {
      traceId,
      projectId: params.projectId,
      testPlan: params.testPlan.substring(0, 100) + '...',
      image: params.runner.image
    });

    // Tạo thư mục artifacts
    const artifactsDir = join(__dirname, '../../artifacts', params.projectId, Date.now().toString());
    await fs.mkdir(artifactsDir, { recursive: true });

    // Tạo container options
    const containerOptions = {
      Image: params.runner.image,
      WorkingDir: params.runner.workdir || '/app',
      Cmd: params.runner.cmd,
      HostConfig: {
        Memory: parseInt(process.env.DOCKER_RUNNER_MEMORY_LIMIT || '512m'),
        CpuQuota: parseInt(process.env.DOCKER_RUNNER_CPU_LIMIT || '0.5') * 100000,
        NetworkMode: 'none', // Isolated network
        ReadOnlyRootfs: false,
        Binds: [
          `${artifactsDir}:/artifacts:rw`
        ],
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        Ulimits: [
          { Name: 'nofile', Soft: 1024, Hard: 2048 }
        ]
      },
      Env: [
        'NODE_ENV=test',
        'CI=true',
        'ARTIFACTS_DIR=/artifacts'
      ],
      Labels: {
        'insighttestai.project': params.projectId,
        'insighttestai.trace': traceId,
        'insighttestai.tool': 'run_ci'
      }
    };

    // Tạo container
    container = await docker.createContainer(containerOptions);
    
    logger.info('Container created', {
      traceId,
      containerId: container.id,
      projectId: params.projectId
    });

    // Start container
    await container.start();
    
    // Đợi container hoàn thành với timeout
    const timeout = params.timeoutSec || parseInt(process.env.DOCKER_RUNNER_TIMEOUT_SEC || '900');
    const result = await waitForContainer(container, timeout * 1000);
    
    // Lấy logs
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 2000
    });

    // Thu thập artifacts
    const artifacts = await collectArtifacts(artifactsDir, params.artifacts);
    
    const duration = Date.now() - startTime;
    
    logger.info('run_ci tool completed', {
      traceId,
      projectId: params.projectId,
      containerId: container.id,
      status: result.status,
      duration
    });

    return {
      status: result.status,
      durationMs: duration,
      logs: logs.toString('utf8'),
      artifacts,
      containerId: container.id,
      exitCode: result.exitCode,
      metadata: {
        image: params.runner.image,
        workingDir: params.runner.workdir || '/app',
        command: params.runner.cmd.join(' '),
        timeoutSec: timeout,
        memoryLimit: containerOptions.HostConfig.Memory,
        cpuLimit: containerOptions.HostConfig.CpuQuota / 100000
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('run_ci tool failed', {
      traceId,
      projectId: params.projectId,
      error: error.message,
      duration
    });

    throw new Error(`Lỗi khi chạy CI: ${error.message}`);

  } finally {
    // Cleanup container
    if (container) {
      try {
        await container.remove({ force: true });
        logger.info('Container cleaned up', {
          traceId,
          containerId: container.id
        });
      } catch (cleanupError) {
        logger.warn('Container cleanup failed', {
          traceId,
          containerId: container.id,
          error: cleanupError.message
        });
      }
    }
  }
};

/**
 * Đợi container hoàn thành
 * @param {object} container - Docker container
 * @param {number} timeoutMs - Timeout milliseconds
 * @returns {object} - Kết quả container
 */
const waitForContainer = async (container, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Container execution timeout'));
    }, timeoutMs);

    container.wait((err, result) => {
      clearTimeout(timeout);
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Thu thập artifacts từ container
 * @param {string} artifactsDir - Thư mục artifacts
 * @param {array} expectedArtifacts - Danh sách artifacts cần thu thập
 * @returns {array} - Danh sách artifacts đã thu thập
 */
const collectArtifacts = async (artifactsDir, expectedArtifacts) => {
  const artifacts = [];
  
  try {
    const files = await fs.readdir(artifactsDir, { recursive: true });
    
    for (const file of files) {
      const filePath = join(artifactsDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile()) {
        // Kiểm tra xem file có match với expected artifacts không
        const isExpected = expectedArtifacts.some(pattern => {
          if (pattern.endsWith('/')) {
            return file.startsWith(pattern);
          }
          return file === pattern || file.endsWith(pattern);
        });
        
        if (isExpected) {
          const relativePath = file;
          const size = stat.size;
          
          artifacts.push({
            name: file,
            path: `/artifacts/${relativePath}`,
            size: size,
            sizeFormatted: formatFileSize(size),
            lastModified: stat.mtime
          });
        }
      }
    }
    
    // Sắp xếp theo thời gian sửa đổi
    artifacts.sort((a, b) => b.lastModified - a.lastModified);
    
  } catch (error) {
    logger.warn('Failed to collect artifacts', {
      artifactsDir,
      error: error.message
    });
  }
  
  return artifacts;
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
