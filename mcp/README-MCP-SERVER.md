# 🚀 InsightTestAI MCP Server

> **Model Context Protocol Server** cho InsightTestAI - cung cấp các tools cần thiết cho LLM/Worker

## 📋 Tổng quan

MCP Server này cung cấp các công cụ chuẩn hoá cho InsightTestAI để:

- 🔍 **Lấy diff** từ GitHub repositories
- 🧪 **Chạy test cases** trong môi trường Docker an toàn  
- 📊 **Phân tích coverage reports** (LCOV, Cobertura)
- 📢 **Gửi thông báo** qua Slack/GitHub Issues

## 🛠️ Cài đặt & Khởi chạy

### Yêu cầu hệ thống

- **Node.js**: 18.0.0 trở lên
- **npm**: 8.0.0 trở lên
- **Git Bash**: (Windows) hoặc Terminal (Linux/macOS)
- **Docker**: (tùy chọn, cho tool `run_ci`)

### Cài đặt nhanh

#### Tất cả hệ điều hành (Git Bash)
```bash
# Cấp quyền thực thi cho script
chmod +x scripts/run.sh

# Setup ban đầu
./scripts/run.sh setup

# Start development mode (mặc định)
./scripts/run.sh

# Start production mode
./scripts/run.sh prod

# Start với Docker
./scripts/run.sh docker

# Test server
./scripts/run.sh test

# Cleanup
./scripts/run.sh cleanup
```

#### Sử dụng npm scripts
```bash
# Setup
npm run run:setup

# Start development (mặc định)
npm run run

# Start production
npm run run:prod

# Start Docker
npm run run:docker

# Test server
npm run run:test

# Cleanup
npm run run:cleanup
```

### Cài đặt thủ công

```bash
# Clone repository
git clone <your-repo>
cd mcp

# Cấp quyền thực thi cho script
chmod +x scripts/run.sh

# Setup ban đầu
./scripts/run.sh setup

# Start development mode (mặc định)
./scripts/run.sh

# Start production mode
./scripts/run.sh prod
```

### Docker

```bash
# Build và start với docker-compose
docker-compose up -d

# Hoặc build image riêng
docker build -t insighttestai-mcp .
docker run -p 8081:8081 insighttestai-mcp
```

## 🔧 Cấu hình

### Biến môi trường

Tạo file `.env` từ `env.example`:

```bash
# MCP Server Configuration
MCP_PORT=8081
MCP_HOST=0.0.0.0

# Security & Rate Limiting
MAX_REQUESTS_PER_MINUTE=100
TOOL_TIMEOUT_SEC=900
ALLOWED_TOOLS=get_diff,run_ci,get_coverage,notify

# Docker Runner Configuration
DOCKER_RUNNER_IMAGE_DEFAULT=node:20-alpine
DOCKER_RUNNER_TIMEOUT_SEC=900
DOCKER_RUNNER_MEMORY_LIMIT=512m
DOCKER_RUNNER_CPU_LIMIT=0.5

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Lưu ý quan trọng

⚠️ **KHÔNG hard-code API keys/tokens** trong file `.env`!

Các keys/tokens sẽ được truyền từ **Orchestrator Worker** thông qua headers:
- `x-github-token`: GitHub API token
- `x-slack-webhook`: Slack webhook URL
- `x-api-key`: Authentication token

## 🚀 Sử dụng

### Health Check

```bash
# Basic health check
curl http://localhost:8081/health

# Detailed health
curl http://localhost:8081/health/detailed

# Readiness check
curl http://localhost:8081/health/ready

# Liveness check
curl http://localhost:8081/health/live
```

### Tools API

#### 1. Lấy diff từ GitHub

```bash
curl -X POST http://localhost:8081/tools/get_diff \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "x-github-token: YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "microsoft/vscode",
    "commitId": "abc123def456",
    "paths": ["src/", "tests/"],
    "maxPatchBytes": 262144
  }'
```

#### 2. Chạy test trong Docker

```bash
curl -X POST http://localhost:8081/tools/run_ci \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "p-123",
    "testPlan": "Run unit tests for user service",
    "runner": {
      "image": "node:20",
      "workdir": "/app",
      "cmd": ["npm", "test"]
    },
    "artifacts": ["junit.xml", "coverage/"],
    "timeoutSec": 900
  }'
```

#### 3. Phân tích coverage

```bash
curl -X POST http://localhost:8081/tools/get_coverage \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "cov-2024-01-20-001",
    "format": "lcov"
  }'
```

#### 4. Gửi thông báo

```bash
curl -X POST http://localhost:8081/tools/notify \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "x-slack-webhook: YOUR_SLACK_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "slack:#qa-alerts",
    "message": "Test run completed successfully",
    "level": "info"
  }'
```

## 📊 Monitoring & Logs

### Logs

Logs được lưu trong thư mục `logs/`:
- `mcp-server.log`: Application logs
- `exceptions.log`: Exception logs  
- `rejections.log`: Promise rejection logs

### Health Monitoring

- **Health endpoint**: `/health`
- **Metrics**: Memory usage, uptime, environment info
- **Dependencies**: Docker status, external services

### Rate Limiting

- **Default**: 100 requests/minute
- **Configurable**: `MAX_REQUESTS_PER_MINUTE` env var
- **Headers**: `X-RateLimit-*` headers

## 🔒 Bảo mật

### Authentication

- **Required**: `Authorization` hoặc `x-api-key` header
- **Format**: `Bearer <token>` hoặc raw token
- **Validation**: Token length và format cơ bản

### Sandbox Execution

- **Docker isolation**: Network isolation, resource limits
- **Security options**: `no-new-privileges`, dropped capabilities
- **Resource limits**: CPU, memory, file descriptors

### Input Validation

- **Schema validation**: Joi schemas cho tất cả tools
- **Input sanitization**: Loại bỏ ký tự nguy hiểm
- **Size limits**: Patch size, message length

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Start server
npm start

# Test endpoints
curl http://localhost:8081/health
curl http://localhost:8081/tools
```

### Load Testing

```bash
# Sử dụng Apache Bench
ab -n 1000 -c 10 http://localhost:8081/health

# Hoặc sử dụng Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:8081/health
```

## 🚀 Deployment

### Production

```bash
# Build Docker image
docker build -t insighttestai-mcp:latest .

# Run container
docker run -d \
  --name mcp-server \
  -p 8081:8081 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e NODE_ENV=production \
  insighttestai-mcp:latest
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f mcp-server

# Stop services
docker-compose down
```

### Environment Variables

```bash
# Production environment
export NODE_ENV=production
export LOG_LEVEL=warn
export LOG_FORMAT=json
export MCP_PORT=8081
```

## 📚 API Documentation

### Base URL
```
http://localhost:8081
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome page |
| GET | `/health` | Health check |
| GET | `/health/detailed` | Detailed health |
| GET | `/health/ready` | Readiness check |
| GET | `/health/live` | Liveness check |
| GET | `/tools` | List available tools |
| GET | `/tools/:toolName` | Tool information |
| POST | `/tools/get_diff` | Get GitHub diff |
| POST | `/tools/run_ci` | Run CI tests |
| POST | `/tools/get_coverage` | Get coverage report |
| POST | `/tools/notify` | Send notification |

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "traceId": "mcp-xyz-123",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port already in use
```bash
# Kiểm tra process sử dụng port 8081
netstat -ano | findstr :8081  # Windows
lsof -i :8081                 # Linux/Mac

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac
```

#### 2. Docker permission denied
```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER

# Restart session
newgrp docker
```

#### 3. Node modules issues
```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Debug Mode

```bash
# Set debug environment
export DEBUG=*
export LOG_LEVEL=debug

# Start server
npm start
```

### Log Analysis

```bash
# View real-time logs
tail -f logs/mcp-server.log

# Search for errors
grep "ERROR" logs/mcp-server.log

# Filter by trace ID
grep "mcp-xyz-123" logs/mcp-server.log
```

## 🤝 Contributing

### Development Setup

```bash
# Clone repository
git clone <your-repo>
cd mcp

# Cấp quyền thực thi cho script
chmod +x scripts/run.sh

# Setup ban đầu
./scripts/run.sh setup

# Start development server (mặc định)
./scripts/run.sh

# Hoặc sử dụng npm scripts
npm run run
```

### Code Style

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **JSDoc**: Documentation

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🆘 Support

### Issues
- **GitHub Issues**: Báo cáo bugs và feature requests
- **Documentation**: Xem README.md gốc

### Contact
- **Team**: InsightTestAI Team
- **Email**: support@insighttestai.com

---

**Made with ❤️ by InsightTestAI Team**
