FROM node:18-alpine

# Cài đặt curl cho healthcheck
RUN apk add --no-cache curl

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies (bao gồm cả dotenv)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start command
CMD ["npm", "start"]
