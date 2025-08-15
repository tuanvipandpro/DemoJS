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
      GitHubOAuthRequest: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', description: 'OAuth authorization code' },
          redirectUri: { type: 'string', description: 'OAuth redirect URI' }
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
          name: { type: 'string' },
          commitSha: { type: 'string' }
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
          name: { type: 'string' },
          description: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          team: { type: 'string' },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          budget: { type: 'string' },
          gitProvider: { type: 'string' },
          repository: { type: 'string' },
          branch: { type: 'string' },
          notifications: { 
            type: 'array',
            items: { type: 'string' }
          },
          status: { type: 'string', enum: ['Planning', 'Active', 'Testing', 'Completed', 'On Hold'] },
          progress: { type: 'integer', minimum: 0, maximum: 100 },
          coverage: { type: 'integer', minimum: 0, maximum: 100 },
          lastRun: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['name', 'description'],
        properties: {
          name: { type: 'string', maxLength: 255 },
          description: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          team: { type: 'string', maxLength: 100 },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          budget: { type: 'string', maxLength: 50 },
          gitProvider: { type: 'string', maxLength: 50 },
          repository: { type: 'string', maxLength: 255 },
          branch: { type: 'string', maxLength: 100 },
          notifications: { 
            type: 'array',
            items: { type: 'string' }
          }
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
    
    '/auth/github/oauth/exchange': {
      post: {
        tags: ['GitHub'],
        summary: 'Exchange GitHub OAuth code',
        description: 'Exchange GitHub OAuth authorization code để lấy access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GitHubOAuthRequest' }
            }
          }
        },
        responses: {
          200: { 
            description: 'OAuth exchange thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GitHubConnectResponse' }
              }
            }
          },
          400: { 
            description: 'Bad Request - Code không hợp lệ',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: { 
            description: 'Server error - Lỗi khi exchange token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
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
            description: 'Unauthorized - Cần GitHub OAuth',
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
      get: {
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
        responses: {
          200: { 
            description: 'Danh sách branches',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Branch' }
                }
              }
            }
          },
          401: { 
            description: 'Unauthorized - Cần GitHub OAuth',
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
        description: 'Kết nối với GitHub sử dụng Personal Access Token thay vì OAuth',
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
    
    '/github/repos/with-code': {
      post: {
        tags: ['GitHub'],
        summary: 'Kết nối GitHub bằng OAuth code',
        description: 'Kết nối với GitHub sử dụng OAuth authorization code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GitHubOAuthRequest' }
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
            description: 'Bad Request - Code không hợp lệ',
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
    
    '/github/projects': {
      get: {
        tags: ['GitHub'],
        summary: 'Lấy dự án từ server',
        description: 'Lấy danh sách dự án của user từ database',
        responses: {
          200: { 
            description: 'Danh sách dự án',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' }
                    }
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
          }
        }
      },
      
      post: {
        tags: ['GitHub'],
        summary: 'Tạo dự án mới',
        description: 'Tạo dự án mới với thông tin từ request body',
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
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    project: { $ref: '#/components/schemas/Project' }
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
};


