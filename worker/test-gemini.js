#!/usr/bin/env node

/**
 * Test script for Gemini API integration
 * Run with: node test-gemini.js
 */

import dotenv from 'dotenv';
import { LLMServiceFactory } from './src/services/llmService.js';
import { logger } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Integration...\n');

  try {
    // Test 1: Service Creation
    console.log('1️⃣ Testing LLM Service Creation...');
    const llmService = LLMServiceFactory.createService();
    console.log(`✅ LLM Service created successfully with provider: ${llmService.provider}\n`);

    // Test 2: Test Plan Generation
    console.log('2️⃣ Testing Test Plan Generation...');
    const testPlan = await llmService.generateTestPlan(
      'https://github.com/example/test-repo',
      'abc123def456',
      'Added new user authentication feature'
    );
    
    console.log('✅ Test Plan Generated:');
    console.log(`   - Tests: ${testPlan.tests?.length || 0}`);
    console.log(`   - Confidence: ${testPlan.confidence}`);
    console.log(`   - Tools: ${testPlan.tools?.join(', ')}`);
    console.log(`   - Reasoning: ${testPlan.reasoning}\n`);

    // Test 3: Test Case Generation
    console.log('3️⃣ Testing Test Case Generation...');
    const testCases = await llmService.generateTestCases(
      'Added new login method with OAuth2 support',
      { projectType: 'web-app', framework: 'React' }
    );
    
    console.log('✅ Test Cases Generated:');
    console.log(`   - Test Cases: ${testCases.testCases?.length || 0}`);
    console.log(`   - Coverage: ${testCases.coverage}\n`);

    // Test 4: Results Analysis
    console.log('4️⃣ Testing Results Analysis...');
    const analysis = await llmService.analyzeTestResults(
      { 
        unitTests: { passed: 15, failed: 2, total: 17 },
        integrationTests: { passed: 8, failed: 1, total: 9 },
        coverage: 85
      },
      { coverage: 85, quality: 'good' }
    );
    
    console.log('✅ Results Analysis Completed:');
    console.log(`   - Confidence: ${analysis.confidence}`);
    console.log(`   - Quality Score: ${analysis.qualityScore}`);
    console.log(`   - Summary: ${analysis.summary}`);
    console.log(`   - Recommendations: ${analysis.recommendations?.length || 0}\n`);

    // Test 5: Direct Content Generation
    console.log('5️⃣ Testing Direct Content Generation...');
    const response = await llmService.generateContent(
      'Generate a simple test case for a login function',
      { maxTokens: 500, temperature: 0.3 }
    );
    
    console.log('✅ Direct Content Generated:');
    if (response.success && response.data) {
      console.log(`   - Model: ${response.data.model}`);
      console.log(`   - Content Length: ${response.data.content?.length || 0} characters`);
      console.log(`   - Usage: ${JSON.stringify(response.data.usage)}`);
    } else {
      console.log('   - Response format:', response);
    }

    console.log('\n🎉 All tests passed successfully!');
    console.log('🚀 Gemini API integration is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide helpful debugging information
    console.log('\n🔍 Debug Information:');
    console.log(`   - LLM_PROVIDER: ${process.env.LLM_PROVIDER || 'not set'}`);
    console.log(`   - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'set' : 'not set'}`);
    console.log(`   - GEMINI_MODEL: ${process.env.GEMINI_MODEL || 'not set'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. Check your .env file has GEMINI_API_KEY');
    console.log('   2. Verify your API key is valid at Google AI Studio');
    console.log('   3. Ensure you have sufficient quota');
    console.log('   4. Check network connectivity to Google APIs');
    
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGeminiAPI();
}

export { testGeminiAPI };
