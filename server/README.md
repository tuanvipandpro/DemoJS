InsightTestAI Server (Express + Postgres pgvector + GitHub OAuth)

Chạy:
- Tạo `server/.env` với các biến: `PORT, CORS_ORIGIN, SESSION_SECRET, DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL`.
- Khởi động Postgres (xem `docker-compose.yml` ở root; mặc định DB/USER/PASS: `insight`).
- `cd server && npm run dev`

API chính:
- GET `/api/health`
- GET `/api/auth/me`, GET `/api/auth/github`, GET `/api/auth/github/callback`, POST `/api/auth/logout`
- GET `/api/github/repos`, GET `/api/github/repos/:owner/:repo/branches`
- POST `/api/vectors/insert`, POST `/api/vectors/search`


