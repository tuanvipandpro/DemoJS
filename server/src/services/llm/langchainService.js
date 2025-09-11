import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { logger } from '../../utils/logger.js';

class LangChainService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY not found in environment variables');
      this.model = null;
    } else {
      this.model = new ChatGoogleGenerativeAI({
        model: this.modelName,
        apiKey: this.apiKey,
        temperature: 0.7
        // Removed maxOutputTokens to allow unlimited response size
      });
    }
  }

  async isAvailable() {
    if (!this.model) {
      return false;
    }
    
    try {
      // Test connection with a simple request
      const response = await this.model.invoke('Hello');
      return response !== null;
    } catch (error) {
      logger.error('LangChain service not available:', error.message);
      logger.error('LangChain error details:', error);
      return false;
    }
  }

  async generateTestCases(codeContent, instruction, filePath = '') {
    if (!this.model) {
      throw new Error('LangChain service not configured');
    }

    // Check if file needs unit testing
    if (filePath && !this.shouldGenerateUnitTests(filePath, codeContent)) {
      logger.info(`Skipping unit test generation for file: ${filePath}`);
      return [];
    }

    try {
             // Đơn giản hóa prompt - chỉ cần source code, bỏ instruction
       const prompt = PromptTemplate.fromTemplate(`
You are a software testing expert. Generate comprehensive test cases for the following JavaScript code.

Code to test:
\`\`\`javascript
{codeContent}
\`\`\`

IMPORTANT: Return ONLY a valid JSON array. Do NOT wrap the response in markdown code blocks (\`\`\`json or \`\`\`). Return pure JSON only.

Required JSON format:
[
  {{
    "id": "test_001",
    "title": "Test case name",
    "input": "input data",
    "expected": "expected output",
    "description": "test description"
  }}
]

Return ONLY the JSON array, no other text.
       `);

      const outputParser = new StringOutputParser();

      const chain = RunnableSequence.from([
        prompt,
        this.model,
        outputParser
      ]);

      logger.info('Invoking LangChain chain with:', {
        codeContentLength: codeContent.length,
        instructionLength: instruction?.length || 0,
        modelType: this.model.constructor.name
      });

                           // Optimized prompt for maximum coverage with 3-5 test cases
       const message = `You are a software testing expert specializing in maximizing code coverage. Generate 3-5 high-quality test cases for the following JavaScript code that achieve >80% coverage.

Code to test:
\`\`\`javascript
${codeContent}
\`\`\`

COVERAGE OPTIMIZATION STRATEGY:
- Focus on testing the most critical and complex functions first
- Ensure each test case covers different code paths and branches
- Prioritize functions with high cyclomatic complexity
- Test both positive and negative scenarios
- Include boundary value testing for numeric inputs
- Test all conditional branches and error paths
- Cover all if/else, switch, and ternary conditions
- Test loop logic and iterations
- Test async operations if present

TEST FOCUS AREAS (in priority order):
1. Core business logic and calculations
2. Input validation and edge cases
3. Error handling and exception scenarios
4. Conditional branches and decision points
5. Loop logic and iterations
6. Function return values
7. Data transformation and processing
8. State changes and side effects
9. Async operations and promises
10. Boundary values and null/undefined inputs

IMPORTANT: Return ONLY a valid JSON array. Do NOT wrap the response in markdown code blocks (\`\`\`json or \`\`\`). Return pure JSON only.

Required JSON format:
[
  {{
    "id": "test_001",
    "title": "Test case name",
    "input": "input data",
    "expected": "expected output",
    "description": "test description"
  }}
]

Generate 3-5 test cases that maximize code coverage while focusing on the most critical functionality. Quality over quantity - each test should cover unique code paths.

Return ONLY the JSON array, no other text.`;

       const result = await this.model.invoke(message).catch(error => {
         logger.error('Model invoke error:', error);
         throw new Error(`Model invoke failed: ${error.message}`);
       });

       // Extract response text
       let responseText = '';
       if (typeof result === 'string') {
         responseText = result;
       } else if (result && result.content) {
         responseText = result.content;
       } else if (result && result.text) {
         responseText = result.text;
       } else {
         throw new Error('Invalid response format from model');
       }

       logger.info('AI response length:', responseText.length);
       
       // Return response directly without parsing
       return responseText;
    } catch (error) {
      logger.error('Error generating test cases with LangChain:', error);
      throw error;
    }
  }

  async generateTestScripts(approvedTestCases, instruction) {
    if (!this.model) {
      throw new Error('LangChain service not configured');
    }

    try {
      const prompt = PromptTemplate.fromTemplate(`
You are an expert software testing engineer. Generate unit test scripts for the following approved test cases.

APPROVED TEST CASES:
\`\`\`json
{approvedTestCases}
\`\`\`

TESTING REQUIREMENTS:
- Language: {testingLanguage}
- Framework: {testingFramework}

IMPORTANT: Return ONLY the raw test code content. Do NOT wrap in markdown code blocks (\`\`\`js or \`\`\`). Return pure code only.

Requirements:
1. Use proper {testingFramework} syntax
2. Include necessary imports and setup
3. Write clear, descriptive test names
4. Include proper assertions
5. Handle async operations if needed
6. Include test data setup and teardown
7. Follow best practices for {testingLanguage} testing

Generate complete, runnable test code. Return ONLY the raw code, no other text.
      `);

      const outputParser = new StringOutputParser();

      const chain = RunnableSequence.from([
        prompt,
        this.model,
        outputParser
      ]);

      const result = await chain.invoke({
        approvedTestCases: JSON.stringify(approvedTestCases, null, 2),
        testingLanguage: instruction.testingLanguage || 'javascript',
        testingFramework: instruction.testingFramework || 'jest'
      });

      // Handle LangChain response - result should be a string from StringOutputParser
      if (typeof result !== 'string') {
        logger.error('Unexpected LangChain response type:', typeof result, result);
        throw new Error('Invalid response type from LangChain');
      }

      // Return the raw code content directly
      return result;
    } catch (error) {
      logger.error('Error generating test scripts with LangChain:', error);
      throw new Error(`Failed to generate test scripts: ${error.message}`);
    }
  }

  async generateTestReport(testResults, run) {
    if (!this.model) {
      throw new Error('LangChain service not configured');
    }

    try {
      const prompt = PromptTemplate.fromTemplate(`
You are an expert software testing analyst. Generate a comprehensive test report based on the following test results.

TEST RESULTS:
\`\`\`json
{testResults}
\`\`\`

PROJECT INFORMATION:
- Project: {projectName}
- Branch: {branch}
- Commit: {commitId}

IMPORTANT: Return ONLY a valid JSON object. Do NOT wrap the response in markdown code blocks (\`\`\`json or \`\`\`). Return pure JSON only.

Required JSON format:
{{
  "summary": {{
    "totalTests": number,
    "passedTests": number,
    "failedTests": number,
    "passRate": "percentage",
    "duration": "execution time"
  }},
  "coverage": {{
    "lines": percentage,
    "branches": percentage,
    "functions": percentage
  }},
  "testDetails": [
    {{
      "path": "test file path",
      "status": "passed|failed",
      "duration": "execution time",
      "issues": ["list of issues if any"]
    }}
  ],
  "recommendations": [
    "list of recommendations for improvement"
  ],
  "qualityScore": number,
  "riskAssessment": "low|medium|high"
}}

Focus on:
1. Clear summary of test results
2. Coverage analysis
3. Quality assessment
4. Actionable recommendations
5. Risk evaluation

Return ONLY the JSON object, no other text.
      `);

      const outputParser = new StringOutputParser();

      const chain = RunnableSequence.from([
        prompt,
        this.model,
        outputParser
      ]);

      const result = await chain.invoke({
        testResults: JSON.stringify(testResults, null, 2),
        projectName: run.name || 'Unknown Project',
        branch: run.branch || 'main',
        commitId: run.commit_id || 'N/A'
      });

      return this.parseTestReportResponse(result);
    } catch (error) {
      logger.error('Error generating test report with LangChain:', error);
      throw new Error(`Failed to generate test report: ${error.message}`);
    }
  }


  // Check if file needs unit testing - simplified for JavaScript + Jest
  shouldGenerateUnitTests(filePath, fileContent) {
    try {
      // Only process JavaScript files for Jest testing
      if (!filePath.match(/\.(js|jsx)$/i)) {
        logger.info(`Skipping non-JS file: ${filePath}`);
        return false;
      }

      // Skip test files
      if (filePath.match(/\.(test|spec)\.(js|jsx)$/i)) {
        logger.info(`Skipping test file: ${filePath}`);
        return false;
      }

      // Skip node_modules and build directories
      if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('build')) {
        logger.info(`Skipping build/dependency file: ${filePath}`);
        return false;
      }

      // Skip package.json and config files
      if (filePath.match(/(package\.json|\.config\.js|webpack\.config\.js|vite\.config\.js)$/i)) {
        logger.info(`Skipping config file: ${filePath}`);
        return false;
      }

      // All other JS files should have unit tests
      logger.info(`File needs unit testing: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Error checking file ${filePath}:`, error);
      return false;
    }
  }


  parseTestReportResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // No fallback - throw error if parsing fails
      logger.error('Failed to parse test report response');
      throw new Error('Failed to parse test report response');
    } catch (error) {
      logger.error('Error parsing test report response:', error);
      throw new Error(`Failed to parse test report response: ${error.message}`);
    }
  }



}

export { LangChainService };
export default new LangChainService();



