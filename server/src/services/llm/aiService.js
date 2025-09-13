import { GoogleGenerativeAI } from '@google/generative-ai';
import langchainService from './langchainService.js';
import { logger } from '../../utils/logger.js';

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }
  }

  async isAvailable() {
    if (!this.genAI) {
      return false;
    }
    
    try {
      // Test connection with a simple request
      const result = await this.model.generateContent('Hello');
      const response = await result.response;
      return response !== null;
    } catch (error) {
      logger.error('AI service not available:', error.message);
      return false;
    }
  }

  async generateTestCases(codeContent, instruction, filePath = null) {
    // Use LangChain service only
    try {
      const isLangChainAvailable = await langchainService.isAvailable();
      if (isLangChainAvailable) {
        logger.info('Using LangChain for test case generation');
        return await langchainService.generateTestCases(codeContent, instruction, filePath);
      } else {
        throw new Error('LangChain service not available');
      }
    } catch (error) {
      logger.error('Error generating test cases with LangChain:', error);
      throw error;
    }
  }

  async generateTestScripts(approvedTestCases, instruction, projectStructure = null) {
    // Try LangChain first, fallback to direct Gemini
    try {
      const isLangChainAvailable = await langchainService.isAvailable();
      if (isLangChainAvailable) {
        logger.info('Using LangChain for test script generation');
        return await langchainService.generateTestScripts(approvedTestCases, instruction, projectStructure);
      }
    } catch (error) {
      logger.warn('LangChain failed, falling back to direct Gemini:', error.message);
    }

    if (!this.genAI) {
      throw new Error('AI service not configured');
    }

    try {
      const prompt = this.buildTestScriptsPrompt(approvedTestCases, instruction, projectStructure);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Return the raw code content directly
      return text;
    } catch (error) {
      logger.error('Error generating test scripts with AI:', error);
      throw new Error(`Failed to generate test scripts: ${error.message}`);
    }
  }

  buildTestCasesPrompt(codeContent, instruction) {
    const testingLanguage = instruction.testingLanguage || 'javascript';
    const testingFramework = instruction.testingFramework || 'jest';
    const customInstructions = instruction.customInstructions || '';
    const selectedTemplates = instruction.selectedTemplates || [];

    return `You are an expert Unit Testing engineer specializing in ${testingLanguage} and ${testingFramework} framework. Generate comprehensive UNIT TEST cases for the following code.

CODE TO TEST:
\`\`\`${testingLanguage}
${codeContent}
\`\`\`

UNIT TESTING REQUIREMENTS:
- Language: ${testingLanguage}
- Framework: ${testingFramework}
- Focus: UNIT TESTS ONLY (not integration or e2e)
- Custom Instructions: ${customInstructions}
- Selected Templates: ${selectedTemplates.join(', ')}

UNIT TEST STRUCTURE (Arrange-Act-Assert):
- **Arrange**: Setup test data, mocks, and dependencies
- **Act**: Execute the specific function/method being tested
- **Assert**: Verify the expected behavior and outcomes

Please generate unit test cases in the following JSON format:
[
  {
    "id": "unit_test_001",
    "title": "Should return correct result when valid input provided",
    "description": "Test specific function behavior with valid input parameters",
    "testType": "unit",
    "priority": "high|medium|low",
    "testSteps": [
      "Arrange: Setup valid input data and mock dependencies",
      "Act: Call function with test input",
      "Assert: Verify return value matches expected result"
    ],
    "expectedResult": "Function should return expected output without errors",
    "testData": {
      "input": "test input parameters",
      "expected": "expected return value",
      "mockData": "any required mock data or dependencies"
    }
  }
]

UNIT TEST FOCUS AREAS (PRIORITIZE FOR MAXIMUM COVERAGE):
1. **Core Function Logic**: Test main business logic and calculations
2. **Input Validation**: Test valid, invalid, and edge case inputs
3. **Error Handling**: Test exception scenarios and error conditions
4. **Edge Cases**: Test boundary values, null/undefined inputs, empty data
5. **Function Return Values**: Test what functions return
6. **Data Transformation**: Test data processing and conversion
7. **State Changes**: Test how functions modify state or data
8. **Conditional Branches**: Test all if/else, switch, and ternary conditions
9. **Loop Logic**: Test for/while loops and iterations
10. **Async Operations**: Test promises, callbacks, and async/await

COVERAGE OPTIMIZATION STRATEGY:
- Focus on testing the most critical and complex functions first
- Ensure each test case covers different code paths and branches
- Prioritize functions with high cyclomatic complexity
- Test both positive and negative scenarios
- Include boundary value testing for numeric inputs
- Test all conditional branches and error paths

Generate 3-5 high-quality unit test cases that maximize code coverage (>80%) while focusing on the most critical functionality. Quality over quantity - each test should cover unique code paths.`;
  }

  buildTestScriptsPrompt(approvedTestCases, instruction, projectStructure = null) {
    const testingLanguage = instruction.testingLanguage || 'javascript';
    const testingFramework = instruction.testingFramework || 'jest';

    let projectInfo = '';
    if (projectStructure) {
      projectInfo = `

PROJECT STRUCTURE:
\`\`\`json
${JSON.stringify(projectStructure, null, 2)}
\`\`\`

        IMPORTANT: Use the correct import paths based on the project structure above. The test files are in the 'test/' directory and need to import from the correct relative paths to the source files.

        SAMPLE TEST CASES FOR REFERENCE:
        \`\`\`javascript
        // Math API Test Example
        it('should add two numbers correctly', async () => {
          const res = await request(app)
            .post('/api/math/add')
            .send({ a: 5, b: 3 });
          expect(res.statusCode).toBe(200);
          expect(res.body).toEqual({ 
            operation: "addition", 
            operands: { a: 5, b: 3 }, 
            result: 8 
          });
        });

        // String API Test Example
        it('should reverse a string correctly', async () => {
          const res = await request(app)
            .post('/api/string/reverse')
            .send({ text: "hello" });
          expect(res.statusCode).toBe(200);
          expect(res.body).toEqual({ 
            operation: "reverse", 
            input: "hello", 
            result: "olleh" 
          });
        });
        \`\`\`
        `;
        }

    return `Generate unit test scripts for the following approved test cases using ${testingLanguage} and ${testingFramework} framework.

APPROVED TEST CASES:
\`\`\`json
${JSON.stringify(approvedTestCases, null, 2)}
\`\`\`${projectInfo}

TESTING REQUIREMENTS:
- Language: ${testingLanguage}
- Framework: ${testingFramework}

CRITICAL REQUIREMENTS:
1. Return ONLY the raw test code content. Do NOT wrap in markdown code blocks (\`\`\`js or \`\`\`). Return pure code only.
2. Use correct import paths based on the project structure above
3. For Express app testing: import app from '../server' (not '../../app')
4. For service testing: import service functions correctly based on project structure
5. Use proper ${testingFramework} syntax and assertions
6. Handle async operations properly with async/await
7. Include proper error handling and edge cases
8. Write clear, descriptive test names that match the test case descriptions
9. Use realistic test data that matches the expected behavior
10. Ensure all tests are independent and can run in any order

API TESTING GUIDELINES:
- For API endpoint tests, use the correct URL patterns:
  * Math APIs: /api/math/{operation} (add, subtract, multiply, divide)
  * String APIs: /api/string/{operation} (reverse, word-count, palindrome, capitalize, char-count)
- Use correct request parameter names:
  * Math operations: { a: number, b: number }
  * String operations: { text: string }
- Expect correct response formats:
  * Math: { operation: string, operands: {a: number, b: number}, result: number }
  * String: { operation: string, input: string, result: object/string }
- For error cases, expect 400 status with proper error messages
- Use supertest for API testing: const request = require('supertest'); const app = require('../server');

RESPONSE FORMAT EXAMPLES:
- Math addition: { operation: "addition", operands: {a: 5, b: 3}, result: 8 }
- String reverse: { operation: "reverse", input: "hello", result: "olleh" }
- String palindrome: { operation: "palindrome", input: "racecar", result: { isPalindrome: true, cleanedText: "racecar", reversedText: "racecar" } }
- String word count: { operation: "word-count", input: "hello world", result: { wordCount: 2, words: ["hello", "world"] } }
- Error response: { error: "Lỗi chia cho 0", message: "Không thể chia cho 0" }

TEST CASE COMPLEXITY GUIDELINES:
- Use simple, clear test cases that are easy to understand and maintain
- Avoid overly complex inputs that may cause parsing issues
- For palindrome tests, use simple words like "racecar" instead of complex sentences
- For math tests, use small, round numbers for easier verification
- Focus on testing the core functionality, not edge cases in initial tests

TEST STRUCTURE GUIDELINES:
- Use describe() blocks to group related tests
- Use it() or test() for individual test cases
- Use expect() for assertions
- Use async/await for asynchronous operations
- Mock external dependencies if needed
- Clean up after each test if necessary

Generate complete, runnable test code that will pass immediately without modification. Return ONLY the raw code, no other text.`;
  }

  parseTestCasesResponse(response) {
    try {
      // Clean the response first
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Try to find complete JSON array - use greedy match to get the full array
      const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const jsonString = arrayMatch[0];
        logger.info('Found JSON array in response, attempting to parse...');
        logger.info('JSON string length:', jsonString.length);
        
        try {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (parseError) {
          logger.warn('Failed to parse array, trying to fix JSON...');
          // Try to fix common JSON issues
          const fixedJson = this.fixJsonString(jsonString);
          if (fixedJson) {
            try {
              return JSON.parse(fixedJson);
            } catch (secondError) {
              logger.warn('Failed to parse fixed JSON, trying to extract partial data...');
              return this.extractPartialTestCases(jsonString);
            }
          }
        }
      }
      
      // If no complete array found, try to extract partial data
      logger.warn('No complete JSON array found, trying to extract partial data...');
      return this.extractPartialTestCases(cleanResponse);
      
      // Try to find JSON object if array not found
      const objectMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        const jsonString = objectMatch[0];
        logger.info('Found JSON object in response, attempting to parse...');
        try {
          const parsed = JSON.parse(jsonString);
          // If it's an object, try to extract array from it
          if (parsed.testCases && Array.isArray(parsed.testCases)) {
            return parsed.testCases;
          }
          if (parsed.cases && Array.isArray(parsed.cases)) {
            return parsed.cases;
          }
          // If it's a single test case, wrap in array
          if (parsed.id || parsed.title) {
            return [parsed];
          }
        } catch (parseError) {
          logger.warn('Failed to parse object, trying to fix JSON...');
          const fixedJson = this.fixJsonString(jsonString);
          if (fixedJson) {
            const parsed = JSON.parse(fixedJson);
            if (parsed.testCases && Array.isArray(parsed.testCases)) {
              return parsed.testCases;
            }
            if (parsed.cases && Array.isArray(parsed.cases)) {
              return parsed.cases;
            }
            if (parsed.id || parsed.title) {
              return [parsed];
            }
          }
        }
      }
      
      logger.warn('No valid JSON found in response, throwing error');
      logger.warn('Response preview:', cleanResponse.substring(0, 200) + '...');
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      logger.error('Error parsing test cases response:', error);
      logger.error('Response content:', response.substring(0, 1000) + '...');
      throw error;
    }
  }

  extractPartialTestCases(response) {
    try {
      logger.info('Extracting partial test cases from response...');
      
      // Try to find individual test case objects
      const testCaseMatches = response.match(/\{[^{}]*"id"[^{}]*"title"[^{}]*\}/g);
      if (testCaseMatches && testCaseMatches.length > 0) {
        const testCases = [];
        
        for (const match of testCaseMatches) {
          try {
            // Try to complete the object
            let completed = match;
            if (!completed.includes('"testType"')) {
              completed = completed.replace(/(\})/, '"testType": "unit", "priority": "medium", "testSteps": [], "expectedResult": "Test should pass", "testData": {} }');
            }
            
            const parsed = JSON.parse(completed);
            if (parsed.id && parsed.title) {
              testCases.push({
                id: parsed.id || `partial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: parsed.title || 'Partial Test Case',
                description: parsed.description || 'Generated from partial data',
                testType: parsed.testType || 'unit',
                priority: parsed.priority || 'medium',
                testSteps: parsed.testSteps || ['Setup', 'Execute', 'Verify'],
                expectedResult: parsed.expectedResult || 'Test should pass',
                testData: parsed.testData || {}
              });
            }
          } catch (error) {
            logger.warn('Failed to parse individual test case:', error.message);
            continue;
          }
        }
        
        if (testCases.length > 0) {
          logger.info(`Extracted ${testCases.length} partial test cases`);
          return testCases;
        }
      }
      
      // If no individual test cases found, throw error
      logger.warn('No partial test cases found, throwing error');
      throw new Error('No partial test cases found in AI response');
    } catch (error) {
      logger.error('Error extracting partial test cases:', error);
      throw error;
    }
  }

  fixJsonString(jsonString) {
    try {
      logger.info('Attempting to fix JSON string, length:', jsonString.length);
      
      // Remove trailing commas before closing brackets/braces
      let fixed = jsonString
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{\[]\s*),/g, '$1')
        .replace(/,(\s*[}\]])/g, '$1');
      
      // Fix common JSON issues
      fixed = fixed
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{\[]\s*),/g, '$1') // Remove leading commas
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas again
      
      // Try to find and fix incomplete objects
      const incompleteObjectMatch = fixed.match(/(.*"testData":\s*\{[^}]*)(?=\s*[}\]])/);
      if (incompleteObjectMatch) {
        // Find the last complete test case
        const lastCompleteMatch = fixed.match(/(.*"testData":\s*\{[^}]*\}[^}]*\})/);
        if (lastCompleteMatch) {
          fixed = lastCompleteMatch[1];
        }
      }
      
      // Try to complete incomplete arrays
      if (fixed.includes('"testSteps": [') && !fixed.includes(']')) {
        // Find the last complete test case and truncate there
        const lastCompleteMatch = fixed.match(/(.*"testData":\s*\{[^}]*\}[^}]*\})/);
        if (lastCompleteMatch) {
          fixed = lastCompleteMatch[1] + ']';
        }
      }
      
      // Ensure proper array closure
      if (fixed.startsWith('[') && !fixed.endsWith(']')) {
        // Count opening and closing brackets
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        
        if (openBrackets > closeBrackets) {
          fixed = fixed + ']';
        }
      }
      
      // Try to fix malformed property names
      fixed = fixed.replace(/([^"])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // Try to fix missing quotes around property names
      fixed = fixed.replace(/([^"])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      logger.info('Fixed JSON string, new length:', fixed.length);
      return fixed;
    } catch (error) {
      logger.error('Error fixing JSON string:', error);
      return null;
    }
  }



}

export default new AIService();

