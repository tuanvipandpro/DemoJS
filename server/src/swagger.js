import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InsightTestAI API',
      version: '1.0.0',
      description: 'API for InsightTestAI - AI-powered testing automation system with RAG capabilities',
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
            userId: {
              type: 'integer',
              example: 1
            },
            state: {
              type: 'string',
              enum: ['queued', 'planning', 'proposals', 'approved', 'executing', 'completed', 'failed'],
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
            confidenceScore: {
              type: 'number',
              format: 'float',
              example: 0.85
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            finishedAt: {
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
        description: 'Test execution and run management'
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