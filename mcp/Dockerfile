FROM node:20-alpine

# Tạo user non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Tạo thư mục làm việc
WORKDIR /app

# Cài đặt dependencies cần thiết
RUN apk add --no-cache \
    docker-cli \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Tạo thư mục logs và artifacts
RUN mkdir -p logs artifacts && chown -R nodejs:nodejs logs artifacts

# Chuyển quyền sở hữu cho user nodejs
RUN chown -R nodejs:nodejs /app

# Chuyển sang user nodejs
USER nodejs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health/live', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["npm", "start"]
