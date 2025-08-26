#!/bin/bash

# ========================================
#    InsightTestAI MCP Server Runner
# ========================================

# Default mode
MODE="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        prod|production)
            MODE="prod"
            shift
            ;;
        docker)
            MODE="docker"
            shift
            ;;
        test)
            MODE="test"
            shift
            ;;
        cleanup)
            MODE="cleanup"
            shift
            ;;
        setup)
            MODE="setup"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [mode]"
            echo ""
            echo "Available modes:"
            echo "  (no args)  - Run in development mode (default)"
            echo "  prod       - Run in production mode"
            echo "  docker     - Run with Docker"
            echo "  test       - Test server endpoints"
            echo "  cleanup    - Cleanup server and resources"
            echo "  setup      - Initial setup"
            echo ""
            echo "Examples:"
            echo "  $0          # Run dev mode"
            echo "  $0 prod     # Run production mode"
            echo "  $0 docker   # Run with Docker"
            echo "  $0 test     # Test server"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 InsightTestAI MCP Server Runner"
echo "Mode: $MODE"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ ERROR: Node.js không được cài đặt"
        echo "Vui lòng cài đặt Node.js từ https://nodejs.org/"
        echo "Yêu cầu: Node.js 18.0.0 trở lên"
        exit 1
    fi
    echo "✅ Node.js: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ ERROR: npm không được cài đặt"
        exit 1
    fi
    echo "✅ npm: $(npm --version)"
    
    echo ""
}

# Function to setup environment
setup_environment() {
    echo "🔧 Setting up environment..."
    
    # Create necessary directories
    if [ ! -d "logs" ]; then
        echo "📁 Creating logs directory..."
        mkdir -p logs
    fi
    
    if [ ! -d "artifacts" ]; then
        echo "📁 Creating artifacts directory..."
        mkdir -p artifacts
    fi
    
    # Check node_modules
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm ci
        if [ $? -ne 0 ]; then
            echo "❌ ERROR: Không thể cài đặt dependencies"
            exit 1
        fi
    fi
    
    # Create .env if not exists
    if [ ! -f ".env" ] && [ -f "env.example" ]; then
        echo "📝 Creating .env file from template..."
        cp env.example .env
        echo "⚠️  Vui lòng cập nhật .env file với các giá trị thực tế"
    fi
    
    echo "✅ Environment setup completed"
    echo ""
}

# Function to run setup mode
run_setup() {
    echo "🔧 Running setup mode..."
    check_prerequisites
    
    # Check Docker
    echo "🔍 Checking Docker..."
    if command -v docker &> /dev/null; then
        echo "✅ Docker: $(docker --version)"
        if docker info &> /dev/null; then
            echo "✅ Docker daemon đang chạy"
        else
            echo "⚠️  Docker daemon không chạy"
        fi
    else
        echo "⚠️  Docker không được cài đặt"
        echo "Tool run_ci sẽ không hoạt động"
    fi
    echo ""
    
    setup_environment
    
    # Install nodemon globally if needed
    if ! command -v nodemon &> /dev/null; then
        echo "🔧 Installing nodemon globally..."
        npm install -g nodemon
        if [ $? -eq 0 ]; then
            echo "✅ nodemon installed globally"
        else
            echo "⚠️  Could not install nodemon globally"
        fi
    else
        echo "✅ nodemon already installed"
    fi
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "Để start server: $0 [mode]"
}

# Function to run production mode
run_production() {
    echo "🚀 Running production mode..."
    check_prerequisites
    setup_environment
    
    echo "🚀 Starting MCP Server in Production Mode..."
    echo "Server sẽ chạy tại: http://localhost:8081"
    echo "Health check: http://localhost:8081/health"
    echo "Welcome page: http://localhost:8081/"
    echo ""
    echo "Nhấn Ctrl+C để dừng server"
    echo ""
    
    npm start
}

# Function to run development mode
run_development() {
    echo "🔧 Running development mode..."
    check_prerequisites
    setup_environment
    
    # Check nodemon
    if ! command -v nodemon &> /dev/null; then
        echo "📦 Installing nodemon for development..."
        npm install -g nodemon
        if [ $? -ne 0 ]; then
            echo "⚠️  WARNING: Không thể cài đặt nodemon globally"
            echo "Sử dụng npm start thay thế"
            echo ""
            npm start
            exit 0
        fi
    fi
    
    echo "🔧 Starting MCP Server in Development Mode..."
    echo "Server sẽ chạy tại: http://localhost:8081"
    echo "Health check: http://localhost:8081/health"
    echo "Welcome page: http://localhost:8081/"
    echo ""
    echo "Auto-reload enabled with nodemon"
    echo "Nhấn Ctrl+C để dừng server"
    echo ""
    
    npm run dev
}

# Function to run Docker mode
run_docker() {
    echo "🐳 Running Docker mode..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ ERROR: Docker không được cài đặt"
        echo "Vui lòng cài đặt Docker từ https://docker.com/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ ERROR: Docker daemon không chạy"
        echo "Vui lòng start Docker Desktop"
        exit 1
    fi
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ ERROR: docker-compose không được cài đặt"
        exit 1
    fi
    
    # Check docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        echo "❌ ERROR: docker-compose.yml không tìm thấy"
        exit 1
    fi
    
    # Create directories
    if [ ! -d "logs" ]; then mkdir -p logs; fi
    if [ ! -d "artifacts" ]; then mkdir -p artifacts; fi
    
    echo "🐳 Building and starting MCP Server with Docker Compose..."
    echo "Server sẽ chạy tại: http://localhost:8081"
    echo ""
    
    docker-compose up --build -d
    
    if [ $? -eq 0 ]; then
        echo "🎉 MCP Server đã được start thành công!"
        echo ""
        echo "📊 Container status:"
        docker-compose ps
        echo ""
        echo "🔍 Để theo dõi logs: docker-compose logs -f mcp-server"
        echo "🛑 Để dừng: docker-compose down"
    else
        echo "❌ ERROR: Không thể start MCP Server với Docker"
        exit 1
    fi
}

# Function to run test mode
run_test() {
    echo "🧪 Running test mode..."
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        echo "❌ ERROR: curl không được cài đặt"
        echo "Vui lòng cài đặt curl để test API endpoints"
        exit 1
    fi
    
    # Check if server is running
    echo "🔍 Checking if MCP Server is running..."
    if ! curl -s http://localhost:8081/health &> /dev/null; then
        echo "❌ ERROR: MCP Server không chạy tại http://localhost:8081"
        echo "Vui lòng start server trước: $0 [mode]"
        exit 1
    fi
    
    echo "✅ MCP Server đang chạy"
    echo ""
    
    # Run tests
    echo "🧪 Testing API endpoints..."
    echo ""
    
    # Test health endpoints
    endpoints=(
        "health"
        "health/detailed"
        "health/ready"
        "health/live"
        ""
        "tools"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if [ -z "$endpoint" ]; then
            echo ""
            continue
        fi
        
        echo "Testing /$endpoint..."
        if [ "$endpoint" = "tools" ]; then
            # Tools need authentication
            response=$(curl -s -w "\n%{http_code}" http://localhost:8081/$endpoint)
            http_code=$(echo "$response" | tail -n1)
            if [ "$http_code" = "401" ]; then
                echo "✅ /$endpoint: OK (Authentication required as expected)"
            else
                echo "⚠️  /$endpoint: Unexpected response (HTTP $http_code)"
            fi
        else
            response=$(curl -s -w "\n%{http_code}" http://localhost:8081/$endpoint)
            http_code=$(echo "$response" | tail -n1)
            if [ "$http_code" = "200" ]; then
                echo "✅ /$endpoint: OK (HTTP $http_code)"
            else
                echo "❌ /$endpoint: FAILED (HTTP $http_code)"
            fi
        fi
    done
    
    echo ""
    echo "🎉 All tests completed!"
}

# Function to run cleanup mode
run_cleanup() {
    echo "🧹 Running cleanup mode..."
    
    # Ask for confirmation
    read -p "Bạn có chắc chắn muốn cleanup MCP Server? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
    
    echo ""
    
    # Stop Docker containers
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        if docker-compose ps | grep -q "mcp-server"; then
            echo "🐳 Stopping Docker containers..."
            docker-compose down
            echo "✅ Docker containers stopped"
        fi
    fi
    
    # Kill Node.js processes
    node_processes=$(pgrep -f "node.*src/index.js" || true)
    if [ -n "$node_processes" ]; then
        echo "🔍 Found running Node.js processes: $node_processes"
        read -p "Kill these processes? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$node_processes" | xargs kill -9
            echo "✅ Node.js processes killed"
        fi
    fi
    
    echo ""
    echo "🧹 Cleanup completed!"
}

# Main execution
case $MODE in
    "setup")
        run_setup
        ;;
    "prod"|"production")
        run_production
        ;;
    "docker")
        run_docker
        ;;
    "test")
        run_test
        ;;
    "cleanup")
        run_cleanup
        ;;
    "dev"|*)
        run_development
        ;;
esac
