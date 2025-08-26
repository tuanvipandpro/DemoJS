# 🛠️ Implementation Guide - Orchestrator Worker

## 📋 Tổng Quan

Worker được thiết kế theo mô hình **Plugin Architecture** với các thành phần có thể thay thế dễ dàng và đã được đơn giản hóa để chỉ có **2 mode chính**:

- **🔄 Development Mode**: Gemini API + Local Queue (không cần AWS)
- **🚀 Production Mode**: AWS SQS + Bedrock LLM (cloud-ready)

## 🎯 Cách Sử Dụng Đơn Giản

### **Development Mode (Mặc định)**
```bash
npm run dev
```
- ✅ Sử dụng **Gemini API** (Google AI Studio)
- ✅ Sử dụng **Local Queue** (không cần AWS)
- ✅ Tự động detect environment

### **Production Mode**
```bash
npm start
```
- ✅ Sử dụng **AWS SQS** cho queue
- ✅ Sử dụng **AWS Bedrock** cho LLM
- ✅ Yêu cầu AWS credentials

---

## 🏗️ Tổng Quan Kiến Trúc

Worker được thiết kế theo mô hình **Plugin Architecture** với các thành phần có thể thay thế dễ dàng:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Queue Layer   │    │   FSM Engine    │    │  Tool Layer     │
│   (Abstract)    │    │   (Core)        │    │  (MCP Client)   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Local Queue   │    │ • State Machine │    │ • Tool Registry │
│ • SQS Queue     │    │ • Transitions   │    │ • Tool Executor │
│ • Redis Queue   │    │ • Error Handler │    │ • Retry Logic   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │   (Abstract)    │
                    ├─────────────────┤
                    │ • PostgreSQL    │
                    │ • Vector Store  │
                    │ • Metrics Store │
                    └─────────────────┘
```

---

## 🛠️ Cài Đặt Nhanh

### **1. Development Mode (Khuyến nghị cho bắt đầu)**

```bash
# Copy env template
cp env.example .env

# Chỉ cần cập nhật Gemini API key
GEMINI_API_KEY=your_actual_api_key_here

# Chạy worker
npm run dev
```

**Chỉ cần 1 dòng cấu hình!** 🎉

### **2. Production Mode (Khi cần scale)**

```bash
# Cập nhật .env
NODE_ENV=production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SQS_QUEUE_URL=your_sqs_url

# Chạy production
npm start
```

---

## 🔧 Cấu Hình Tự Động

Worker sẽ **tự động detect** environment và sử dụng cấu hình phù hợp:

| Environment | Queue | LLM | Cấu hình cần thiết |
|-------------|-------|-----|-------------------|
| `development` | Local | Gemini | `GEMINI_API_KEY` |
| `production` | SQS | Bedrock | AWS credentials + SQS URL |

**Không cần thay đổi code!** Chỉ cần set `NODE_ENV` và cấu hình tương ứng.

---

## 🗄️ Database Configuration

### **Individual Parameters (Khuyến nghị)**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insighttestai
DB_USER=insight
DB_PASS=insightp
DB_POOL_SIZE=10
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
```

### **SSL Configuration**
```bash
# Enable SSL (production)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Disable SSL (development)
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
```

### **Connection String Auto-Generated**
Worker sẽ tự động tạo connection string từ các parameters:
```
postgresql://insight:insightp@localhost:5432/insighttestai
```

---

## 📁 Cấu Trúc Thư Mục

```
worker/
├── src/
│   ├── core/                 # Core FSM Engine
│   │   ├── stateMachine.js   # State machine implementation
│   │   ├── transitions.js    # State transition logic
│   │   └── errorHandler.js   # Error handling & recovery
│   ├── queue/                # Queue abstraction layer
│   │   ├── base.js          # Abstract queue interface
│   │   ├── localQueue.js    # Local in-memory queue
│   │   ├── sqsQueue.js      # AWS SQS implementation
│   │   └── redisQueue.js    # Redis queue implementation
│   ├── tools/                # Tool execution layer
│   │   ├── mcpClient.js     # MCP server client
│   │   ├── toolRegistry.js  # Tool registration & discovery
│   │   └── executor.js      # Tool execution with retry
│   ├── services/             # Service layer
│   │   └── llmService.js    # LLM service abstraction
│   ├── data/                 # Data persistence layer
│   │   ├── database.js      # Database connection & queries
│   │   ├── models/          # Data models
│   │   └── repositories/    # Data access layer
│   ├── config/               # Configuration management
│   │   ├── env.js           # Environment variables
│   │   └── queueConfig.js   # Queue-specific configs
│   └── utils/                # Utility functions
│       ├── logger.js         # Structured logging
│       └── metrics.js        # Metrics collection
├── tests/                    # Test files
├── docker/                   # Docker configuration
└── scripts/                  # Utility scripts
```

---

## 🔧 Các Thành Phần Chính

### 1. Queue Layer (Abstract)
- **Interface**: `BaseQueue` với methods: `enqueue`, `dequeue`, `ack`, `nack`
- **Implementations**: `LocalQueue`, `SQSQueue`, `RedisQueue`
- **Configuration**: Thay đổi queue type qua environment variable

### 2. FSM Engine (Core)
- **StateMachine**: Quản lý state transitions
- **Transitions**: Logic chuyển đổi giữa các states
- **ErrorHandler**: Xử lý lỗi và recovery strategies

### 3. Tool Layer (MCP)
- **MCPClient**: Kết nối với MCP server
- **ToolRegistry**: Đăng ký và quản lý tools
- **Executor**: Thực thi tools với retry logic

### 4. Data Layer (Abstract)
- **Database**: Connection pooling và query execution
- **Models**: Data structures cho Runs, RunLogs, Projects
- **Repositories**: Data access patterns

### 5. LLM Service Layer
- **LLMService**: Abstract class cho LLM providers
- **GeminiService**: Google Gemini API integration
- **BedrockService**: AWS Bedrock integration
- **LLMServiceFactory**: Factory pattern để tạo service phù hợp

---

## 🚀 Khởi Chạy

### **Development (Gemini + Local)**
```bash
npm run dev
```

### **Production (AWS SQS + Bedrock)**
```bash
npm start
```

### **Test Gemini API**
```bash
npm run test:gemini
```

### **Test Configuration**
```bash
npm run test:config
```

---

## 📊 Monitoring & Logs

### **Log Levels**
```bash
LOG_LEVEL=debug    # Chi tiết nhất
LOG_LEVEL=info     # Thông tin cơ bản (mặc định)
LOG_LEVEL=warn     # Chỉ cảnh báo và lỗi
LOG_LEVEL=error    # Chỉ lỗi
```

### **Xem Logs**
```bash
# Development logs
npm run dev

# Production logs
npm start
```

---

## 🔄 Chuyển Đổi Giữa Mode

### **Từ Dev sang Production**
```bash
# 1. Cập nhật .env
NODE_ENV=production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SQS_QUEUE_URL=your_sqs_url

# 2. Chạy production
npm start
```

### **Từ Production về Dev**
```bash
# 1. Cập nhật .env
NODE_ENV=development
GEMINI_API_KEY=your_gemini_key

# 2. Chạy development
npm run dev
```

---

## 🧪 Testing

### **Test Gemini Integration**
```bash
npm run test:gemini
```

### **Test Configuration**
```bash
npm run test:config
```

### **Test MCP Connection**
```bash
# Đảm bảo MCP server đang chạy
curl http://localhost:8081/health

# Test worker
npm run dev
```

---

## 🐛 Troubleshooting

### **Development Mode Issues**

#### 1. Gemini API Key Missing
```bash
Error: GEMINI_API_KEY is required for Gemini provider
```
**Giải pháp**: Kiểm tra `GEMINI_API_KEY` trong `.env`

#### 2. MCP Server Connection Failed
```bash
Error: MCP server is not healthy
```
**Giải pháp**: Kiểm tra MCP server đang chạy ở port 8081

#### 3. Database Connection Failed
```bash
Error: Database connection failed
```
**Giải pháp**: Kiểm tra database parameters trong `.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- Đảm bảo PostgreSQL đang chạy
- Kiểm tra credentials

### **Production Mode Issues**

#### 1. AWS Credentials Missing
```bash
Error: AWS_ACCESS_KEY_ID is required for production
```
**Giải pháp**: Cập nhật AWS credentials trong `.env`

#### 2. SQS Queue URL Missing
```bash
Error: SQS_QUEUE_URL is required for production
```
**Giải pháp**: Cập nhật SQS queue URL trong `.env`

---

## 📈 Performance Tuning

### **Development Mode**
```bash
# Tăng concurrency
WORKER_CONCURRENCY=10

# Giảm retry
MAX_RETRY=2

# Điều chỉnh confidence
CONFIDENCE_THRESHOLD=0.7
```

### **Production Mode**
```bash
# Sử dụng SQS auto-scaling
# Sử dụng Bedrock với model phù hợp
# Monitor AWS CloudWatch metrics
```

### **Database Tuning**
```bash
# Connection pool size
DB_POOL_SIZE=20

# SSL configuration
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false  # Cho development
```

---

## 🔒 Security

### **Development Mode**
- **Gemini API Key**: Bảo vệ trong `.env`
- **Local Queue**: Không có network exposure
- **Database**: Local PostgreSQL với credentials cơ bản

### **Production Mode**
- **AWS IAM**: Sử dụng least privilege
- **SQS**: Encrypted at rest
- **Bedrock**: AWS security best practices
- **Database**: SSL enabled, strong credentials

---

## 🔧 Cách Mở Rộng

### Thêm Queue Provider mới
1. Implement interface `BaseQueue`
2. Thêm configuration trong `queueConfig.js`
3. Update factory function trong `queueFactory.js`

### Thêm Tool mới
1. Đăng ký tool trong MCP server
2. Thêm tool definition trong `toolRegistry.js`
3. Implement tool-specific logic trong `executor.js`

### Thêm State mới
1. Định nghĩa state trong `stateMachine.js`
2. Thêm transition logic trong `transitions.js`
3. Update error handling nếu cần

### Thêm LLM Provider mới
1. Extend `LLMService` class
2. Implement required methods
3. Add provider to `LLMServiceFactory`

---

## 📚 API Reference

### **LLM Service Methods**
```javascript
// Generate test plan
const testPlan = await llmService.generateTestPlan(repo, commitId, diff);

// Analyze test results
const analysis = await llmService.analyzeTestResults(results, coverage);

// Generate test cases
const testCases = await llmService.generateTestCases(diff, context);
```

### **Queue Methods**
```javascript
// Enqueue message
await queue.enqueue(message, options);

// Dequeue message
const message = await queue.dequeue(options);

// Acknowledge message
await queue.ack(messageId);

// Negative acknowledge
await queue.nack(messageId, options);
```

---

## 🌍 Environment Variables

```bash
# Environment
NODE_ENV=development|production

# Queue Configuration
QUEUE_TYPE=local|sqs|redis
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/...
REDIS_URL=redis://localhost:6379

# Database Configuration - Individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insighttestai
DB_USER=insight
DB_PASS=insightp
DB_POOL_SIZE=10
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true

# LLM Configuration
LLM_PROVIDER=gemini|bedrock
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
BEDROCK_MODEL_ID=anthropic.claude-3.5-sonnet
BEDROCK_REGION=us-east-1

# MCP Server
MCP_SERVER_URL=http://localhost:8081

# Worker Configuration
MAX_RETRY=3
CONFIDENCE_THRESHOLD=0.8
WORKER_CONCURRENCY=5

# Logging
LOG_LEVEL=info

# Server
PORT=3002
```

---

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t insighttestai-worker .
docker run -e NODE_ENV=production insighttestai-worker
```

---

## 📊 Monitoring & Observability

- **Metrics**: Prometheus metrics cho queue size, processing time, error rates
- **Logging**: Structured logging với correlation IDs
- **Tracing**: Distributed tracing cho end-to-end visibility
- **Health Checks**: Health check endpoints cho queue và database

---

## 🤝 Support

### **Issues**
- **GitHub Issues**: Báo cáo bugs và feature requests
- **Documentation**: Xem README.md gốc

### **Contact**
- **Team**: InsightTestAI Team
- **Email**: support@insighttestai.com

---

## 🎉 **Tóm Tắt**

**Chỉ cần 2 lệnh để chạy worker:**

1. **`npm run dev`** → Development mode với Gemini API
2. **`npm start`** → Production mode với AWS SQS + Bedrock

**Database Configuration:**
- Sử dụng **individual parameters** (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS)
- **Auto-generated connection string**
- **SSL support** cho production

**Kiến trúc Plugin:**
- **Queue Layer**: Local, SQS, Redis
- **LLM Service**: Gemini, Bedrock
- **FSM Engine**: State machine core
- **Tool Layer**: MCP integration

**Không cần script phức tạp!** Worker tự động detect environment và sử dụng cấu hình phù hợp.

---

**Made with ❤️ by InsightTestAI Team**

> 💡 **Tip**: Bắt đầu với `npm run dev` để test Gemini API, sau đó chuyển sang `npm start` khi cần scale production!
