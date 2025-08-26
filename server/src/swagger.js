export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'InsightTestAI Server API',
    version: '1.0.0',
    description: 'API cho nền tảng AI-powered testing với tích hợp Git providers, Worker management, và Queue processing',
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
          id: { type: 'number' },
          login: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          avatar_url: { type: 'string', format: 'uri' },
          html_url: { type: 'string', format: 'uri' }
        }
      },
      GitHubRepository: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          full_name: { type: 'string' },
          description: { type: 'string' },
          html_url: { type: 'string', format: 'uri' },
          clone_url: { type: 'string', format: 'uri' },
          ssh_url: { type: 'string' },
          default_branch: { type: 'string' },
          private: { type: 'boolean' },
          fork: { type: 'boolean' },
          size: { type: 'number' },
          stargazers_count: { type: 'number' },
          watchers_count: { type: 'number' },
          language: { type: 'string' },
          has_issues: { type: 'boolean' },
          has_projects: { type: 'boolean' },
          has_downloads: { type: 'boolean' },
          has_wiki: { type: 'boolean' },
          has_pages: { type: 'boolean' },
          has_discussions: { type: 'boolean' },
          forks_count: { type: 'number' },
          mirror_url: { type: 'string', format: 'uri' },
          archived: { type: 'boolean' },
          disabled: { type: 'boolean' },
          open_issues_count: { type: 'number' },
          license: { type: 'object' },
          allow_forking: { type: 'boolean' },
          is_template: { type: 'boolean' },
          web_commit_signoff_required: { type: 'boolean' },
          topics: { type: 'array', items: { type: 'string' } },
          visibility: { type: 'string' },
          forks: { type: 'number' },
          open_issues: { type: 'number' },
          watchers: { type: 'number' },
          default_branch: { type: 'string' }
        }
      },
      GitHubTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/GitHubUser' },
          repositories: {
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubRepository' }
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
          gitProvider: { type: 'string', enum: ['github', 'gitlab', 'bitbucket', 'azure'] },
          repository: { type: 'string' },
          branch: { type: 'string' },
          ownerId: { type: 'string', format: 'uuid' },
          personalAccessToken: { type: 'string' },
          notifications: {
            type: 'array',
            items: { type: 'string' }
          },
          createdAt: { type: 'string', format: 'date-time' },
          isDelete: { type: 'boolean' },
          isDisable: { type: 'boolean' },
          status: { type: 'string' }
        }
      },
      ProjectCreateRequest: {
        type: 'object',
        required: ['name', 'gitProvider', 'repository'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          gitProvider: { type: 'string', enum: ['github', 'gitlab', 'bitbucket', 'azure'] },
          personalAccessToken: { type: 'string' },
          repository: { type: 'string' },
          branch: { type: 'string', default: 'main' },
          notifications: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      ProjectUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          personalAccessToken: { type: 'string' },
          branch: { type: 'string' },
          notifications: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      
      // Vector schemas
      VectorInsertRequest: {
        type: 'object',
        required: ['content', 'namespace'],
        properties: {
          content: { type: 'string', description: 'Nội dung tài liệu' },
          namespace: { type: 'string', description: 'Namespace cho tài liệu' },
          metadata: { type: 'object', description: 'Metadata bổ sung' }
        }
      },
      VectorSearchRequest: {
        type: 'object',
        required: ['query', 'namespace'],
        properties: {
          query: { type: 'string', description: 'Query text để tìm kiếm' },
          namespace: { type: 'string', description: 'Namespace để tìm kiếm' },
          topK: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Số lượng kết quả trả về' },
          scoreThreshold: { type: 'number', minimum: 0, maximum: 1, description: 'Ngưỡng score tối thiểu' }
        }
      },
      
      // Worker schemas
      WorkerStatus: {
        type: 'object',
        properties: {
          overall: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          worker: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] },
              url: { type: 'string', format: 'uri' },
              details: { type: 'object' }
            }
          },
          database: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] }
            }
          }
        }
      },
      WorkerConfiguration: {
        type: 'object',
        properties: {
          configuration: { type: 'object' },
          environment: {
            type: 'object',
            properties: {
              NODE_ENV: { type: 'string' },
              WORKER_URL: { type: 'string', format: 'uri' }
            }
          }
        }
      },
      QueueStats: {
        type: 'object',
        properties: {
          queue: { type: 'object' },
          database: {
            type: 'object',
            properties: {
              last24h: {
                type: 'object',
                properties: {
                  total_runs: { type: 'integer' },
                  queued_runs: { type: 'integer' },
                  running_runs: { type: 'integer' },
                  completed_runs: { type: 'integer' },
                  failed_runs: { type: 'integer' }
                }
              }
            }
          }
        }
      },
      
      // Agent Run schemas
      AgentRun: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          projectName: { type: 'string' },
          projectRepository: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          userEmail: { type: 'string', format: 'email' },
          status: { type: 'string', enum: ['queued', 'running', 'completed', 'failed'] },
          state: { type: 'string', enum: ['QUEUED', 'PLANNING', 'TOOLING', 'OBSERVING', 'ADJUSTING', 'DONE', 'ERROR', 'WAITING_REVIEW'] },
          commitId: { type: 'string' },
          branch: { type: 'string' },
          diffSummary: { type: 'string' },
          testPlan: { type: 'object' },
          testResults: { type: 'object' },
          coverage: { type: 'number', minimum: 0, maximum: 100 },
          confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
          errorMessage: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      AgentRunCreateRequest: {
        type: 'object',
        required: ['projectId', 'commitId'],
        properties: {
          projectId: { type: 'string', format: 'uuid' },
          commitId: { type: 'string' },
          branch: { type: 'string', default: 'main' },
          diffSummary: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' }
        }
      },
      AgentRunUpdateRequest: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['queued', 'running', 'completed', 'failed'] },
          state: { type: 'string', enum: ['QUEUED', 'PLANNING', 'TOOLING', 'OBSERVING', 'ADJUSTING', 'DONE', 'ERROR', 'WAITING_REVIEW'] },
          errorMessage: { type: 'string' },
          testResults: { type: 'object' },
          coverage: { type: 'number', minimum: 0, maximum: 100 },
          confidenceScore: { type: 'number', minimum: 0, maximum: 1 }
        }
      },
      AgentRunStats: {
        type: 'object',
        properties: {
          range: { type: 'string' },
          projectId: { type: 'string', format: 'uuid' },
          statistics: {
            type: 'object',
            properties: {
              totalRuns: { type: 'integer' },
              queuedRuns: { type: 'integer' },
              runningRuns: { type: 'integer' },
              completedRuns: { type: 'integer' },
              failedRuns: { type: 'integer' },
              avgConfidence: { type: 'number' },
              avgCoverage: { type: 'number' }
            }
          }
        }
      },
      RunLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          runId: { type: 'string', format: 'uuid' },
          level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
          message: { type: 'string' },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      
      // Queue schemas
      QueueMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          messageId: { type: 'string' },
          type: { type: 'string' },
          data: { type: 'object' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'] },
          delay: { type: 'integer', minimum: 0 },
          userId: { type: 'string', format: 'uuid' },
          userEmail: { type: 'string', format: 'email' },
          projectId: { type: 'string', format: 'uuid' },
          projectName: { type: 'string' },
          status: { type: 'string', enum: ['queued', 'pending', 'processing', 'acknowledged', 'nack', 'deleted', 'cleared'] },
          errorReason: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      QueueEnqueueRequest: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: { type: 'string', description: 'Loại message' },
          data: { type: 'object', description: 'Dữ liệu message' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
          delay: { type: 'integer', minimum: 0, default: 0, description: 'Delay trước khi xử lý (giây)' }
        }
      },
      QueueDequeueRequest: {
        type: 'object',
        properties: {
          timeout: { type: 'integer', minimum: 1, maximum: 300, default: 30, description: 'Timeout chờ message (giây)' }
        }
      },
      QueueNackRequest: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Lý do nack' },
          requeue: { type: 'boolean', default: false, description: 'Có requeue message không' }
        }
      },
      QueueClearRequest: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['queued', 'pending', 'processing', 'acknowledged', 'nack', 'deleted'] },
          type: { type: 'string', description: 'Loại message để clear' },
          projectId: { type: 'string', format: 'uuid', description: 'Project ID để clear' }
        }
      },
      
      // Common schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          details: { type: 'object' }
        }
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          total: { type: 'integer' }
        }
      },
      
      // Stats schemas
      StatsSummary: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['24h', '7d', '30d', '90d'] },
          summary: {
            type: 'object',
            properties: {
              total_runs: { type: 'integer', description: 'Tổng số runs' },
              successful_runs: { type: 'integer', description: 'Số runs thành công' },
              failed_runs: { type: 'integer', description: 'Số runs thất bại' },
              running_runs: { type: 'integer', description: 'Số runs đang chạy' },
              queued_runs: { type: 'integer', description: 'Số runs đang chờ' },
              success_rate: { type: 'integer', description: 'Tỷ lệ thành công (%)' },
              avg_duration_minutes: { type: 'integer', description: 'Thời gian trung bình (phút)' },
              active_projects: { type: 'integer', description: 'Số dự án hoạt động' }
            }
          },
          daily_runs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                total_runs: { type: 'integer' },
                successful_runs: { type: 'integer' },
                failed_runs: { type: 'integer' }
              }
            }
          },
          project_performance: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                project_name: { type: 'string' },
                total_runs: { type: 'integer' },
                successful_runs: { type: 'integer' },
                failed_runs: { type: 'integer' },
                success_rate: { type: 'number' }
              }
            }
          },
          recent_activity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                state: { type: 'string', enum: ['SUCCESS', 'FAILED', 'RUNNING', 'QUEUED'] },
                created_at: { type: 'string', format: 'date-time' },
                finished_at: { type: 'string', format: 'date-time' },
                project_name: { type: 'string' },
                duration_minutes: { type: 'integer' }
              }
            }
          }
        }
      },
      
      ProjectStatsSummary: {
        type: 'object',
        properties: {
          project_id: { type: 'string', format: 'uuid' },
          range: { type: 'string', enum: ['24h', '7d', '30d', '90d'] },
          summary: {
            type: 'object',
            properties: {
              total_runs: { type: 'integer' },
              successful_runs: { type: 'integer' },
              failed_runs: { type: 'integer' },
              running_runs: { type: 'integer' },
              success_rate: { type: 'integer' },
              avg_duration_minutes: { type: 'integer' },
              first_run: { type: 'string', format: 'date-time' },
              last_run: { type: 'string', format: 'date-time' }
            }
          },
          daily_runs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                total_runs: { type: 'integer' },
                successful_runs: { type: 'integer' },
                failed_runs: { type: 'integer' }
              }
            }
          },
          run_history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                state: { type: 'string', enum: ['SUCCESS', 'FAILED', 'RUNNING', 'QUEUED'] },
                created_at: { type: 'string', format: 'date-time' },
                finished_at: { type: 'string', format: 'date-time' },
                duration_minutes: { type: 'integer' }
              }
            }
          }
        }
      },
      
      TrendsData: {
        type: 'object',
        properties: {
          days: { type: 'integer', description: 'Số ngày được yêu cầu' },
          trends: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                total_runs: { type: 'integer' },
                successful_runs: { type: 'integer' },
                failed_runs: { type: 'integer' },
                success_rate: { type: 'integer' },
                avg_duration_minutes: { type: 'integer' },
                moving_avg_success_rate: { type: 'integer', description: 'Moving average 7 ngày' }
              }
            }
          }
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
                schema: { $ref: '#/components/schemas/GitHubTokenResponse' }
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
    },

    // Worker endpoints
    '/worker/status': {
      get: {
        tags: ['Worker'],
        summary: 'Lấy trạng thái tổng quan của Worker',
        description: 'Lấy trạng thái tổng quan của Worker và các thành phần con (database, queue, etc.)',
        responses: {
          200: {
            description: 'Trạng thái tổng quan của Worker',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkerStatus' }
              }
            }
          },
          503: {
            description: 'Service Unavailable - Worker không khả dụng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/worker/configuration': {
      get: {
        tags: ['Worker'],
        summary: 'Lấy cấu hình hiện tại của Worker',
        description: 'Lấy cấu hình hiện tại của Worker, bao gồm cấu hình và môi trường',
        responses: {
          200: {
            description: 'Cấu hình hiện tại của Worker',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkerConfiguration' }
              }
            }
          },
          503: {
            description: 'Service Unavailable - Worker không khả dụng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/worker/queue/stats': {
      get: {
        tags: ['Worker'],
        summary: 'Lấy thống kê về hàng đợi của Worker',
        description: 'Lấy thống kê về hàng đợi của Worker, bao gồm thống kê hàng đợi và thống kê cơ sở dữ liệu trong 24 giờ gần nhất',
        responses: {
          200: {
            description: 'Thống kê về hàng đợi của Worker',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QueueStats' }
              }
            }
          },
          503: {
            description: 'Service Unavailable - Worker không khả dụng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/worker/queue/purge': {
      post: {
        tags: ['Worker'],
        summary: 'Xóa tất cả messages trong queue của Worker',
        description: 'Xóa tất cả messages trong queue của Worker (emergency cleanup)',
        responses: {
          200: {
            description: 'Queue được purge thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          503: {
            description: 'Service Unavailable - Worker không khả dụng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/worker/restart': {
      post: {
        tags: ['Worker'],
        summary: 'Gửi signal khởi động lại Worker',
        description: 'Gửi signal để Worker khởi động lại (apply configuration changes)',
        responses: {
          200: {
            description: 'Signal restart được gửi thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          503: {
            description: 'Service Unavailable - Worker không khả dụng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },



    // Agent Run endpoints
    '/runs': {
      get: {
        tags: ['Agent Runs'],
        summary: 'Lấy danh sách Agent Runs',
        description: 'Lấy danh sách Agent Runs theo thời gian và project. Có thể lọc bởi projectId và trạng thái.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'projectId',
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của project (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['queued', 'running', 'completed', 'failed'] },
            description: 'Trạng thái của Agent Run (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'fromDate',
            schema: { type: 'string', format: 'date-time' },
            description: 'Ngày bắt đầu (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'toDate',
            schema: { type: 'string', format: 'date-time' },
            description: 'Ngày kết thúc (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Số lượng kết quả trả về',
            required: false
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 },
            description: 'Số lượng kết quả để bỏ qua',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Danh sách Agent Runs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AgentRun' }
                    },
                    pagination: { $ref: '#/components/schemas/PaginationResponse' }
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
          }
        }
      },
      post: {
        tags: ['Agent Runs'],
        summary: 'Tạo mới Agent Run',
        description: 'Tạo mới Agent Run cho một project cụ thể. ProjectId và CommitId là bắt buộc.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AgentRunCreateRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Agent Run được tạo thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentRun' }
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
          404: {
            description: 'Project không tìm thấy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/runs/{id}': {
      get: {
        tags: ['Agent Runs'],
        summary: 'Lấy Agent Run theo ID',
        description: 'Lấy thông tin chi tiết của một Agent Run cụ thể.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của Agent Run'
          }
        ],
        responses: {
          200: {
            description: 'Thông tin Agent Run',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentRun' }
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
            description: 'Forbidden - Không có quyền truy cập Agent Run này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Agent Run không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Agent Runs'],
        summary: 'Cập nhật Agent Run',
        description: 'Cập nhật thông tin của một Agent Run. Chỉ có thể cập nhật trạng thái và kết quả.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của Agent Run'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AgentRunUpdateRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Agent Run được cập nhật thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentRun' }
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
            description: 'Forbidden - Không có quyền update Agent Run này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Agent Run không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Agent Runs'],
        summary: 'Xóa Agent Run (Soft Delete)',
        description: 'Xóa một Agent Run theo ID. Thực hiện soft delete (set is_delete = true).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của Agent Run'
          }
        ],
        responses: {
          200: {
            description: 'Agent Run được xóa thành công',
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
            description: 'Forbidden - Không có quyền xóa Agent Run này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Agent Run không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/runs/{id}/stats': {
      get: {
        tags: ['Agent Runs'],
        summary: 'Lấy thống kê Agent Run theo thời gian',
        description: 'Lấy thống kê Agent Run theo thời gian, bao gồm tổng số Agent Runs, số Agent Runs trong từng trạng thái, và trung bình độ tin cậy và độ phủ.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của Agent Run'
          },
          {
            in: 'query',
            name: 'range',
            schema: { type: 'string', enum: ['day', 'week', 'month'] },
            description: 'Khoảng thời gian để lấy thống kê (ngày, tuần, tháng)',
            required: true
          }
        ],
        responses: {
          200: {
            description: 'Thống kê Agent Run theo thời gian',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentRunStats' }
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
          404: {
            description: 'Agent Run không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/runs/{id}/logs': {
      get: {
        tags: ['Agent Runs'],
        summary: 'Lấy log của Agent Run',
        description: 'Lấy log của một Agent Run theo ID. Có thể lọc bởi level (debug, info, warn, error).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của Agent Run'
          },
          {
            in: 'query',
            name: 'level',
            schema: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
            description: 'Level của log (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Số lượng kết quả trả về',
            required: false
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 },
            description: 'Số lượng kết quả để bỏ qua',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Log của Agent Run',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RunLog' }
                    },
                    pagination: { $ref: '#/components/schemas/PaginationResponse' }
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
          404: {
            description: 'Agent Run không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/runs/{id}/status': {
      put: {
        tags: ['Agent Runs'],
        summary: 'Cập nhật trạng thái của Agent Run',
        description: 'Cập nhật trạng thái, state, và kết quả của một Agent Run. Chỉ có thể cập nhật các trường được phép.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của Agent Run'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AgentRunUpdateRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Agent Run được cập nhật thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentRun' }
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
            description: 'Forbidden - Không có quyền update Agent Run này',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Agent Run không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/runs/stats/summary': {
      get: {
        tags: ['Agent Runs'],
        summary: 'Lấy thống kê tổng quan về Agent Runs',
        description: 'Lấy thống kê tổng quan về Agent Runs, bao gồm tổng số, số lượng theo trạng thái, và metrics trung bình.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'projectId',
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của project (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'fromDate',
            schema: { type: 'string', format: 'date-time' },
            description: 'Ngày bắt đầu (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'toDate',
            schema: { type: 'string', format: 'date-time' },
            description: 'Ngày kết thúc (để lọc)',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Thống kê tổng quan về Agent Runs',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AgentRunStats' }
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
      }
    },

    // Queue endpoints
    '/queue/messages': {
      get: {
        tags: ['Queue Management'],
        summary: 'Lấy danh sách message từ hàng đợi',
        description: 'Lấy danh sách message từ hàng đợi. Có thể lọc bởi status, type, projectId và userId.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['queued', 'pending', 'processing', 'acknowledged', 'nack', 'deleted', 'cleared'] },
            description: 'Trạng thái của message (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'type',
            schema: { type: 'string' },
            description: 'Loại của message (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'projectId',
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của project (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'userId',
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của user (để lọc)',
            required: false
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Số lượng kết quả trả về',
            required: false
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 },
            description: 'Số lượng kết quả để bỏ qua',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Danh sách message từ hàng đợi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/QueueMessage' }
                    },
                    pagination: { $ref: '#/components/schemas/PaginationResponse' }
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
          }
        }
      },
      post: {
        tags: ['Queue Management'],
        summary: 'Đẩy message vào hàng đợi',
        description: 'Đẩy message vào hàng đợi. Có thể chỉ định priority và delay.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/QueueEnqueueRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Message được đẩy vào hàng đợi thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QueueMessage' }
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
          }
        }
      }
    },

    '/queue/messages/{id}': {
      get: {
        tags: ['Queue Management'],
        summary: 'Lấy message từ hàng đợi theo ID',
        description: 'Lấy thông tin chi tiết của một message từ hàng đợi theo ID.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của message'
          }
        ],
        responses: {
          200: {
            description: 'Thông tin message từ hàng đợi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QueueMessage' }
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
          404: {
            description: 'Message không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Queue Management'],
        summary: 'Xác nhận message từ hàng đợi',
        description: 'Xác nhận một message đã được xử lý thành công từ hàng đợi.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của message'
          }
        ],
        responses: {
          200: {
            description: 'Message được xác nhận thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
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
          404: {
            description: 'Message không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Queue Management'],
        summary: 'Xóa message từ hàng đợi (Soft Delete)',
        description: 'Xóa một message từ hàng đợi theo ID. Thực hiện soft delete (set is_delete = true).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của message'
          }
        ],
        responses: {
          200: {
            description: 'Message được xóa thành công',
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
          404: {
            description: 'Message không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/queue/messages/clear': {
      post: {
        tags: ['Queue Management'],
        summary: 'Xóa nhiều message từ hàng đợi',
        description: 'Xóa nhiều message từ hàng đợi theo trạng thái và loại. Có thể chỉ định projectId để xóa trong một project cụ thể.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/QueueClearRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Message được xóa thành công',
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
            description: 'Unauthorized - Cần JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    // Queue Management endpoints
    '/queue/status': {
      get: {
        tags: ['Queue Management'],
        summary: 'Kiểm tra trạng thái của queue',
        description: 'Kiểm tra trạng thái tổng quan của queue system',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Trạng thái queue',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
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
          }
        }
      }
    },

    '/queue/dequeue': {
      post: {
        tags: ['Queue Management'],
        summary: 'Lấy message từ queue',
        description: 'Lấy message từ queue để xử lý',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/QueueDequeueRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Message được lấy từ queue',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QueueMessage' }
              }
            }
          },
          204: {
            description: 'Không có message nào trong queue'
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
      }
    },

    '/queue/messages/{messageId}/ack': {
      post: {
        tags: ['Queue Management'],
        summary: 'Xác nhận message đã xử lý thành công',
        description: 'Xác nhận một message đã được xử lý thành công',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'messageId',
            required: true,
            schema: { type: 'string' },
            description: 'ID của message'
          }
        ],
        responses: {
          200: {
            description: 'Message được xác nhận thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
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
          404: {
            description: 'Message không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/queue/messages/{messageId}/nack': {
      post: {
        tags: ['Queue Management'],
        summary: 'Xác nhận message xử lý thất bại',
        description: 'Xác nhận một message đã được xử lý thất bại',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'messageId',
            required: true,
            schema: { type: 'string' },
            description: 'ID của message'
          }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/QueueNackRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Message được nack thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
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
          404: {
            description: 'Message không tồn tại',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/queue/history': {
      get: {
        tags: ['Queue Management'],
        summary: 'Lấy lịch sử queue messages',
        description: 'Lấy lịch sử các queue messages đã xử lý',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            description: 'Số lượng kết quả trả về',
            required: false
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0 },
            description: 'Số lượng kết quả để bỏ qua',
            required: false
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['acknowledged', 'nack', 'deleted'] },
            description: 'Trạng thái message để lọc',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Lịch sử queue messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/QueueMessage' }
                    },
                    pagination: { $ref: '#/components/schemas/PaginationResponse' }
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
          }
        }
      }
    },

    '/queue/clear': {
      post: {
        tags: ['Queue Management'],
        summary: 'Xóa tất cả messages trong queue',
        description: 'Xóa tất cả messages trong queue (emergency cleanup)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Queue được clear thành công',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
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
      }
    },

    // Stats API endpoints
    '/stats/summary': {
      get: {
        tags: ['Statistics'],
        summary: 'Lấy thống kê tổng quan',
        description: 'Lấy thống kê tổng quan về runs, projects và performance theo khoảng thời gian',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'range',
            schema: { type: 'string', enum: ['24h', '7d', '30d', '90d'], default: '7d' },
            description: 'Khoảng thời gian để lấy thống kê',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Thống kê tổng quan',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StatsSummary' }
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
      }
    },

    '/stats/projects/{id}/summary': {
      get: {
        tags: ['Statistics'],
        summary: 'Lấy thống kê cho project cụ thể',
        description: 'Lấy thống kê chi tiết cho một project cụ thể theo khoảng thời gian',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID của project'
          },
          {
            in: 'query',
            name: 'range',
            schema: { type: 'string', enum: ['24h', '7d', '30d', '90d'], default: '7d' },
            description: 'Khoảng thời gian để lấy thống kê',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Thống kê cho project',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectStatsSummary' }
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
          404: {
            description: 'Project không tìm thấy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    '/stats/trends': {
      get: {
        tags: ['Statistics'],
        summary: 'Lấy dữ liệu xu hướng',
        description: 'Lấy dữ liệu xu hướng và moving average cho các metrics theo thời gian',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'days',
            schema: { type: 'integer', minimum: 7, maximum: 90, default: 30 },
            description: 'Số ngày để lấy dữ liệu xu hướng',
            required: false
          }
        ],
        responses: {
          200: {
            description: 'Dữ liệu xu hướng',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrendsData' }
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
      }
    }
  }
}