#!/bin/bash

# InsightTestAI Development Startup Script
# Script này sẽ start database bằng Docker và chạy server + client ở development mode

set -e

echo "🚀 Starting InsightTestAI in Development Mode..."

# Kiểm tra Docker có sẵn không
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker and try again"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed or not in PATH"
    echo "Please install Docker Compose and try again"
    exit 1
fi

# Kiểm tra Node.js có sẵn không
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ and try again"
    exit 1
fi

# Kiểm tra npm có sẵn không
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    echo "Please install npm and try again"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function để cleanup khi script bị interrupt
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    
    # Dừng server và client nếu đang chạy
    if [ ! -z "$SERVER_PID" ]; then
        echo "Stopping server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$CLIENT_PID" ]; then
        echo "Stopping client (PID: $CLIENT_PID)..."
        kill $CLIENT_PID 2>/dev/null || true
    fi
    
    # Dừng database
    echo "Stopping database..."
    docker-compose -f docker-compose-dev.yml down
    
    echo "✅ Development environment stopped"
    exit 0
}

# Trap interrupt signals
trap cleanup SIGINT SIGTERM

# Start database
echo "🗄️ Starting PostgreSQL database..."
docker-compose -f docker-compose-dev.yml up -d

# Đợi database sẵn sàng
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose-dev.yml exec -T postgres pg_isready -U postgres -d insighttestai; do
    echo "Database is not ready yet, waiting..."
    sleep 1
done

echo "✅ Database is ready!"

# Kiểm tra và cài đặt dependencies cho server
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
else
    echo "Server dependencies already installed"
fi

# Kiểm tra và cài đặt dependencies cho client
echo "📦 Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    echo "Installing client dependencies..."
    npm install
else
    echo "Client dependencies already installed"
fi

cd ..

# Start server ở development mode
echo "🚀 Starting server in development mode..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Đợi server khởi động
echo "⏳ Waiting for server to start..."
sleep 5

# Kiểm tra server có chạy không
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Server failed to start"
    cleanup
fi

echo "✅ Server is running on http://localhost:3001"

# Start client ở development mode
echo "🎨 Starting client in development mode..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

# Đợi client khởi động
echo "⏳ Waiting for client to start..."
sleep 5

echo "✅ Client is starting on http://localhost:5173"
echo ""
echo "🎯 Development environment is ready!"
echo "📊 Server: http://localhost:3001"
echo "🎨 Client: http://localhost:5173"
echo "🗄️ Database: localhost:5432"
echo "📚 API Docs: http://localhost:3001/api/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Đợi user interrupt
wait