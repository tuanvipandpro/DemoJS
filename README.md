# InsightTestAI

InsightTestAI là một nền tảng tự động hóa testing thông minh, sử dụng AI để tạo và thực thi test cases dựa trên code changes và requirements.

## 🚀 Tính năng chính

### 🔐 Authentication & Authorization
- **JWT-based authentication** với refresh token
- **Role-based access control** (owner, admin, member, viewer)
- **Project ownership** - user tạo project tự động trở thành owner

### 📁 Project Management
- **Tạo project** với thông tin cơ bản (tên, mô tả)
- **Git integration** - liên kết với repository (tùy chọn)
- **Notification channels** - email, Slack, Discord, hoặc không có
- **Test instructions** - template có sẵn hoặc tùy chỉnh

### 🔗 Git Integration
- **Git Providers** được quản lý từ database
- **Self-hosted support** - hỗ trợ GitLab, Gitea, Gogs tự host
- **Domain field** chỉ hiển thị khi provider là self-hosted
- **Personal Access Token** để truy cập private repositories

#### Git Providers được hỗ trợ:
- **Cloud providers**: GitHub, GitLab, Bitbucket, Gitea
- **Self-hosted**: GitLab, Gitea, Gogs
- **Cấu hình**: Mỗi provider có domain và cờ `is_selfhost`

### 👥 Team Collaboration
- **Project members** - owner có thể thêm/xóa thành viên
- **Role management** - owner, admin, member, viewer
- **Permission-based access** - mỗi role có quyền khác nhau

### 🧪 Test Automation
- **Template instructions** - các test view points có sẵn
- **Custom instructions** - nhập tài liệu tùy chỉnh
- **AI-powered test generation** - tự động tạo test cases

## 🏗️ Kiến trúc hệ thống

### Backend (Node.js + Express)
```
server/
├── src/
│   ├── auth/           # Authentication & authorization
│   ├── config/         # Configuration & environment
│   ├── db/            # Database schema & migrations
│   ├── middleware/    # Express middleware
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
```

### Frontend (React + Material-UI)
```
client/
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts (Auth, Theme)
│   ├── pages/         # Page components
│   ├── services/      # API client & utilities
│   └── theme.js       # Material-UI theme
```

### Database (PostgreSQL)
- **users** - thông tin người dùng
- **projects** - dự án và cấu hình
- **git_providers** - danh sách Git providers
- **project_members** - thành viên dự án
- **runs** - lịch sử chạy test
- **rag_documents** - tài liệu cho AI

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- Node.js 18+
- PostgreSQL 14+
- Docker (tùy chọn)

### Backend
```bash
cd server
npm install
npm run db:migrate    # Cập nhật database schema
npm run db:seed       # Thêm dữ liệu mẫu
npm start             # Chạy server
```

### Frontend
```bash
cd client
npm install
npm run dev           # Development mode
npm run build         # Production build
```

## 📚 API Documentation

### Authentication
```
POST /api/auth/login          # Đăng nhập
POST /api/auth/register      # Đăng ký
GET  /api/auth/profile       # Lấy thông tin user
POST /api/auth/logout        # Đăng xuất
```

### Projects
```
GET    /api/projects                    # Lấy danh sách projects
POST   /api/projects                    # Tạo project mới
GET    /api/projects/:id               # Lấy thông tin project
PUT    /api/projects/:id               # Cập nhật project
DELETE /api/projects/:id               # Xóa project
```

### Git Integration
```
GET  /api/git/providers                # Lấy danh sách Git providers
GET  /api/git/repositories             # Lấy repositories
POST /api/git/validate-token          # Validate access token
```

### Project Members
```
GET    /api/projects/:id/members       # Lấy danh sách members
POST   /api/projects/:id/members       # Thêm member
DELETE /api/projects/:id/members/:id   # Xóa member
```

## 🔧 Cấu hình Git Provider

### Thêm Git Provider mới
```sql
INSERT INTO git_providers (name, display_name, domain, is_selfhost) 
VALUES ('company-gitlab', 'Company GitLab', 'git.company.com', TRUE);
```

### Cập nhật provider
```sql
UPDATE git_providers 
SET domain = 'new-git.company.com', is_selfhost = TRUE 
WHERE name = 'company-gitlab';
```

## 🎯 Workflow sử dụng

1. **Đăng ký/Đăng nhập** vào hệ thống
2. **Tạo project** với thông tin cơ bản
3. **Liên kết Git** (tùy chọn):
   - Chọn Git provider từ danh sách
   - Nhập Personal Access Token
   - Nhập domain nếu là self-hosted
4. **Cấu hình notifications** - chọn kênh thông báo
5. **Thêm test instructions** - chọn template hoặc nhập tùy chỉnh
6. **Invite team members** - thêm thành viên với role phù hợp
7. **Bắt đầu testing** - AI sẽ tự động tạo test cases

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.
