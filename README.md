# InsightTestAI

## Cài đặt và Chạy

### Cách 1: Sử dụng Docker Compose (Khuyến nghị)

```bash
# 1. Tạo file .env từ env.example
cp env.example .env

# 2. Chỉnh sửa file .env với các giá trị thực tế
# Đặc biệt là JWT_SECRET và SESSION_SECRET

# 3. Khởi động tất cả services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# 4. Xem logs
docker-compose logs -f

# 5. Xem logs của service cụ thể
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres

# 6. Dừng services
docker-compose down
```

### Cách 2: Chạy thủ công

#### 1. Khởi động Database

```bash
# Khởi động PostgreSQL với pgvector
docker-compose up -d postgres

# Hoặc tạo file .env với cấu hình:
# POSTGRES_DB=insighttestai
# POSTGRES_USER=insight
# POSTGRES_PASSWORD=insight
# PGDATA_PATH=./data
```

#### 2. Cấu hình Server

Tạo file `server/.env` với cấu hình sau:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY=0

# Database Configuration
DB_USER=insight
DB_PASS=insight
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insighttestai

# Database Pool Configuration
PG_POOL_MAX=10
PG_IDLE_TIMEOUT_MS=30000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Logging
LOG_LEVEL=info
```

#### 3. Chạy Server

```bash
cd server
npm install
npm run dev
```

#### 4. Chạy Frontend

```bash
npm install
npm run dev
```

## Cấu hình Database

Server sử dụng PostgreSQL với các biến môi trường riêng lẻ:

- `DB_USER`: Tên người dùng database
- `DB_PASS`: Mật khẩu database  
- `DB_HOST`: Host database (mặc định: localhost)
- `DB_PORT`: Port database (mặc định: 5432)
- `DB_NAME`: Tên database (mặc định: insighttestai)

## Docker Services

### PostgreSQL Service
- **Image**: `pgvector/pgvector:pg16`
- **Port**: 5432
- **Database**: insighttestai
- **User**: insight
- **Password**: insight
- **Volume**: `./data:/var/lib/postgresql/data`

### Backend Service
- **Port**: 3001
- **Dependencies**: PostgreSQL (đợi PostgreSQL healthy)
- **Environment**: Tự động từ file .env
- **Health Check**: `/api/health` endpoint

### Frontend Service
- **Port**: 5173
- **Dependencies**: Backend
- **Environment**: Development mode với hot reload
- **API Proxy**: Tự động proxy `/api/*` sang backend
- **Volume**: Mount source code để hot reload

## API Proxy Configuration

Frontend sử dụng Vite proxy để gọi API sang backend:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

Khi chạy trong Docker:
- Frontend container: `VITE_API_PROXY_TARGET=http://backend:3001`
- Local development: `VITE_API_PROXY_TARGET=http://localhost:3001`

## Lưu ý

- Server không còn sử dụng GitHub OAuth
- Tất cả authentication đều thông qua local username/password
- Database sẽ tự động được khởi tạo khi server khởi động
- Khi sử dụng Docker Compose, backend sẽ tự động đợi PostgreSQL sẵn sàng
- Backend service sử dụng `DB_HOST=postgres` (tên service trong docker-compose)
- Frontend có thể gọi API thông qua proxy `/api/*` -> `http://backend:3001`
- Tất cả services đều trong cùng network `insighttestai-network`
