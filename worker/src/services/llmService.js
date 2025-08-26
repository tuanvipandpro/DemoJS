import axios from 'axios';
import config from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Abstract LLM Service Interface
 */
export class LLMService {
  constructor() {
    this.provider = config.llm.provider;
    this.logger = logger;
  }

  /**
   * Generate content using the configured LLM provider
   */
  async generateContent(prompt, options = {}) {
    switch (this.provider) {
      case 'gemini':
        return this.generateWithGemini(prompt, options);
      case 'bedrock':
        return this.generateWithBedrock(prompt, options);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  /**
   * Generate test plan using LLM
   */
  async generateTestPlan(repository, commitId, diffContent = '') {
    const prompt = this.buildTestPlanPrompt(repository, commitId, diffContent);
    
    try {
      const response = await this.generateContent(prompt, {
        maxTokens: 2000,
        temperature: 0.3,
        systemPrompt: 'You are an expert QA engineer and test automation specialist.'
      });

      return this.parseTestPlanResponse(response);
    } catch (error) {
      this.logger.error('Failed to generate test plan:', error);
      return this.getFallbackTestPlan();
    }
  }

  /**
   * Analyze test results and provide insights
   */
  async analyzeTestResults(testResults, coverageData = null) {
    const prompt = this.buildAnalysisPrompt(testResults, coverageData);
    
    try {
      const response = await this.generateContent(prompt, {
        maxTokens: 1500,
        temperature: 0.2,
        systemPrompt: 'You are an expert QA analyst who provides actionable insights from test results.'
      });

      return this.parseAnalysisResponse(response);
    } catch (error) {
      this.logger.error('Failed to analyze test results:', error);
      return this.getFallbackAnalysis(testResults);
    }
  }

  /**
   * Generate test cases based on code changes
   */
  async generateTestCases(diffContent, projectContext = {}) {
    const prompt = this.buildTestCasePrompt(diffContent, projectContext);
    
    try {
      const response = await this.generateContent(prompt, {
        maxTokens: 3000,
        temperature: 0.4,
        systemPrompt: 'You are an expert test engineer who creates comprehensive test cases.'
      });

      return this.parseTestCaseResponse(response);
    } catch (error) {
      this.logger.error('Failed to generate test cases:', error);
      return this.getFallbackTestCases();
    }
  }

  /**
   * Build test plan prompt
   */
  buildTestPlanPrompt(repository, commitId, diffContent) {
    return `Analyze the following repository and commit to create a comprehensive test plan:

Repository: ${repository}
Commit ID: ${commitId}
${diffContent ? `Code Changes:\n${diffContent}` : 'No diff content provided'}

Please provide a structured test plan including:
1. Test priorities (high/medium/low)
2. Test types needed (unit, integration, e2e)
3. Specific areas to focus on
4. Tools and approaches to use
5. Confidence level assessment

Format the response as JSON with the following structure:
{
  "tests": [
    {"name": "Test Name", "priority": "high|medium|low", "type": "unit|integration|e2e", "description": "What to test"}
  ],
  "tools": ["tool1", "tool2"],
  "confidence": 0.85,
  "reasoning": "Brief explanation of the plan"
}`;
  }

  /**
   * Build analysis prompt
   */
  buildAnalysisPrompt(testResults, coverageData) {
    return `Analyze the following test results and provide insights:

Test Results: ${JSON.stringify(testResults, null, 2)}
${coverageData ? `Coverage Data: ${JSON.stringify(coverageData, null, 2)}` : 'No coverage data'}

Please provide:
1. Overall assessment of test quality
2. Areas of concern
3. Recommendations for improvement
4. Confidence level in the results
5. Next steps

Format as JSON:
{
  "confidence": 0.8,
  "summary": "Brief summary",
  "recommendations": ["rec1", "rec2"],
  "nextSteps": ["step1", "step2"],
  "qualityScore": 85
}`;
  }

  /**
   * Build test case prompt
   */
  buildTestCasePrompt(diffContent, projectContext) {
    return `Based on the following code changes, generate comprehensive test cases:

Code Changes:
${diffContent}

Project Context: ${JSON.stringify(projectContext, null, 2)}

Generate test cases that cover:
1. Happy path scenarios
2. Edge cases
3. Error conditions
4. Integration points

Format as JSON:
{
  "testCases": [
    {
      "name": "Test Case Name",
      "description": "What this test verifies",
      "priority": "high|medium|low",
      "steps": ["step1", "step2"],
      "expectedResult": "Expected outcome",
      "category": "unit|integration|e2e"
    }
  ],
  "coverage": "Areas covered by these tests"
}`;
  }

  /**
   * Parse test plan response
   */
  parseTestPlanResponse(response) {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      if (response.data && response.data.content) {
        const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      return this.getFallbackTestPlan();
    } catch (error) {
      this.logger.error('Failed to parse test plan response:', error);
      return this.getFallbackTestPlan();
    }
  }

  /**
   * Parse analysis response
   */
  parseAnalysisResponse(response) {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      if (response.data && response.data.content) {
        const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      return this.getFallbackAnalysis();
    } catch (error) {
      this.logger.error('Failed to parse analysis response:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Parse test case response
   */
  parseTestCaseResponse(response) {
    try {
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      if (response.data && response.data.content) {
        const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      return this.getFallbackTestCases();
    } catch (error) {
      this.logger.error('Failed to parse test case response:', error);
      return this.getFallbackTestCases();
    }
  }

  /**
   * Fallback test plan when LLM fails
   */
  getFallbackTestPlan() {
    return {
      tests: [
        { name: 'Unit Tests', priority: 'high', type: 'unit', description: 'Basic unit tests for changed components' },
        { name: 'Integration Tests', priority: 'medium', type: 'integration', description: 'Integration tests for affected modules' },
        { name: 'E2E Tests', priority: 'low', type: 'e2e', description: 'End-to-end tests for critical user flows' }
      ],
      tools: ['get_diff', 'run_ci', 'get_coverage'],
      confidence: 0.7,
      reasoning: 'Fallback plan due to LLM service unavailability'
    };
  }

  /**
   * Fallback analysis when LLM fails
   */
  getFallbackAnalysis(testResults = {}) {
    return {
      confidence: 0.6,
      summary: 'Analysis completed with fallback logic',
      recommendations: ['Consider manual review of test results', 'Verify test coverage manually'],
      nextSteps: ['Review test logs manually', 'Check for any obvious failures'],
      qualityScore: 70
    };
  }

  /**
   * Fallback test cases when LLM fails
   */
  getFallbackTestCases() {
    return {
      testCases: [
        {
          name: 'Basic Functionality Test',
          description: 'Verify basic functionality works as expected',
          priority: 'high',
          steps: ['Setup test environment', 'Execute basic operations', 'Verify results'],
          expectedResult: 'All basic operations complete successfully',
          category: 'unit'
        }
      ],
      coverage: 'Basic functionality coverage'
    };
  }
}

/**
 * Gemini LLM Implementation
 */
export class GeminiService extends LLMService {
  constructor() {
    super();
    this.apiKey = config.llm.gemini.apiKey;
    this.model = config.llm.gemini.model;
    this.apiUrl = config.llm.gemini.apiUrl;
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini provider');
    }
  }

  /**
   * Generate content using Gemini API
   */
  async generateWithGemini(prompt, options = {}) {
    const {
      maxTokens = 2048,
      temperature = 0.7,
      systemPrompt = 'You are a helpful AI assistant.'
    } = options;

    try {
      const response = await axios.post(
        `${this.apiUrl}/models/${this.model}:generateContent`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          timeout: 30000
        }
      );

      if (response.data.candidates && response.data.candidates[0]) {
        const content = response.data.candidates[0].content;
        if (content && content.parts && content.parts[0]) {
          return {
            success: true,
            data: {
              content: content.parts[0].text,
              usage: response.data.usageMetadata || {},
              model: this.model
            }
          };
        }
      }

      throw new Error('Invalid response format from Gemini API');

    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}

/**
 * AWS Bedrock LLM Implementation (for future use)
 */
export class BedrockService extends LLMService {
  constructor() {
    super();
    this.modelId = config.llm.bedrock.modelId;
    this.region = config.llm.bedrock.region;
    
    // This will be implemented when AWS Bedrock is needed
    this.logger.warn('Bedrock service not yet implemented - using fallback');
  }

  /**
   * Generate content using AWS Bedrock (placeholder)
   */
  async generateWithBedrock(prompt, options = {}) {
    // TODO: Implement AWS Bedrock integration
    this.logger.warn('Bedrock service not implemented, using fallback');
    throw new Error('Bedrock service not yet implemented');
  }
}

/**
 * LLM Service Factory
 */
export class LLMServiceFactory {
  static createService() {
    const provider = config.llm.provider;
    
    switch (provider) {
      case 'gemini':
        return new GeminiService();
      case 'bedrock':
        return new BedrockService();
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}

export default LLMServiceFactory;
