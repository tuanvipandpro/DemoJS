import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InsightTestAI API',
      version: '1.0.0',
      description: 'API for InsightTestAI - AI-powered testing automation system with RAG capabilities, LangChain integration, and AI services for intelligent test generation',
      contact: {
        name: 'InsightTestAI Team',
        email: 'support@insighttestai.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.insighttestai.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            displayName: {
              type: 'string',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            address: {
              type: 'string',
              example: '123 Main St, City, Country'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'My Test Project'
            },
            description: {
              type: 'string',
              example: 'A sample project for testing'
            },
            repository: {
              type: 'string',
              example: 'https://github.com/user/repo'
            },
            gitProvider: {
              type: 'string',
              example: 'github'
            },
            testingLanguage: {
              type: 'string',
              example: 'javascript'
            },
            testingFramework: {
              type: 'string',
              example: 'jest'
            },
            instruction: {
              type: 'string',
              description: 'Complete instruction JSON data as stringified JSON containing raw template data',
              example: '{"customInstructions":"Custom testing guidelines","selectedTemplates":[1,2,3],"testingLanguage":"javascript","testingFramework":"jest","templates":[{"id":1,"name":"Unit Test Template","description":"Template for unit testing","templateData":{"templates":[{"viewpoints":["Function behavior","Edge cases"],"test_patterns":["Arrange-Act-Assert"],"test_cases":["Happy path","Error cases"]}]},"viewpoints":["Function behavior","Edge cases"],"testPatterns":["Arrange-Act-Assert"],"testCases":["Happy path","Error cases"]}],"config":{"customInstructions":"Custom testing guidelines","selectedTemplates":[1,2,3],"testingLanguage":"javascript","testingFramework":"jest"}}'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              example: 'active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        InstructionTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'Template ID'
            },
            name: {
              type: 'string',
              example: 'Unit Test Template',
              description: 'Template name'
            },
            description: {
              type: 'string',
              example: 'Template for unit testing',
              description: 'Template description'
            },
            templateData: {
              type: 'object',
              description: 'Raw template data structure',
              properties: {
                templates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      viewpoints: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Function behavior', 'Edge cases', 'Error handling']
                      },
                      test_patterns: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Arrange-Act-Assert', 'Given-When-Then']
                      },
                      test_cases: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Happy path', 'Error cases', 'Boundary conditions']
                      }
                    }
                  }
                }
              }
            },
            viewpoints: {
              type: 'array',
              items: { type: 'string' },
              example: ['Function behavior', 'Edge cases', 'Error handling'],
              description: 'Extracted viewpoints from template data'
            },
            testPatterns: {
              type: 'array',
              items: { type: 'string' },
              example: ['Arrange-Act-Assert', 'Given-When-Then'],
              description: 'Extracted test patterns from template data'
            },
            testCases: {
              type: 'array',
              items: { type: 'string' },
              example: ['Happy path', 'Error cases', 'Boundary conditions'],
              description: 'Extracted test cases from template data'
            }
          }
        },
        Run: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            projectId: {
              type: 'integer',
              example: 1
            },
            projectName: {
              type: 'string',
              example: 'My Test Project'
            },
            userId: {
              type: 'integer',
              example: 1
            },
            userEmail: {
              type: 'string',
              example: 'user@example.com'
            },
            state: {
              type: 'string',
              enum: ['queued', 'pulling_code', 'generating_tests', 'test_approval', 'generating_scripts', 'running_tests', 'generating_report', 'report_approval', 'completed', 'failed'],
              example: 'completed'
            },
            commitId: {
              type: 'string',
              example: 'abc123def456'
            },
            branch: {
              type: 'string',
              example: 'main'
            },
            diffSummary: {
              type: 'string',
              example: 'Added new authentication module'
            },
            testPlan: {
              type: 'string',
              example: 'Test plan for authentication module'
            },
            proposals: {
              type: 'array',
              items: { $ref: '#/components/schemas/TestCase' },
              example: []
            },
            approvedTestCases: {
              type: 'array',
              items: { $ref: '#/components/schemas/TestCase' },
              example: []
            },
            testScripts: {
              type: 'array',
              items: { $ref: '#/components/schemas/TestScript' },
              example: []
            },
            testResults: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 10 },
                passed: { type: 'integer', example: 8 },
                failed: { type: 'integer', example: 2 },
                duration: { type: 'string', example: '30s' },
                coverage: { $ref: '#/components/schemas/Coverage' }
              }
            },
            coverage: {
              $ref: '#/components/schemas/Coverage'
            },
            reportUrl: {
              type: 'string',
              example: 'https://s3.amazonaws.com/bucket/reports/run-1-report.json'
            },
            mrUrl: {
              type: 'string',
              example: 'https://github.com/user/repo/pull/123'
            },
            mrNumber: {
              type: 'integer',
              example: 123
            },
            confidenceScore: {
              type: 'number',
              format: 'float',
              example: 0.85
            },
            errorMessage: {
              type: 'string',
              example: 'Test execution failed due to timeout'
            },
            decision: {
              type: 'string',
              enum: ['commit', 'pr', 'none'],
              example: 'pr'
            },
            decisionData: {
              type: 'object',
              example: { reason: 'All tests passed', confidence: 0.95 }
            },
            reportUrl: {
              type: 'string',
              example: 'https://s3.amazonaws.com/bucket/reports/run-1-report.json',
              description: 'S3 URL for the test report'
            },
            mrUrl: {
              type: 'string',
              example: 'https://github.com/user/repo/pull/123',
              description: 'Git merge request URL'
            },
            mrNumber: {
              type: 'integer',
              example: 123,
              description: 'Git merge request number'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            finishedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TestCase: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'test_case_1',
              description: 'Unique identifier for the test case'
            },
            description: {
              type: 'string',
              example: 'Test the authentication functionality',
              description: 'Detailed description of what this test case covers'
            },
            input: {
              type: 'object',
              example: {"method": "POST", "url": "/api/auth", "body": {"username": "test", "password": "test123"}},
              description: 'Input data for the test case'
            },
            expected: {
              type: 'object',
              example: {"statusCode": 200, "body": {"token": "jwt_token"}},
              description: 'Expected result of the test case'
            }
          }
        },
        TestScript: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              example: 'tests/auth.test.js'
            },
            content: {
              type: 'string',
              example: 'describe("Authentication", () => { test("should authenticate user", () => { ... }); });'
            }
          }
        },
        TestReport: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            runId: {
              type: 'integer',
              example: 1
            },
            reportType: {
              type: 'string',
              enum: ['coverage', 'execution', 'summary'],
              example: 'summary'
            },
            reportData: {
              type: 'object',
              properties: {
                summary: {
                  type: 'object',
                  properties: {
                    totalTests: { type: 'integer', example: 10 },
                    passedTests: { type: 'integer', example: 8 },
                    failedTests: { type: 'integer', example: 2 },
                    passRate: { type: 'string', example: '80.00' },
                    duration: { type: 'string', example: '30s' }
                  }
                },
                coverage: { $ref: '#/components/schemas/Coverage' },
                testDetails: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string', example: 'tests/auth.test.js' },
                      status: { type: 'string', enum: ['passed', 'failed'], example: 'passed' },
                      duration: { type: 'string', example: '2s' },
                      issues: { type: 'array', items: { type: 'string' }, example: [] }
                    }
                  }
                },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['Add more test cases for edge conditions', 'Improve error handling tests']
                },
                qualityScore: {
                  type: 'integer',
                  example: 85
                },
                riskAssessment: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  example: 'low'
                },
                generatedBy: {
                  type: 'string',
                  example: 'LangChain AI'
                }
              }
            },
            s3Url: {
              type: 'string',
              example: 'https://s3.amazonaws.com/bucket/reports/run-1-report.json'
            },
            filePath: {
              type: 'string',
              example: 'reports/run-1/summary-1234567890.json'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'pending'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Coverage: {
          type: 'object',
          properties: {
            lines: {
              type: 'integer',
              example: 85,
              description: 'Line coverage percentage'
            },
            branches: {
              type: 'integer',
              example: 80,
              description: 'Branch coverage percentage'
            },
            functions: {
              type: 'integer',
              example: 90,
              description: 'Function coverage percentage'
            }
          }
        },
        InstructionTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'JavaScript Unit Testing'
            },
            description: {
              type: 'string',
              example: 'Mẫu instruction test view point cho JavaScript Unit Testing với Jest framework'
            },
            language: {
              type: 'string',
              example: 'javascript'
            },
            framework: {
              type: 'string',
              example: 'jest'
            },
            scope: {
              type: 'string',
              example: 'unit_testing'
            },
            templateData: {
              type: 'object',
              description: 'Complete template data structure',
              properties: {
                language: {
                  type: 'string',
                  example: 'JavaScript'
                },
                testing_framework: {
                  type: 'string',
                  example: 'Jest'
                },
                scope: {
                  type: 'string',
                  example: 'Unit Testing'
                },
                description: {
                  type: 'string',
                  example: 'Mẫu instruction test view point cho JavaScript Unit Testing sử dụng Jest framework'
                },
                templates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'js-ut-function-testing'
                      },
                      name: {
                        type: 'string',
                        example: 'Function Testing'
                      },
                      description: {
                        type: 'string',
                        example: 'Test các function đơn lẻ với các input/output khác nhau'
                      },
                      viewpoints: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: ['Input validation testing', 'Output validation testing', 'Edge case testing']
                      },
                      test_patterns: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: ['Arrange-Act-Assert (AAA)', 'Given-When-Then']
                      },
                      examples: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: ['Test function với null/undefined input', 'Test function với empty string/array']
                      },
                      coverage_focus: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: ['Statement coverage', 'Branch coverage', 'Function coverage']
                      }
                    }
                  }
                }
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and profile management'
      },
      {
        name: 'Projects',
        description: 'Project management and templates'
      },
      {
        name: 'Git Integration',
        description: 'Git provider integration and repository management'
      },
      {
        name: 'RAG',
        description: 'Retrieval-Augmented Generation for test context'
      },
      {
        name: 'Test Runs',
        description: 'Test execution and run management with AI-powered pipeline'
      },
      {
        name: 'AI Services',
        description: 'LangChain and AI services integration for intelligent test generation'
      },
      {
        name: 'Statistics',
        description: 'Analytics and statistics'
      }
    ]
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

export default specs;