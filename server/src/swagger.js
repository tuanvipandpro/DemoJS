export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InsightTestAI Server API',
    version: '0.1.0',
  },
  servers: [
    // Dùng URL tương đối để phù hợp cả IP hoặc localhost
    { url: '/api' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
      },
    },
    schemas: {
      VectorInsertRequest: {
        type: 'object',
        required: ['namespace', 'content', 'embedding'],
        properties: {
          namespace: { type: 'string' },
          content: { type: 'string' },
          embedding: {
            type: 'array',
            items: { type: 'number' },
            description: 'Embedding vector, ví dụ 1536 chiều',
          },
        },
      },
      VectorSearchRequest: {
        type: 'object',
        required: ['namespace', 'embedding'],
        properties: {
          namespace: { type: 'string' },
          embedding: {
            type: 'array',
            items: { type: 'number' },
          },
          limit: { type: 'integer', default: 5 },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Thông tin user hiện tại',
        responses: {
          200: { description: 'User hoặc null' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Đăng ký user (username/password)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                  displayName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 400: { description: 'Bad Request' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login unified cho nhiều provider (local/github/google...). Nếu có đủ username/password thì ưu tiên login local.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  provider: { type: 'string', default: 'local' },
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Bad Request' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/token/refresh': {
      post: {
        summary: 'Cấp mới access_token từ refresh_token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: { refresh_token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Bad Request' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/profile': {
      get: {
        summary: 'Lấy thông tin profile hiện tại (JWT Bearer)',
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
      },
      put: {
        summary: 'Cập nhật profile (displayName, email, phone, address)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Đăng xuất',
        responses: {
          200: { description: 'OK' },
        },
      },
    },
    '/github/repos': {
      get: {
        summary: 'Danh sách repository của user',
        responses: {
          200: { description: 'OK' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/github/repos/{owner}/{repo}/branches': {
      get: {
        summary: 'Danh sách branch của repo',
        parameters: [
          { in: 'path', name: 'owner', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'repo', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'OK' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/vectors/insert': {
      post: {
        summary: 'Chèn tài liệu với embedding',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VectorInsertRequest' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Bad Request' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/vectors/search': {
      post: {
        summary: 'Tìm kiếm theo embedding',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VectorSearchRequest' },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Bad Request' },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};


