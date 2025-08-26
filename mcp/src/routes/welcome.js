import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Welcome page
router.get('/', (req, res) => {
  const welcomeData = {
    title: 'InsightTestAI MCP Server',
    description: 'Model Context Protocol Server cho InsightTestAI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      tools: '/tools',
      welcome: '/',
      docs: '/docs'
    },
    tools: [
      {
        name: 'get_diff',
        description: 'Lấy diff từ GitHub API',
        endpoint: '/tools/get_diff'
      },
      {
        name: 'run_ci',
        description: 'Chạy test trong Docker sandbox',
        endpoint: '/tools/run_ci'
      },
      {
        name: 'get_coverage',
        description: 'Phân tích coverage report',
        endpoint: '/tools/get_coverage'
      },
      {
        name: 'notify',
        description: 'Gửi thông báo qua Slack/GitHub',
        endpoint: '/tools/notify'
      }
    ],
    documentation: {
      api: '/docs',
      mcp: '/docs/mcp',
      examples: '/docs/examples'
    }
  };

  logger.info('Welcome page accessed', {
    endpoint: '/',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    acceptHeader: req.headers.accept,
    timestamp: new Date().toISOString()
  });

  // Nếu request muốn JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json(welcomeData);
  }

  // Render HTML welcome page
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${welcomeData.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .content {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 2rem;
        }
        
        .section {
            margin-bottom: 2rem;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 1rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }
        
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .tool-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .tool-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .tool-card h3 {
            color: #495057;
            margin-bottom: 0.5rem;
        }
        
        .tool-card p {
            color: #6c757d;
            margin-bottom: 1rem;
        }
        
        .endpoint {
            background: #e9ecef;
            padding: 0.5rem;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9rem;
            color: #495057;
        }
        
        .status {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-bottom: 1rem;
        }
        
        .endpoints-list {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
        }
        
        .endpoints-list h3 {
            margin-bottom: 1rem;
            color: #495057;
        }
        
        .endpoint-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .endpoint-item:last-child {
            border-bottom: none;
        }
        
        .endpoint-name {
            font-weight: bold;
            color: #495057;
        }
        
        .endpoint-path {
            font-family: monospace;
            color: #6c757d;
        }
        
        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 2rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .tools-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 ${welcomeData.title}</h1>
            <p>${welcomeData.description} - Phiên bản ${welcomeData.version}</p>
            <div class="status">🟢 Online</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📋 Tổng quan</h2>
                <p>MCP Server này cung cấp các công cụ cần thiết cho InsightTestAI để:</p>
                <ul style="margin-left: 2rem; margin-top: 1rem;">
                    <li>Lấy thông tin diff từ GitHub repositories</li>
                    <li>Chạy test cases trong môi trường Docker an toàn</li>
                    <li>Phân tích coverage reports</li>
                    <li>Gửi thông báo qua các kênh khác nhau</li>
                </ul>
            </div>
            
            <div class="section">
                <h2>🛠️ Các Tools có sẵn</h2>
                <div class="tools-grid">
                    ${welcomeData.tools.map(tool => `
                        <div class="tool-card">
                            <h3>${tool.name}</h3>
                            <p>${tool.description}</p>
                            <div class="endpoint">${tool.endpoint}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>🔗 API Endpoints</h2>
                <div class="endpoints-list">
                    <h3>Health & Monitoring</h3>
                    <div class="endpoint-item">
                        <span class="endpoint-name">Health Check</span>
                        <span class="endpoint-path">GET /health</span>
                    </div>
                    <div class="endpoint-item">
                        <span class="endpoint-name">Detailed Health</span>
                        <span class="endpoint-path">GET /health/detailed</span>
                    </div>
                    <div class="endpoint-item">
                        <span class="endpoint-name">Readiness</span>
                        <span class="endpoint-path">GET /health/ready</span>
                    </div>
                    <div class="endpoint-item">
                        <span class="endpoint-name">Liveness</span>
                        <span class="endpoint-path">GET /health/live</span>
                    </div>
                    
                    <h3 style="margin-top: 2rem;">API Documentation</h3>
                    <div class="endpoint-item">
                        <span class="endpoint-name">Swagger UI</span>
                        <span class="endpoint-path">GET /docs</span>
                    </div>
                    <div class="endpoint-item">
                        <span class="endpoint-name">Tools API</span>
                        <span class="endpoint-path">GET /tools</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📚 Tài liệu</h2>
                <p>Để biết thêm chi tiết về cách sử dụng MCP Server, vui lòng tham khảo:</p>
                <ul style="margin-left: 2rem; margin-top: 1rem;">
                    <li><strong><a href="/docs" style="color: #667eea; text-decoration: none;">📖 API Documentation (Swagger)</a></strong> - Chi tiết các endpoints và schemas</li>
                    <li><strong>README.md</strong> - Tài liệu tổng quan</li>
                    <li><strong>Examples</strong> - Các ví dụ sử dụng</li>
                </ul>
                
                <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
                    <h3 style="margin-bottom: 1rem; color: white;">🚀 Khám phá API ngay bây giờ!</h3>
                    <p style="margin-bottom: 1rem;">Sử dụng Swagger UI để:</p>
                    <ul style="margin-left: 2rem; margin-bottom: 1rem;">
                        <li>Xem tất cả available endpoints</li>
                        <li>Test API calls trực tiếp</li>
                        <li>Hiểu rõ request/response schemas</li>
                        <li>Xem authentication requirements</li>
                    </ul>
                    <a href="/docs" style="display: inline-block; background: white; color: #667eea; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 25px; font-weight: bold; transition: transform 0.2s;">📖 Mở Swagger UI</a>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2024 InsightTestAI Team. Được xây dựng với ❤️ và Node.js</p>
            <p>Server time: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </div>
</body>
</html>`;

  res.send(html);
});

export { router as welcomeRouter };
