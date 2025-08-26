import { OrchestratorWorker } from './src/worker.js';
import { QueueFactory } from './src/queue/queueFactory.js';

/**
 * Simple test script to demonstrate worker functionality
 */
async function testWorker() {
  console.log('🚀 Testing InsightTestAI Orchestrator Worker...\n');

  try {
    // Create a local queue for testing
    const queue = QueueFactory.createQueue({ type: 'local' });
    await queue.connect();
    console.log('✅ Connected to local queue');

    // Enqueue a test message
    const testMessage = {
      type: 'PROJECT_RUN',
      projectId: 'test-project-123',
      commitId: 'abc123def456',
      repository: 'https://github.com/example/test-repo',
      branch: 'main',
      trigger: 'manual'
    };

    const messageId = await queue.enqueue(testMessage);
    console.log('✅ Enqueued test message:', messageId);

    // Create and start worker
    const worker = new OrchestratorWorker({
      concurrency: 2,
      maxRetries: 2,
      confidenceThreshold: 0.7
    });

    console.log('✅ Worker created');

    // Initialize worker
    await worker.initialize();
    console.log('✅ Worker initialized');

    // Start worker
    await worker.start();
    console.log('✅ Worker started');

    // Wait for message processing
    console.log('⏳ Waiting for message processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get worker status
    const status = worker.getStatus();
    console.log('\n📊 Worker Status:');
    console.log(JSON.stringify(status, null, 2));

    // Stop worker
    await worker.stop();
    console.log('✅ Worker stopped');

    // Disconnect queue
    await queue.disconnect();
    console.log('✅ Queue disconnected');

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWorker();
}

export { testWorker };
