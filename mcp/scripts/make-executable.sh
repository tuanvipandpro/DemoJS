#!/bin/bash

# ========================================
#    Make Scripts Executable
# ========================================

echo "🔧 Making all scripts executable..."
echo ""

# Lấy đường dẫn hiện tại
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Script directory: $SCRIPT_DIR"
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Chuyển đến thư mục project
cd "$PROJECT_DIR"

# Cấp quyền thực thi cho script duy nhất
echo "🔐 Setting execute permissions for run.sh..."
chmod +x scripts/run.sh

# Kiểm tra quyền
echo "📋 Checking script permissions..."
ls -la scripts/run.sh

echo ""
echo "✅ Script is now executable!"
echo ""
echo "📚 Available modes:"
echo "   ./scripts/run.sh        - Start development mode (mặc định)"
echo "   ./scripts/run.sh setup  - Initial setup"
echo "   ./scripts/run.sh prod   - Start production mode"
echo "   ./scripts/run.sh docker - Start with Docker"
echo "   ./scripts/run.sh test   - Test server endpoints"
echo "   ./scripts/run.sh cleanup - Cleanup server"
echo ""
echo "🚀 Quick start:"
echo "   ./scripts/run.sh setup"
echo "   ./scripts/run.sh"
echo ""
echo "🎉 Script is ready to use!"
