FROM node:20-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Start command với development mode và host 0.0.0.0 để có thể access từ bên ngoài container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
