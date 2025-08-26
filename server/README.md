# InsightTestAI Server

Server backend cho ứng dụng InsightTestAI, cung cấp API cho authentication, project management và AI testing.

## Features

- JWT-based authentication
- User management (register, login, profile)
- Project management
- GitHub integration (Personal Access Token)
- Vector database integration
- Swagger API documentation

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insighttestai
DB_USER=insight
DB_PASS=insight

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
HOST=0.0.0.0
TRUST_PROXY=0

# CORS
CORS_ORIGIN=http://localhost:5173

# Cookie (if needed)
COOKIE_SAMESITE=lax
COOKIE_SECURE=0
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the server:
```bash
npm run dev  # Development mode
npm start    # Production mode
```

## API Documentation

Swagger UI available at `/api/docs` when server is running.

## Database Schema

The server will automatically create required tables on startup:
- `users` - User accounts
- `refresh_tokens` - JWT refresh tokens
- `projects` - User projects
- `sessions` - No longer used (removed)

## Authentication Flow

1. **Register**: POST `/api/auth/register`
2. **Login**: POST `/api/auth/login` → returns access_token + refresh_token
3. **API calls**: Include `Authorization: Bearer <access_token>` header
4. **Refresh**: POST `/api/auth/token/refresh` when access token expires
5. **Logout**: POST `/api/auth/logout` (client removes tokens)

## Security Features

- JWT tokens with configurable expiration
- Refresh token rotation
- bcrypt password hashing
- CORS protection
- Helmet security headers


