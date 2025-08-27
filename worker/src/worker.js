import { StateMachine, FSM_STATES } from './core/stateMachine.js';
import { QueueFactory } from './queue/queueFactory.js';
import { MCPClient, ToolHelpers } from './tools/mcpClient.js';
import { LLMFactory } from './services/llm/LLMFactory.js';
import config from './config/env.js';
import { logger } from './utils/logger.js';

/**
 * Main Worker class for processing orchestration tasks
 */
export class OrchestratorWorker {
  constructor(options = {}) {
    this.options = {
      concurrency: options.concurrency || config.worker.concurrency,
      maxRetries: options.maxRetries || config.worker.maxRetries,
      confidenceThreshold: options.confidenceThreshold || config.worker.confidenceThreshold,
      ...options
    };

    // Initialize components
    this.queue = null;
    this.mcpClient = null;
    this.toolHelpers = null;
    this.llmService = null;
    this.logger = logger;
    
    // Worker state
    this.isRunning = false;
    this.activeJobs = new Map(); // jobId -> StateMachine
    this.jobCount = 0;
    this.errorCount = 0;
    
    // Metrics
    this.metrics = {
      jobsProcessed: 0,
      jobsSucceeded: 0,
      jobsFailed: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Initialize worker components
   */
  async initialize() {
    try {
      this.logger.info('🚀 Initializing Orchestrator Worker...', {
        environment: config.environment,
        isProduction: config.isProduction,
        isDevelopment: config.isDevelopment
      });

      // Display configuration summary
      this.logConfigurationSummary();

      // Initialize queue
      this.queue = QueueFactory.createDefaultQueue();
      await this.queue.connect();
      this.logger.info(`✅ Connected to queue: ${this.queue.getName()} (${config.queue.type})`);

      // Initialize MCP client
      this.mcpClient = new MCPClient();
      this.toolHelpers = new ToolHelpers(this.mcpClient);
      
      // Test MCP connection
      const isHealthy = await this.mcpClient.healthCheck();
      if (!isHealthy) {
        throw new Error('MCP server is not healthy');
      }
      this.logger.info('✅ Connected to MCP server');

      // Initialize LLM service
      this.llmService = LLMFactory.createDefaultLLMService();
      await this.llmService.initialize();
      this.logger.info(`✅ LLM service initialized with provider: ${this.llmService.constructor.name}`);

      // Setup queue event listeners
      this.setupQueueEventListeners();

      this.logger.info('🎉 Worker initialization completed successfully');
      return true;

    } catch (error) {
      this.logger.error('❌ Failed to initialize worker:', error);
      throw error;
    }
  }

  /**
   * Display configuration summary
   */
  logConfigurationSummary() {
    const summary = {
      'Environment': config.environment,
      'Queue Type': config.queue.type,
      'LLM Provider': config.llm.provider,
      'Database': config.database.host && config.database.name ? 'Configured' : 'Missing',
      'MCP Server': config.mcp.serverUrl,
      'Worker Concurrency': config.worker.concurrency,
      'Max Retries': config.worker.maxRetry,
      'Confidence Threshold': config.worker.confidenceThreshold
    };

    this.logger.info('📋 Configuration Summary:', summary);

    // Display mode-specific info
    if (config.isDevelopment) {
      this.logger.info('🔄 Running in DEVELOPMENT mode:', {
        'Queue': 'Local (no AWS required)',
        'LLM': 'Gemini API (Google AI Studio)',
        'Setup': 'Only GEMINI_API_KEY required'
      });
    } else if (config.isProduction) {
      this.logger.info('🚀 Running in PRODUCTION mode:', {
        'Queue': 'AWS SQS',
        'LLM': 'AWS Bedrock',
        'Setup': 'AWS credentials + SQS URL required'
      });
    }

    // Display database info
    this.logger.info('🗄️ Database Configuration:', {
      'Host': config.database.host,
      'Port': config.database.port,
      'Database': config.database.name,
      'User': config.database.user,
      'SSL': config.database.ssl ? 'Enabled' : 'Disabled',
      'Connection String': config.database.url
    });
  }

  /**
   * Setup queue event listeners
   */
  setupQueueEventListeners() {
    if (this.queue.getEventEmitter) {
      const eventEmitter = this.queue.getEventEmitter();
      
      eventEmitter.on('message:enqueued', (message) => {
        this.logger.debug('Message enqueued:', message.id);
      });

      eventEmitter.on('message:dequeued', (message) => {
        this.logger.debug('Message dequeued:', message.id);
      });

      eventEmitter.on('message:acked', (message) => {
        this.logger.debug('Message acknowledged:', message.id);
      });

      eventEmitter.on('message:failed', (message) => {
        this.logger.warn('Message failed:', message.id);
      });
    }
  }

  /**
   * Start the worker
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Worker is already running');
      return;
    }

    try {
      this.logger.info('Starting Orchestrator Worker...');
      this.isRunning = true;

      // Start processing loop
      this.startProcessingLoop();

      this.logger.info('Worker started successfully');
    } catch (error) {
      this.logger.error('Failed to start worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the worker
   */
  async stop() {
    if (!this.isRunning) {
      this.logger.warn('Worker is not running');
      return;
    }

    try {
      this.logger.info('Stopping Orchestrator Worker...');
      this.isRunning = false;

      // Wait for active jobs to complete
      const activeJobCount = this.activeJobs.size;
      if (activeJobCount > 0) {
        this.logger.info(`Waiting for ${activeJobCount} active jobs to complete...`);
        
        // Wait up to 30 seconds for jobs to complete
        let waitTime = 0;
        const maxWaitTime = 30000;
        const checkInterval = 1000;
        
        while (this.activeJobs.size > 0 && waitTime < maxWaitTime) {
          await this.sleep(checkInterval);
          waitTime += checkInterval;
        }
        
        if (this.activeJobs.size > 0) {
          this.logger.warn(`${this.activeJobs.size} jobs did not complete in time`);
        }
      }

      // Close connections
      if (this.queue) {
        await this.queue.disconnect();
      }
      if (this.mcpClient) {
        await this.mcpClient.close();
      }

      this.logger.info('Worker stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping worker:', error);
      throw error;
    }
  }

  /**
   * Main processing loop
   */
  async startProcessingLoop() {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs.size >= this.options.concurrency) {
          await this.sleep(1000); // Wait before checking again
          continue;
        }

        // Dequeue message
        const message = await this.queue.dequeue({ timeout: 5000 });
        if (!message) {
          continue; // No messages available
        }

        // Process message
        this.processMessage(message);

      } catch (error) {
        this.logger.error('Error in processing loop:', error);
        this.errorCount++;
        
        // Wait before retrying
        await this.sleep(5000);
      }
    }
  }

  /**
   * Process a single message
   */
  async processMessage(message) {
    const jobId = message.id;
    this.jobCount++;
    
    try {
      this.logger.info(`Processing job ${jobId}`, { 
        jobId, 
        messageType: message.data.type,
        projectId: message.data.projectId 
      });

      // Create state machine for this job
      const stateMachine = new StateMachine({
        context: {
          jobId,
          message: message.data,
          startTime: new Date()
        },
        maxRetries: this.options.maxRetries
      });

      // Add to active jobs
      this.activeJobs.set(jobId, stateMachine);

      // Setup state machine event listeners
      this.setupStateMachineListeners(stateMachine, message);

      // Start processing
      const startTime = Date.now();
      await this.processJob(stateMachine, message);
      const processingTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(processingTime, true);

      // Acknowledge message
      await this.acknowledgeMessage(message);

      this.logger.info(`Job ${jobId} completed successfully`, { 
        jobId, 
        processingTime,
        finalState: stateMachine.getCurrentState()
      });

    } catch (error) {
      this.logger.error(`Job ${jobId} failed:`, error);
      this.errorCount++;
      this.updateMetrics(0, false);

      // Handle failed message
      await this.handleFailedMessage(message, error);
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Process a single job through the FSM
   */
  async processJob(stateMachine, message) {
    const { type, projectId, commitId, repository } = message.data;

    try {
      // Start with PLANNING state
      stateMachine.transitionTo(FSM_STATES.PLANNING);

      // Planning phase - Generate test plan using LLM
      const testPlan = await this.generateTestPlan(repository, commitId);
      stateMachine.updateContext({ testPlan });

      // Transition to TOOLING
      stateMachine.transitionTo(FSM_STATES.TOOLING);

      // Tooling phase - Execute tools
      const toolResults = await this.executeTools(projectId, testPlan);
      stateMachine.updateContext({ toolResults });

      // Transition to OBSERVING
      stateMachine.transitionTo(FSM_STATES.OBSERVING);

      // Observing phase - Analyze results
      const analysis = await this.analyzeResults(toolResults);
      stateMachine.updateContext({ analysis });

      // Check confidence level
      if (analysis.confidence >= this.options.confidenceThreshold) {
        stateMachine.transitionTo(FSM_STATES.DONE);
      } else {
        // Low confidence - transition to WAITING_REVIEW
        stateMachine.transitionTo(FSM_STATES.WAITING_REVIEW);
        
        // Send notification for manual review
        await this.toolHelpers.notify('slack', 
          `Low confidence test run requires manual review. Project: ${projectId}, Confidence: ${analysis.confidence}`
        );
      }

    } catch (error) {
      // Handle errors and transition to ERROR state
      stateMachine.setError(error);
      
      // Try to recover if possible
      if (stateMachine.canRetry()) {
        stateMachine.incrementRetry();
        stateMachine.transitionTo(FSM_STATES.ADJUSTING);
        
        // Retry logic would go here
        this.logger.info(`Retrying job ${message.id}, attempt ${stateMachine.getRetryCount()}`);
      } else {
        // Max retries exceeded
        stateMachine.transitionTo(FSM_STATES.ERROR);
      }
    }
  }

  /**
   * Generate test plan using LLM
   */
  async generateTestPlan(repository, commitId, diffContent = '') {
    try {
      this.logger.info('Generating test plan using LLM', {
        repository,
        commitId,
        provider: config.llm.provider
      });

      const testPlan = await this.llmService.generateTestPlan(repository, commitId, diffContent);
      
      this.logger.info('Test plan generated successfully', {
        confidence: testPlan.confidence,
        testCount: testPlan.tests?.length || 0
      });

      return testPlan;
    } catch (error) {
      this.logger.error('Failed to generate test plan with LLM, using fallback:', error);
      return this.llmService.getFallbackTestPlan();
    }
  }

  /**
   * Execute tools based on test plan
   */
  async executeTools(projectId, testPlan) {
    const results = {};

    // Get repository diff
    const diffResult = await this.toolHelpers.getDiff('https://github.com/example/repo', 'abc123');
    results.diff = diffResult;

    // Run CI tests
    const ciResult = await this.toolHelpers.runCI(projectId, testPlan);
    results.ci = ciResult;

    // Get coverage if CI was successful
    if (ciResult.success && ciResult.data.reportId) {
      const coverageResult = await this.toolHelpers.getCoverage(ciResult.data.reportId);
      results.coverage = coverageResult;
    }

    return results;
  }

  /**
   * Analyze test results using LLM
   */
  async analyzeResults(toolResults) {
    try {
      this.logger.info('Analyzing test results using LLM');
      
      const analysis = await this.llmService.analyzeTestResults(toolResults);
      
      this.logger.info('Test results analysis completed', {
        confidence: analysis.confidence,
        qualityScore: analysis.qualityScore
      });

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze results with LLM, using fallback:', error);
      return this.llmService.getFallbackAnalysis(toolResults);
    }
  }

  /**
   * Generate test cases based on code changes
   */
  async generateTestCases(diffContent, projectContext = {}) {
    try {
      this.logger.info('Generating test cases using LLM');
      
      const testCases = await this.llmService.generateTestCases(diffContent, projectContext);
      
      this.logger.info('Test cases generated successfully', {
        testCaseCount: testCases.testCases?.length || 0
      });

      return testCases;
    } catch (error) {
      this.logger.error('Failed to generate test cases with LLM, using fallback:', error);
      return this.llmService.getFallbackTestCases();
    }
  }

  /**
   * Setup state machine event listeners
   */
  setupStateMachineListeners(stateMachine, message) {
    stateMachine.on('transition', (fromState, toState, context) => {
      this.logger.info(`State transition: ${fromState} → ${toState}`, {
        jobId: message.id,
        fromState,
        toState,
        context: Object.keys(context)
      });
    });

    stateMachine.on('error', (error, context) => {
      this.logger.error(`State machine error:`, {
        jobId: message.id,
        error: error.message,
        state: stateMachine.getCurrentState()
      });
    });

    stateMachine.on('metric:added', (key, value) => {
      this.logger.debug(`Metric added: ${key} = ${value}`, { jobId: message.id });
    });
  }

  /**
   * Acknowledge successful message processing
   */
  async acknowledgeMessage(message) {
    try {
      if (this.queue.ackMessage) {
        // SQS queue
        await this.queue.ackMessage(message);
      } else {
        // Local queue
        await this.queue.ack(message.id);
      }
    } catch (error) {
      this.logger.error('Failed to acknowledge message:', error);
    }
  }

  /**
   * Handle failed message processing
   */
  async handleFailedMessage(message, error) {
    try {
      if (this.queue.nackMessage) {
        // SQS queue
        await this.queue.nackMessage(message, { requeue: false });
      } else {
        // Local queue
        await this.queue.nack(message.id, { requeue: false });
      }
    } catch (nackError) {
      this.logger.error('Failed to nack message:', nackError);
    }
  }

  /**
   * Update worker metrics
   */
  updateMetrics(processingTime, success) {
    this.metrics.jobsProcessed++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.jobsProcessed;
    
    if (success) {
      this.metrics.jobsSucceeded++;
    } else {
      this.metrics.jobsFailed++;
    }
  }

  /**
   * Get worker status and metrics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs.size,
      totalJobs: this.jobCount,
      errorCount: this.errorCount,
      metrics: { ...this.metrics },
      queueStats: this.queue ? this.queue.getStats() : null
    };
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new OrchestratorWorker();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  // Start worker
  worker.initialize()
    .then(() => worker.start())
    .catch(error => {
      console.error('Failed to start worker:', error);
      process.exit(1);
    });
}

export default OrchestratorWorker;
