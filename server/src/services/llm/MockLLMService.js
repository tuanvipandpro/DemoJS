import { ILLMService } from './ILLMService.js';
import { logger } from '../../utils/logger.js';

/**
 * Mock LLM Service cho development và testing
 * Trả về dữ liệu mẫu thay vì gọi AI service thực
 */
export class MockLLMService extends ILLMService {
  constructor(config = {}) {
    super(config);
    this.logger = logger;
    this.logger.info('Mock LLM Service initialized');
  }

  async generateTestProposals(diffSummary, context, options = {}) {
    this.logger.info('Generating mock test proposals');
    
    // Tạo test proposals mẫu dựa trên diff summary
    const proposals = [
      {
        id: 'proposal-1',
        title: 'Test user authentication function',
        description: 'Verify that the new authentication function handles valid and invalid credentials correctly',
        testType: 'unit',
        priority: 'high',
        estimatedTime: '15 minutes',
        code: `
describe('User Authentication', () => {
  test('should authenticate valid user credentials', () => {
    const result = authenticateUser('valid@email.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  test('should reject invalid credentials', () => {
    const result = authenticateUser('invalid@email.com', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
        `,
        confidence: 0.85
      },
      {
        id: 'proposal-2',
        title: 'Test input validation',
        description: 'Ensure input validation works for edge cases like empty strings and special characters',
        testType: 'unit',
        priority: 'medium',
        estimatedTime: '10 minutes',
        code: `
describe('Input Validation', () => {
  test('should handle empty email', () => {
    const result = authenticateUser('', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  test('should handle special characters in password', () => {
    const result = authenticateUser('test@email.com', 'pass@word#123');
    expect(result.success).toBe(true);
  });
});
        `,
        confidence: 0.78
      },
      {
        id: 'proposal-3',
        title: 'Test error handling',
        description: 'Verify that the function properly handles and reports errors',
        testType: 'unit',
        priority: 'medium',
        estimatedTime: '12 minutes',
        code: `
describe('Error Handling', () => {
  test('should handle database connection errors', () => {
    // Mock database error
    mockDatabaseError();
    const result = authenticateUser('test@email.com', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Database error');
  });
});
        `,
        confidence: 0.72
      }
    ];

    // Thêm delay để simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.logger.info(`Generated ${proposals.length} test proposals`);
    return proposals;
  }

  async generateTestPlan(diffSummary, context, options = {}) {
    this.logger.info('Generating mock test plan');
    
    const testPlan = {
      id: `plan-${Date.now()}`,
      summary: 'Comprehensive test plan for authentication function changes',
      scope: {
        files: ['src/auth/userAuth.js', 'src/utils/validation.js'],
        functions: ['authenticateUser', 'validateEmail', 'validatePassword'],
        testTypes: ['unit', 'integration']
      },
      phases: [
        {
          name: 'Unit Testing',
          description: 'Test individual functions in isolation',
          estimatedTime: '45 minutes',
          tests: ['Test user authentication function', 'Test input validation', 'Test error handling']
        },
        {
          name: 'Integration Testing',
          description: 'Test function interactions',
          estimatedTime: '30 minutes',
          tests: ['Test authentication flow', 'Test validation chain']
        }
      ],
      risks: [
        'Database connection issues during testing',
        'Edge cases not covered by current test scenarios'
      ],
      recommendations: [
        'Add more edge case tests for password validation',
        'Consider adding performance tests for large user datasets'
      ]
    };

    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.logger.info('Test plan generated successfully');
    return testPlan;
  }

  async analyzeImpact(diffSummary, context) {
    this.logger.info('Analyzing mock impact');
    
    const impact = {
      severity: 'medium',
      affectedAreas: ['User Authentication', 'Input Validation', 'Error Handling'],
      riskLevel: 'low',
      estimatedEffort: '2 hours',
      dependencies: ['Database connection', 'Email service'],
      recommendations: [
        'Run existing test suite to ensure no regressions',
        'Add integration tests for the new authentication flow',
        'Update documentation for the new function signature'
      ],
      confidence: 0.82
    };

    await new Promise(resolve => setTimeout(resolve, 600));
    
    this.logger.info('Impact analysis completed');
    return impact;
  }

  async createEmbedding(text) {
    this.logger.info('Creating mock embedding');
    
    // Tạo dummy embedding vector (1536 dimensions như OpenAI)
    const embedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
    
    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / magnitude);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.logger.info('Mock embedding created');
    return normalizedEmbedding;
  }

  async healthCheck() {
    return {
      status: 'healthy',
      service: 'Mock LLM Service',
      timestamp: new Date().toISOString(),
      features: [
        'Test Proposal Generation',
        'Test Plan Generation',
        'Impact Analysis',
        'Embedding Creation'
      ],
      config: this.config
    };
  }
}
