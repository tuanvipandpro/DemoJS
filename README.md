# InsightTestAI

InsightTestAI là một nền tảng AI-powered testing cho các dự án phần mềm, tích hợp với các Git providers để tự động hóa quá trình testing.

## Tính năng mới: Personal Access Token

### Cách sử dụng Personal Access Token

Thay vì sử dụng OAuth popup, giờ đây bạn có thể kết nối repository bằng Personal Access Token:

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

3. **Chọn Repository và Branch:**
   - Sau khi connect thành công, chọn repository từ dropdown
   - Dropdown hiển thị thông tin chi tiết: tên, mô tả, ngôn ngữ, private status
   - Sau khi chọn repository, branch dropdown sẽ tự động load
   - Chọn branch mong muốn từ danh sách

4. **Bảo mật:**
   - Token sẽ được mã hóa và lưu trữ an toàn trong database
   - Token chỉ được sử dụng để truy cập repositories
   - Token không được lưu trong project data hoặc localStorage

### Ưu điểm của cách tiếp cận mới

- **Bảo mật cao hơn:** Không cần popup OAuth, giảm rủi ro bảo mật
- **Kiểm soát tốt hơn:** Bạn có thể tạo token với quyền hạn cụ thể
- **Ổn định hơn:** Không phụ thuộc vào OAuth flow có thể bị gián đoạn
- **Dễ dàng quản lý:** Có thể revoke token bất cứ lúc nào từ GitHub
- **UI/UX tốt hơn:** Dropdown hiển thị thông tin chi tiết về repository
- **Tự động hóa:** Branch dropdown tự động load sau khi chọn repository

## Cài đặt và chạy

### Cách 1: Khởi động tự động (Khuyến nghị)
Sử dụng script có sẵn để khởi động cả frontend và backend:

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

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend (trong terminal mới):**
```bash
npm install
npm run dev
```

**Lưu ý:** Frontend sẽ tự động chạy ở port có sẵn (thường là 5173, 5174, hoặc 5175). Nếu gặp lỗi CORS, hãy đảm bảo backend đã được cấu hình đúng.

## Cấu hình môi trường

### Backend (.env trong thư mục server)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/insighttestai
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_session_secret
CORS_ORIGIN=http://localhost:5175
```

### Frontend (.env trong thư mục gốc)
```env
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_DEV_PORT=5175
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Cấu hình CORS

Backend hỗ trợ nhiều origins mặc định:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite alternate)
- `http://localhost:5175` (Vite alternate)
- `http://localhost:3000` (Create React App default)
- `http://localhost:3001` (Backend port)

Nếu frontend chạy ở port khác, thêm vào biến môi trường `CORS_ORIGIN`.

## Database Schema

Bảng `user_provider_tokens` được sử dụng để lưu trữ Personal Access Token:

```sql
CREATE TABLE user_provider_tokens (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);
```

## API Endpoints

### POST /api/github/connect-with-token
Kết nối với GitHub bằng Personal Access Token:

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
  "provider": "github"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "login": "username",
    "name": "User Name",
    "email": "user@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/..."
  },
  "repositories": [...]
}
```

## Bảo mật

- Tất cả API endpoints đều yêu cầu xác thực
- Personal Access Token được mã hóa trước khi lưu vào database
- Token chỉ được sử dụng cho mục đích truy cập repositories
- Không có token nào được lưu trong frontend hoặc localStorage

## Hỗ trợ

Nếu gặp vấn đề với Personal Access Token:

1. **Token không hợp lệ:** Kiểm tra token có đúng format và còn hiệu lực không
2. **Quyền hạn không đủ:** Đảm bảo token có scope `repo`
3. **Token đã hết hạn:** Tạo token mới và thử lại

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## Test và Debug

### Test API Endpoints

Sau khi khởi động backend, bạn có thể test API endpoints:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test GitHub connect endpoint (cần session)
curl -X POST http://localhost:3001/api/github/connect-with-token \
  -H "Content-Type: application/json" \
  -d '{"token": "ghp_YOUR_TOKEN", "provider": "github"}'
```

### Debug Frontend

1. **Mở Developer Tools** (F12)
2. **Kiểm tra Console** để xem lỗi
3. **Kiểm tra Network** để xem API calls
4. **Kiểm tra Application** để xem localStorage

### Troubleshooting

#### CORS Error
- Backend không chạy ở port 3001
- CORS_ORIGIN không đúng trong server/.env
- Restart backend sau khi thay đổi .env

#### Token Error
- Token không đúng format (ghp_...)
- Token không có scope 'repo'
- Token đã hết hạn

#### Database Error
- DATABASE_URL không đúng
- Database không chạy
- Bảng user_provider_tokens không tồn tại

Xem file `test-api.md` để biết thêm chi tiết về testing.
