import axios from 'axios';
import config from '../config/env.js';

/**
 * MCP (Model Context Protocol) Client
 * Handles communication with MCP server for tool execution
 */
export class MCPClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || config.mcp.serverUrl;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
    
    // HTTP client with configuration
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InsightTestAI-Worker/1.0.0'
      }
    });

    // Request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`MCP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('MCP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`MCP Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('MCP Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute a tool via MCP server
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} parameters - Tool parameters
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolName, parameters = {}, options = {}) {
    const { retryCount = 0, timeout = this.timeout } = options;
    
    try {
      const response = await this.httpClient.post('/tools/execute', {
        tool: toolName,
        parameters,
        options: {
          timeout: Math.min(timeout, this.timeout),
          ...options
        }
      }, {
        timeout: Math.min(timeout, this.timeout)
      });

      return {
        success: true,
        data: response.data,
        metadata: {
          toolName,
          executionTime: response.headers['x-execution-time'],
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      // Handle retry logic
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        
        console.log(`Retrying tool execution ${toolName} in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await this.sleep(delay);
        
        return this.executeTool(toolName, parameters, {
          ...options,
          retryCount: retryCount + 1
        });
      }

      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          status: error.response?.status,
          details: error.response?.data
        },
        metadata: {
          toolName,
          retryCount,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get available tools from MCP server
   * @returns {Promise<Array>} List of available tools
   */
  async getAvailableTools() {
    try {
      const response = await this.httpClient.get('/tools/list');
      return {
        success: true,
        tools: response.data.tools || [],
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          status: error.response?.status,
          details: error.response?.data
        }
      };
    }
  }

  /**
   * Get tool schema/information
   * @param {string} toolName - Name of the tool
   * @returns {Promise<Object>} Tool schema
   */
  async getToolSchema(toolName) {
    try {
      const response = await this.httpClient.get(`/tools/${toolName}/schema`);
      return {
        success: true,
        schema: response.data,
        metadata: {
          toolName,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          status: error.response?.status,
          details: error.response?.data
        }
      };
    }
  }

  /**
   * Check MCP server health
   * @returns {Promise<boolean>} Is server healthy
   */
  async healthCheck() {
    try {
      const response = await this.httpClient.get('/health', {
        timeout: 5000 // Quick health check
      });
      return response.status === 200;
    } catch (error) {
      console.error('MCP Health Check Failed:', error.message);
      return false;
    }
  }

  /**
   * Execute multiple tools in sequence
   * @param {Array} toolExecutions - Array of tool execution requests
   * @returns {Promise<Array>} Results of all tool executions
   */
  async executeToolsSequentially(toolExecutions) {
    const results = [];
    
    for (const execution of toolExecutions) {
      const { tool, parameters, options } = execution;
      const result = await this.executeTool(tool, parameters, options);
      results.push(result);
      
      // Stop execution if a tool fails
      if (!result.success) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Execute multiple tools in parallel
   * @param {Array} toolExecutions - Array of tool execution requests
   * @returns {Promise<Array>} Results of all tool executions
   */
  async executeToolsInParallel(toolExecutions) {
    const promises = toolExecutions.map(execution => {
      const { tool, parameters, options } = execution;
      return this.executeTool(tool, parameters, options);
    });
    
    return Promise.all(promises);
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Is error retryable
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return true;
    }
    
    // HTTP 5xx errors are retryable
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }
    
    // HTTP 429 (Too Many Requests) is retryable
    if (error.response?.status === 429) {
      return true;
    }
    
    return false;
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close MCP client
   */
  async close() {
    // Clean up any pending requests
    // Axios doesn't have a close method, but we can cancel pending requests
    console.log('MCP Client closed');
  }
}

/**
 * Predefined tool execution helpers
 */
export class ToolHelpers {
  constructor(mcpClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * Get repository diff
   * @param {string} repoUrl - Repository URL
   * @param {string} commitId - Commit ID
   * @returns {Promise<Object>} Diff information
   */
  async getDiff(repoUrl, commitId) {
    return this.mcpClient.executeTool('get_diff', {
      repository: repoUrl,
      commit_id: commitId
    });
  }

  /**
   * Run CI tests
   * @param {string} projectId - Project ID
   * @param {Object} testPlan - Test plan
   * @returns {Promise<Object>} CI test results
   */
  async runCI(projectId, testPlan) {
    return this.mcpClient.executeTool('run_ci', {
      project_id: projectId,
      test_plan: testPlan
    });
  }

  /**
   * Get test coverage
   * @param {string} reportId - Coverage report ID
   * @returns {Promise<Object>} Coverage information
   */
  async getCoverage(reportId) {
    return this.mcpClient.executeTool('get_coverage', {
      report_id: reportId
    });
  }

  /**
   * Send notification
   * @param {string} channel - Notification channel
   * @param {string} message - Message content
   * @param {Object} options - Notification options
   * @returns {Promise<Object>} Notification result
   */
  async notify(channel, message, options = {}) {
    return this.mcpClient.executeTool('notify', {
      channel,
      message,
      ...options
    });
  }
}

export default MCPClient;
