export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InsightTestAI Server API',
    version: '1.0.0',
    description: 'API cho nền tảng AI-powered testing với tích hợp Git providers',
    contact: {
      name: 'InsightTestAI Team'
    }
  },
  servers: [
    { url: '/api', description: 'API Base URL' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
        description: 'Session cookie authentication'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication'
      }
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          provider: { type: 'string', enum: ['local', 'github', 'jwt'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' }
        }
      },
      
      // Authentication schemas
      LoginRequest: {
        type: 'object',
        properties: {
          provider: { type: 'string', default: 'local', enum: ['local', 'github'] },
          username: { type: 'string' },
          password: { type: 'string' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
          displayName: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' }
        }
      },
      ProfileUpdateRequest: {
        type: 'object',
        properties: {
          displayName: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' }
        }
      },
      TokenRefreshRequest: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' }
        }
      },
      
      // GitHub schemas
      GitHubConnectRequest: {
        type: 'object',
        required: ['token', 'provider'],
        properties: {
          token: { type: 'string', description: 'Personal Access Token' },
          provider: { type: 'string', enum: ['github'] }
        }
      },
      GitHubUser: {
        type: 'object',
        properties: {
          login: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          avatar_url: { type: 'string', format: 'uri' }
        }
      },
      Repository: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          full_name: { type: 'string' },
          private: { type: 'boolean' },
          description: { type: 'string' },
          language: { type: 'string' },
          updated_at: { type: 'string', format: 'date-time' },
          html_url: { type: 'string', format: 'uri' },
          clone_url: { type: 'string', format: 'uri' }
        }
      },
      Branch: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Tên branch' },
          commitSha: { type: 'string', description: 'SHA của commit cuối cùng' },
          commitUrl: { type: 'string', format: 'uri', description: 'URL của commit' },
          protection: { type: 'object', description: 'Thông tin bảo vệ branch (nếu có)' }
        }
      },
      GitHubConnectResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: { $ref: '#/components/schemas/GitHubUser' },
          repositories: {
            type: 'array',
            items: { $ref: '#/components/schemas/Repository' }
          }
        }
      },
      
      // Project schemas
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', description: 'Tên dự án' },
          description: { type: 'string', description: 'Mô tả dự án' },
          gitProvider: { type: 'string', description: 'Nhà cung cấp Git (github, gitlab, etc.)' },
          repository: { type: 'string', description: 'Tên repository' },
          branch: { type: 'string', description: 'Nhánh chính' },
          ownerId: { type: 'string', format: 'uuid', description: 'ID của user tạo project' },
          personalAccessToken: { 
            type: 'string', 
            description: 'Personal Access Token đã mã hóa (masked as ***ENCRYPTED*** in responses)'
          },
          notifications: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Danh sách thông báo (email, slack, etc.)'
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
          isDelete: { type: 'boolean', description: 'Trạng thái xóa (soft delete)', default: false },
          isDisable: { type: 'boolean', description: 'Trạng thái vô hiệu hóa', default: false },
          status: { type: 'string', description: 'Trạng thái dự án', default: 'active' }
        }
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', maxLength: 255, description: 'Tên dự án (bắt buộc)' },
          description: { type: 'string', description: 'Mô tả dự án' },
          gitProvider: { type: 'string', maxLength: 50, description: 'Nhà cung cấp Git' },
          repository: { type: 'string', maxLength: 255, description: 'Tên repository' },
          branch: { type: 'string', maxLength: 100, description: 'Nhánh chính' },
          personalAccessToken: { 
            type: 'string', 
            description: 'Personal Access Token (sẽ được mã hóa và lưu an toàn)'
          },
          notifications: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Danh sách thông báo'
          }
        }
      },
      UpdateProjectRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255, description: 'Tên dự án' },
          description: { type: 'string', description: 'Mô tả dự án' },
          gitProvider: { type: 'string', maxLength: 50, description: 'Nhà cung cấp Git' },
          repository: { type: 'string', maxLength: 255, description: 'Tên repository' },
          branch: { type: 'string', maxLength: 100, description: 'Nhánh chính' },
          personalAccessToken: { 
            type: 'string', 
            description: 'Personal Access Token mới (sẽ được mã hóa và lưu an toàn)'
          },
          notifications: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Danh sách thông báo'
          },
          status: { type: 'string', description: 'Trạng thái dự án' }
        }
      },
      ProjectResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          project: { $ref: '#/components/schemas/Project' }
        }
      },
      ProjectsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          projects: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' }
          }
        }
      },
      ProjectDisableRequest: {
        type: 'object',
        required: ['isDisable'],
        properties: {
          isDisable: { type: 'boolean', description: 'Trạng thái vô hiệu hóa' }
        }
      },
      ProjectStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', description: 'Trạng thái dự án' }
        }
      },
      GitHubTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string', description: 'GitHub Personal Access Token đã giải mã' },
          gitProvider: { type: 'string', description: 'Git provider' },
          repository: { type: 'string', description: 'Tên repository' }
        }
      },
      
      // Vector schemas
      VectorInsertRequest: {
        type: 'object',
        required: ['namespace', 'content', 'embedding'],
        properties: {
          namespace: { type: 'string', description: 'Namespace cho vector' },
          content: { type: 'string', description: 'Nội dung tài liệu' },
          embedding: {
            type: 'array',
            items: { type: 'number' },
            description: 'Embedding vector, ví dụ 1536 chiều'
          }
        }
      },
      VectorSearchRequest: {
        type: 'object',
        required: ['namespace', 'embedding'],
        properties: {
          namespace: { type: 'string', description: 'Namespace để tìm kiếm' },
          embedding: {
            type: 'array',
            items: { type: 'number' },
            description: 'Embedding vector để tìm kiếm'
          },
          limit: { type: 'integer', default: 5, minimum: 1, maximum: 100 }
        }
      },
      
      // Error schemas
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      }
    }
  },
  security: [
    { cookieAuth: [] },
    { bearerAuth: [] }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Kiểm tra trạng thái hoạt động của server',
        responses: {
          200: { 
            description: 'Server hoạt động bình thường',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    // Authentication endpoints
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Thông tin user hiện tại',
        description: 'Lấy thông tin user đang đăng nhập (session hoặc JWT)',
        responses: {
          200: { 
            description: 'Thông tin user hoặc null nếu chưa đăng nhập',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/User' },
                    { type: 'object', properties: { user: { type: 'null' } } }
                  ]
                }
              }
            }
          },
          401: { 
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng ký user mới',
        description: 'Đăng ký user với username/password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Đăng ký thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: { 
            description: 'Conflict - Username hoặc email đã tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng nhập',
        description: 'Login unified cho nhiều provider (local/github). Nếu có đủ username/password thì ưu tiên login local.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Đăng nhập thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Thông tin đăng nhập không đúng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/auth/token/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Làm mới access token',
        description: 'Cấp mới access_token từ refresh_token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenRefreshRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Token được làm mới thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          400: { 
            description: 'Bad Request - Refresh token không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Refresh token đã hết hạn',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Lấy thông tin profile',
        description: 'Lấy thông tin profile hiện tại (JWT Bearer)',
        responses: {
          200: { 
            description: 'Thông tin profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profile: { $ref: '#/components/schemas/UserProfile' }
                  }
                }
              }
            }
          },
          401: { 
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      
      put: {
        tags: ['Authentication'],
        summary: 'Cập nhật profile',
        description: 'Cập nhật thông tin profile (displayName, email, phone, address)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProfileUpdateRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Profile được cập nhật thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profile: { $ref: '#/components/schemas/UserProfile' }
                  }
                }
              }
            }
          },
          401: { 
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: { 
            description: 'Conflict - Email đã được sử dụng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng xuất',
        description: 'Đăng xuất và xóa session',
        responses: {
          200: { 
            description: 'Đăng xuất thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    
    // GitHub endpoints
    '/github/repos': {
      get: {
        tags: ['GitHub'],
        summary: 'Danh sách repository của user',
        description: 'Lấy danh sách repositories của user đang đăng nhập',
        responses: {
          200: { 
            description: 'Danh sách repositories',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      full_name: { type: 'string' },
                      private: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần đăng nhập',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/github/repos/{owner}/{repo}/branches': {
      post: {
        tags: ['GitHub'],
        summary: 'Danh sách branch của repository',
        description: 'Lấy danh sách branches của một repository cụ thể',
        parameters: [
          { 
            in: 'path', 
            name: 'owner', 
            required: true, 
            schema: { type: 'string' },
            description: 'Tên owner của repository'
          },
          { 
            in: 'path', 
            name: 'repo', 
            required: true, 
            schema: { type: 'string' },
            description: 'Tên repository'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['githubToken'],
                properties: {
                  githubToken: { 
                    type: 'string', 
                    description: 'GitHub Personal Access Token để truy cập repository' 
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { 
            description: 'Danh sách branches',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    repository: { type: 'string' },
                    branches: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Branch' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          },
          400: { 
            description: 'Bad Request - Token không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần đăng nhập',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Repository không tìm thấy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: { 
            description: 'Server error - Lỗi khi lấy branches',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/github/connect-with-token': {
      post: {
        tags: ['GitHub'],
        summary: 'Kết nối GitHub bằng Personal Access Token',
        description: 'Kết nối với GitHub sử dụng Personal Access Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GitHubConnectRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Kết nối thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GitHubConnectResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Token không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Token không có quyền truy cập',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Token không có đủ quyền hạn',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: { 
            description: 'Server error - Lỗi khi kết nối GitHub',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Lấy danh sách dự án',
        description: 'Lấy danh sách dự án của user đang đăng nhập. Admin có thể truyền owner_id để xem projects của user khác.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'owner_id',
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của user (cho admin)',
            required: false
          }
        ],
        responses: {
          200: { 
            description: 'Danh sách dự án',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectsResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      
      post: {
        tags: ['Projects'],
        summary: 'Tạo dự án mới',
        description: 'Tạo dự án mới. Chỉ cần cung cấp name, các field khác là optional. owner_id sẽ tự động lấy từ JWT token.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectRequest' }
            }
          }
        },
        responses: {
          201: { 
            description: 'Dự án được tạo thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: { 
            description: 'Server error - Lỗi khi tạo dự án',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    // Project endpoints
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Lấy dự án theo ID',
        description: 'Lấy thông tin chi tiết của một dự án cụ thể. User chỉ có thể xem projects của mình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            in: 'path', 
            name: 'id', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của dự án'
          }
        ],
        responses: {
          200: { 
            description: 'Thông tin dự án',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Không có quyền truy cập project này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Dự án không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      
      put: {
        tags: ['Projects'],
        summary: 'Cập nhật dự án',
        description: 'Cập nhật thông tin của một dự án. User chỉ có thể update projects của mình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            in: 'path', 
            name: 'id', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của dự án'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProjectRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Dự án được cập nhật thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Không có quyền update project này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Dự án không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      
      delete: {
        tags: ['Projects'],
        summary: 'Xóa dự án (Soft Delete)',
        description: 'Xóa một dự án theo ID. Thực hiện soft delete (set is_delete = true). User chỉ có thể xóa projects của mình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            in: 'path', 
            name: 'id', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của dự án'
          }
        ],
        responses: {
          200: { 
            description: 'Dự án được xóa thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Không có quyền xóa project này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Dự án không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    // Project disable endpoint
    '/projects/{id}/disable': {
      patch: {
        tags: ['Projects'],
        summary: 'Vô hiệu hóa/Bật dự án',
        description: 'Cập nhật trạng thái vô hiệu hóa của dự án. User chỉ có thể thao tác với projects của mình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            in: 'path', 
            name: 'id', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của dự án'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectDisableRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Trạng thái vô hiệu hóa được cập nhật thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Không có quyền thao tác project này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Dự án không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    // Project status endpoint
    '/projects/{id}/status': {
      patch: {
        tags: ['Projects'],
        summary: 'Cập nhật trạng thái dự án',
        description: 'Cập nhật trạng thái của dự án. User chỉ có thể thao tác với projects của mình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            in: 'path', 
            name: 'id', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của dự án'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectStatusRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Trạng thái dự án được cập nhật thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Không có quyền thao tác project này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Dự án không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    // GET /api/projects/{id}/github-token - Lấy GitHub token đã lưu
    '/projects/{id}/github-token': {
      get: {
        tags: ['Projects'],
        summary: 'Lấy GitHub token đã lưu cho project',
        description: 'Lấy GitHub Personal Access Token đã được mã hóa và lưu cho project cụ thể. User chỉ có thể lấy token của projects của mình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            in: 'path', 
            name: 'id', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của project'
          }
        ],
        responses: {
          200: { 
            description: 'GitHub token và thông tin repository',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GitHubTokenResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: { 
            description: 'Forbidden - Không có quyền truy cập project này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: { 
            description: 'Project không tìm thấy hoặc không có GitHub token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: { 
            description: 'Server error - Lỗi khi giải mã token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    // Vector endpoints
    '/vectors/insert': {
      post: {
        tags: ['Vectors'],
        summary: 'Chèn tài liệu với embedding',
        description: 'Chèn tài liệu mới với vector embedding vào vector database',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VectorInsertRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Tài liệu được chèn thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    
    '/vectors/search': {
      post: {
        tags: ['Vectors'],
        summary: 'Tìm kiếm theo embedding',
        description: 'Tìm kiếm tài liệu tương tự dựa trên vector embedding',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VectorSearchRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'Kết quả tìm kiếm',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          content: { type: 'string' },
                          score: { type: 'number' },
                          namespace: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { 
            description: 'Bad Request - Dữ liệu không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { 
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  }
}