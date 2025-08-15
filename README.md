# InsightTestAI

InsightTestAI là một nền tảng AI-powered testing cho các dự án phần mềm, tích hợp với các Git providers để tự động hóa quá trình testing và quản lý dự án.

## 🚀 Tính năng chính

### 🔐 Xác thực đa phương thức
- **Local Authentication**: Đăng ký/đăng nhập bằng username/password
- **GitHub OAuth**: Đăng nhập thông qua GitHub
- **JWT Token**: Hỗ trợ Bearer token cho API calls
- **Session-based**: Hỗ trợ session cookies

### 🗂️ Quản lý dự án
- Tạo và quản lý dự án với thông tin chi tiết
- Theo dõi tiến độ, ngân sách, độ ưu tiên
- Quản lý team và thông báo
- Tích hợp với Git repositories

### 🔗 Tích hợp Git Providers
- **GitHub**: Hỗ trợ OAuth và Personal Access Token
- **Azure DevOps**: Hỗ trợ Personal Access Token
- **Bitbucket**: Hỗ trợ Personal Access Token
- **GitLab**: Hỗ trợ Personal Access Token

### 🤖 AI Testing
- Vector search và embedding
- Tự động hóa quá trình testing
- Báo cáo và phân tích kết quả

## 🏗️ Cấu trúc dự án

```
InsightTestAI/
├── src/                          # Frontend React app
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── contexts/                 # React contexts
│   ├── services/                 # API services
│   └── theme/                    # UI theme
├── server/                       # Backend Node.js/Express
│   ├── src/
│   │   ├── auth/                 # Authentication logic
│   │   ├── config/               # Configuration files
│   │   ├── db/                   # Database initialization
│   │   ├── middleware/           # Express middleware
│   │   ├── routes/               # API routes
│   │   ├── utils/                # Utility functions
│   │   └── swagger.js            # API documentation
│   └── package.json
├── public/                       # Static assets
└── package.json                  # Frontend dependencies
```

## 🛠️ Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- PostgreSQL 12+
- Git

### Cách 1: Khởi động tự động (Khuyến nghị)

**Windows (PowerShell):**
```powershell
.\start-dev.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Cách 2: Khởi động thủ công

**1. Cài đặt dependencies:**
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

**2. Cấu hình môi trường:**
Tạo file `.env` trong thư mục `server/`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/insighttestai
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_session_secret
CORS_ORIGIN=http://localhost:5175
```

Tạo file `.env` trong thư mục gốc:
```env
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_DEV_PORT=5175
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

**3. Khởi động services:**
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🗄️ Database Schema

### Bảng chính

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  password_hash VARCHAR(255),
  provider VARCHAR(20) DEFAULT 'local',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User provider tokens
CREATE TABLE user_provider_tokens (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  team VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'Medium',
  budget VARCHAR(50),
  git_provider VARCHAR(50),
  repository VARCHAR(255),
  branch VARCHAR(100),
  notifications JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'Planning',
  progress INTEGER DEFAULT 0,
  coverage INTEGER DEFAULT 0,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/me` - Thông tin user hiện tại
- `POST /api/auth/register` - Đăng ký user
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Lấy profile
- `PUT /api/auth/profile` - Cập nhật profile
- `POST /api/auth/token/refresh` - Làm mới token

### GitHub Integration
- `GET /api/github/repos` - Danh sách repositories
- `GET /api/github/repos/:owner/:repo/branches` - Danh sách branches
- `POST /api/github/connect-with-token` - Kết nối bằng Personal Access Token
- `POST /api/github/repos/with-code` - Kết nối bằng OAuth code
- `GET /api/github/projects` - Lấy dự án từ server
- `POST /api/github/projects` - Tạo dự án mới

### Vector Operations
- `POST /api/vectors/insert` - Chèn tài liệu với embedding
- `POST /api/vectors/search` - Tìm kiếm theo embedding

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server

## 🔐 Xác thực và bảo mật

### Personal Access Token
Thay vì sử dụng OAuth popup, bạn có thể kết nối repository bằng Personal Access Token:

1. **Tạo Personal Access Token trên GitHub:**
   - Vào GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Click "Generate new token (classic)"
   - Chọn scope: `repo` (để truy cập repositories)
   - Copy token được tạo ra

2. **Kết nối Repository:**
   - Trong modal tạo project, chọn Git provider (GitHub)
   - Click "Connect Repository"
   - Nhập Personal Access Token vào input field
   - Click "Connect with Token"

### Bảo mật
- Tất cả API endpoints đều yêu cầu xác thực
- Personal Access Token được mã hóa trước khi lưu vào database
- Token chỉ được sử dụng để truy cập repositories
- Hỗ trợ CORS với cấu hình linh hoạt

## 🎨 Frontend Features

### UI Components
- **Material-UI**: Giao diện hiện đại và responsive
- **Data Grid**: Hiển thị dữ liệu dự án với sorting và filtering
- **Date Pickers**: Chọn ngày tháng cho dự án
- **Charts**: Biểu đồ thống kê với Recharts

### State Management
- **React Context**: Quản lý state toàn cục
- **Auth Context**: Quản lý trạng thái xác thực
- **Theme Context**: Quản lý theme và giao diện
- **Error Context**: Xử lý lỗi tập trung

## 🚀 Deployment

### Production Build
```bash
# Frontend
npm run build

# Backend
cd server
npm start
```

### Docker (Tùy chọn)
```bash
docker-compose up -d
```

## 🧪 Testing

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# GitHub connect (cần session)
curl -X POST http://localhost:3001/api/github/connect-with-token \
  -H "Content-Type: application/json" \
  -d '{"token": "ghp_YOUR_TOKEN", "provider": "github"}'
```

### Debug Frontend
1. Mở Developer Tools (F12)
2. Kiểm tra Console để xem lỗi
3. Kiểm tra Network để xem API calls
4. Kiểm tra Application để xem localStorage

## 🔧 Troubleshooting

### CORS Error
- Backend không chạy ở port 3001
- CORS_ORIGIN không đúng trong server/.env
- Restart backend sau khi thay đổi .env

### Token Error
- Token không đúng format (ghp_...)
- Token không có scope 'repo'
- Token đã hết hạn

### Database Error
- DATABASE_URL không đúng
- Database không chạy
- Bảng cần thiết không tồn tại

## 📚 Tài liệu API

Xem file `server/src/swagger.js` để biết chi tiết đầy đủ về API endpoints, schemas và responses.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📄 License

Dự án này được phát hành dưới MIT License.
