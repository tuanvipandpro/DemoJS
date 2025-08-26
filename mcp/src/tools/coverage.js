import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Phân tích coverage report
 * @param {object} params - Tham số đầu vào
 * @param {string} traceId - Trace ID
 * @returns {object} - Kết quả coverage analysis
 */
export const getCoverageTool = async (params, traceId) => {
  const startTime = Date.now();
  
  try {
    logger.info('Starting get_coverage tool', {
      traceId,
      reportId: params.reportId,
      format: params.format
    });

    // Tìm coverage report file
    const reportFile = await findCoverageReport(params.reportId, params.format);
    
    if (!reportFile) {
      throw new Error(`Không tìm thấy coverage report với ID: ${params.reportId}`);
    }

    // Parse coverage report theo format
    let coverageData;
    if (params.format === 'lcov') {
      coverageData = await parseLcovReport(reportFile);
    } else if (params.format === 'cobertura') {
      coverageData = await parseCoberturaReport(reportFile);
    } else {
      throw new Error(`Format coverage không được hỗ trợ: ${params.format}`);
    }

    const duration = Date.now() - startTime;
    
    logger.info('get_coverage tool completed successfully', {
      traceId,
      reportId: params.reportId,
      format: params.format,
      filesCount: coverageData.files.length,
      duration
    });

    return {
      reportId: params.reportId,
      format: params.format,
      timestamp: new Date().toISOString(),
      summary: {
        statements: coverageData.summary.statements,
        branches: coverageData.summary.branches,
        functions: coverageData.summary.functions,
        lines: coverageData.summary.lines
      },
      files: coverageData.files,
      metadata: {
        totalFiles: coverageData.files.length,
        durationMs: duration,
        reportPath: reportFile
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('get_coverage tool failed', {
      traceId,
      reportId: params.reportId,
      format: params.format,
      error: error.message,
      duration
    });

    throw new Error(`Lỗi khi phân tích coverage: ${error.message}`);
  }
};

/**
 * Tìm coverage report file
 * @param {string} reportId - Report ID
 * @param {string} format - Report format
 * @returns {string|null} - Đường dẫn file hoặc null
 */
const findCoverageReport = async (reportId, format) => {
  const artifactsDir = join(__dirname, '../../artifacts');
  
  try {
    // Tìm trong thư mục artifacts
    const projects = await fs.readdir(artifactsDir);
    
    for (const project of projects) {
      const projectDir = join(artifactsDir, project);
      const projectStat = await fs.stat(projectDir);
      
      if (projectStat.isDirectory()) {
        const runs = await fs.readdir(projectDir);
        
        for (const run of runs) {
          const runDir = join(projectDir, run);
          const runStat = await fs.stat(runDir);
          
          if (runStat.isDirectory()) {
            // Tìm file coverage theo format
            const files = await fs.readdir(runDir, { recursive: true });
            
            for (const file of files) {
              if (typeof file === 'string') {
                if (format === 'lcov' && file.endsWith('.info')) {
                  return join(runDir, file);
                } else if (format === 'cobertura' && file.endsWith('.xml')) {
                  // Kiểm tra xem có phải cobertura XML không
                  const filePath = join(runDir, file);
                  try {
                    const content = await fs.readFile(filePath, 'utf8');
                    if (content.includes('<coverage') || content.includes('cobertura')) {
                      return filePath;
                    }
                  } catch (e) {
                    // Bỏ qua file không đọc được
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return null;
    
  } catch (error) {
    logger.warn('Failed to search coverage reports', {
      reportId,
      format,
      error: error.message
    });
    return null;
  }
};

/**
 * Parse LCOV coverage report
 * @param {string} filePath - Đường dẫn file LCOV
 * @returns {object} - Coverage data
 */
const parseLcovReport = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const files = [];
  let currentFile = null;
  let totalStatements = 0;
  let totalBranches = 0;
  let totalFunctions = 0;
  let totalLines = 0;
  let coveredStatements = 0;
  let coveredBranches = 0;
  let coveredFunctions = 0;
  let coveredLines = 0;
  
  for (const line of lines) {
    if (line.startsWith('SF:')) {
      // File name
      if (currentFile) {
        files.push(currentFile);
      }
      
      currentFile = {
        path: line.substring(3),
        statements: [],
        branches: [],
        functions: [],
        lines: []
      };
      
    } else if (line.startsWith('DA:') && currentFile) {
      // Line coverage
      const match = line.match(/DA:(\d+),(\d+)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const hits = parseInt(match[2]);
        
        currentFile.lines.push({ line: lineNum, hits });
        totalLines++;
        if (hits > 0) coveredLines++;
      }
      
    } else if (line.startsWith('BRF:') && currentFile) {
      // Branch functions found
      const match = line.match(/BRF:(\d+)/);
      if (match) {
        totalBranches += parseInt(match[1]);
      }
      
    } else if (line.startsWith('BRH:') && currentFile) {
      // Branch hits
      const match = line.match(/BRH:(\d+)/);
      if (match) {
        coveredBranches += parseInt(match[1]);
      }
      
    } else if (line.startsWith('FNF:') && currentFile) {
      // Functions found
      const match = line.match(/FNF:(\d+)/);
      if (match) {
        totalFunctions += parseInt(match[1]);
      }
      
    } else if (line.startsWith('FNH:') && currentFile) {
      // Function hits
      const match = line.match(/FNH:(\d+)/);
      if (match) {
        coveredFunctions += parseInt(match[1]);
      }
      
    } else if (line.startsWith('LF:') && currentFile) {
      // Lines found
      const match = line.match(/LF:(\d+)/);
      if (match) {
        totalStatements += parseInt(match[1]);
      }
      
    } else if (line.startsWith('LH:') && currentFile) {
      // Lines hit
      const match = line.match(/LH:(\d+)/);
      if (match) {
        coveredStatements += parseInt(match[1]);
      }
    }
  }
  
  // Thêm file cuối cùng
  if (currentFile) {
    files.push(currentFile);
  }
  
  // Tính tỷ lệ coverage cho từng file
  for (const file of files) {
    const fileLines = file.lines.length;
    const coveredFileLines = file.lines.filter(l => l.hits > 0).length;
    
    file.coverage = {
      lines: fileLines > 0 ? (coveredFileLines / fileLines) * 100 : 0,
      statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
    };
  }
  
  return {
    summary: {
      statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
    },
    files
  };
};

/**
 * Parse Cobertura coverage report
 * @param {string} filePath - Đường dẫn file Cobertura XML
 * @returns {object} - Coverage data
 */
const parseCoberturaReport = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8');
  
  // Simple XML parsing (trong thực tế nên dùng thư viện XML parser)
  const summaryMatch = content.match(/<coverage[^>]*lines-covered="(\d+)"[^>]*total-lines="(\d+)"[^>]*branches-covered="(\d+)"[^>]*total-branches="(\d+)"/);
  
  if (!summaryMatch) {
    throw new Error('Không thể parse Cobertura XML format');
  }
  
  const coveredLines = parseInt(summaryMatch[1]);
  const totalLines = parseInt(summaryMatch[2]);
  const coveredBranches = parseInt(summaryMatch[3]);
  const totalBranches = parseInt(summaryMatch[4]);
  
  // Parse file coverage
  const fileMatches = content.match(/<class[^>]*filename="([^"]*)"[^>]*line-rate="([^"]*)"[^>]*branch-rate="([^"]*)"[^>]*complexity="([^"]*)"/g);
  
  const files = [];
  if (fileMatches) {
    for (const match of fileMatches) {
      const fileMatch = match.match(/filename="([^"]*)"[^>]*line-rate="([^"]*)"[^>]*branch-rate="([^"]*)"[^>]*complexity="([^"]*)"/);
      
      if (fileMatch) {
        files.push({
          path: fileMatch[1],
          coverage: {
            lines: parseFloat(fileMatch[2]) * 100,
            branches: parseFloat(fileMatch[3]) * 100,
            complexity: parseFloat(fileMatch[4])
          }
        });
      }
    }
  }
  
  return {
    summary: {
      statements: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functions: 0, // Cobertura không có function coverage
      lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
    },
    files
  };
};
