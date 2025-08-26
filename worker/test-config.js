#!/usr/bin/env node

/**
 * Test script for configuration validation
 * Run with: node test-config.js
 */

import dotenv from 'dotenv';
import config from './src/config/env.js';

// Load environment variables
dotenv.config();

function testConfiguration() {
  console.log('🧪 Testing Configuration...\n');

  try {
    // Test 1: Environment Detection
    console.log('1️⃣ Environment Detection:');
    console.log(`   - NODE_ENV: ${config.environment}`);
    console.log(`   - Is Production: ${config.isProduction}`);
    console.log(`   - Is Development: ${config.isDevelopment}\n`);

    // Test 2: Queue Configuration
    console.log('2️⃣ Queue Configuration:');
    console.log(`   - Queue Type: ${config.queue.type}`);
    if (config.queue.sqs.url) {
      console.log(`   - SQS URL: ${config.queue.sqs.url}`);
      console.log(`   - AWS Region: ${config.queue.sqs.region}`);
    }
    console.log('');

    // Test 3: Database Configuration
    console.log('3️⃣ Database Configuration:');
    console.log(`   - Host: ${config.database.host}`);
    console.log(`   - Port: ${config.database.port}`);
    console.log(`   - Database: ${config.database.name}`);
    console.log(`   - User: ${config.database.user}`);
    console.log(`   - Password: ${config.database.password ? '***' : 'Not set'}`);
    console.log(`   - Pool Size: ${config.database.poolSize}`);
    console.log(`   - SSL: ${config.database.ssl ? 'Enabled' : 'Disabled'}`);
    console.log(`   - SSL Reject Unauthorized: ${config.database.sslRejectUnauthorized}`);
    console.log(`   - Connection String: ${config.database.url}`);
    console.log('');

    // Test 4: LLM Configuration
    console.log('4️⃣ LLM Configuration:');
    console.log(`   - Provider: ${config.llm.provider}`);
    if (config.llm.gemini.apiKey) {
      console.log(`   - Gemini Model: ${config.llm.gemini.model}`);
      console.log(`   - Gemini API Key: ${config.llm.gemini.apiKey ? '***' : 'Not set'}`);
    }
    if (config.llm.bedrock.modelId) {
      console.log(`   - Bedrock Model: ${config.llm.bedrock.modelId}`);
      console.log(`   - Bedrock Region: ${config.llm.bedrock.region}`);
    }
    console.log('');

    // Test 5: MCP Configuration
    console.log('5️⃣ MCP Configuration:');
    console.log(`   - Server URL: ${config.mcp.serverUrl}`);
    console.log('');

    // Test 6: Worker Configuration
    console.log('6️⃣ Worker Configuration:');
    console.log(`   - Max Retry: ${config.worker.maxRetry}`);
    console.log(`   - Confidence Threshold: ${config.worker.confidenceThreshold}`);
    console.log(`   - Concurrency: ${config.worker.concurrency}`);
    console.log('');

    // Test 7: Validation Results
    console.log('7️⃣ Configuration Validation:');
    
    const validationResults = {
      'Environment': config.environment ? '✅ Valid' : '❌ Missing',
      'Queue Type': config.queue.type ? '✅ Valid' : '❌ Missing',
      'Database Host': config.database.host ? '✅ Valid' : '❌ Missing',
      'Database Name': config.database.name ? '✅ Valid' : '❌ Missing',
      'Database User': config.database.user ? '✅ Valid' : '❌ Missing',
      'Database Password': config.database.password ? '✅ Valid' : '❌ Missing',
      'LLM Provider': config.llm.provider ? '✅ Valid' : '❌ Missing',
      'MCP Server': config.mcp.serverUrl ? '✅ Valid' : '❌ Missing'
    };

    for (const [key, value] of Object.entries(validationResults)) {
      console.log(`   - ${key}: ${value}`);
    }

    // Test 8: Mode-Specific Validation
    console.log('\n8️⃣ Mode-Specific Validation:');
    
    if (config.isDevelopment) {
      console.log('   🔄 Development Mode:');
      if (config.llm.gemini.apiKey) {
        console.log('      - Gemini API Key: ✅ Configured');
      } else {
        console.log('      - Gemini API Key: ❌ Required for development');
      }
      if (config.queue.type === 'local') {
        console.log('      - Local Queue: ✅ Configured');
      } else {
        console.log('      - Local Queue: ❌ Should be local for development');
      }
    }

    if (config.isProduction) {
      console.log('   🚀 Production Mode:');
      if (config.aws.accessKeyId && config.aws.secretAccessKey) {
        console.log('      - AWS Credentials: ✅ Configured');
      } else {
        console.log('      - AWS Credentials: ❌ Required for production');
      }
      if (config.queue.sqs.url) {
        console.log('      - SQS Queue: ✅ Configured');
      } else {
        console.log('      - SQS Queue: ❌ Required for production');
      }
    }

    console.log('\n🎉 Configuration test completed!');
    
    // Summary
    const hasErrors = Object.values(validationResults).some(result => result.includes('❌'));
    if (hasErrors) {
      console.log('\n⚠️  Some configuration issues detected. Please check the items marked with ❌');
    } else {
      console.log('\n✅ All configuration items are valid!');
    }

  } catch (error) {
    console.error('\n❌ Configuration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testConfiguration();
}

export { testConfiguration };
