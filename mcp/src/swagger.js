import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InsightTestAI MCP Server API',
      version: '1.0.0',
      description: 'Model Context Protocol Server API cho InsightTestAI - cung cấp các tools cho LLM/Worker',
      contact: {
        name: 'InsightTestAI Team',
        email: 'team@insighttestai.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8081',
        description: 'Development server'
      },
      {
        url: 'http://0.0.0.0:8081',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Loại lỗi'
            },
            message: {
              type: 'string',
              description: 'Mô tả lỗi'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian xảy ra lỗi'
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: 'Trạng thái sức khỏe của server'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian kiểm tra'
            },
            uptime: {
              type: 'number',
              description: 'Thời gian hoạt động (giây)'
            }
          }
        },
        ToolResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Kết quả thực thi tool'
            },
            data: {
              type: 'object',
              description: 'Dữ liệu trả về từ tool'
            },
            message: {
              type: 'string',
              description: 'Thông báo kết quả'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian thực thi'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/tools/*.js']
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
