# InsightTestAI Server

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` với cấu hình sau:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY=0

# Database Configuration
DB_USER=your_db_username
DB_PASS=your_db_password
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

## Chạy server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Cấu hình Database

Server sử dụng PostgreSQL với các biến môi trường riêng lẻ:

- `DB_USER`: Tên người dùng database
- `DB_PASS`: Mật khẩu database  
- `DB_HOST`: Host database (mặc định: localhost)
- `DB_PORT`: Port database (mặc định: 5432)
- `DB_NAME`: Tên database (mặc định: insighttestai)

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại
- `GET /api/auth/profile` - Lấy profile người dùng
- `PUT /api/auth/profile` - Cập nhật profile
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/token/refresh` - Làm mới token
- `GET /api/vectors` - Vector operations
- `GET /api/docs` - Swagger UI documentation

## Lưu ý

- Server không còn sử dụng GitHub OAuth
- Tất cả authentication đều thông qua local username/password
- Database sẽ tự động được khởi tạo khi server khởi động


