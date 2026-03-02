#!/bin/bash
# ====================================================
# Create a distributable tar.gz archive of the project
# ====================================================
# Usage:
#   chmod +x create-tar.sh
#   ./create-tar.sh
#
# Output: clinic-project.tar.gz (in current directory)
# ====================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="clinic"
OUTPUT_FILE="${SCRIPT_DIR}/${PROJECT_NAME}-project.tar.gz"

echo ""
echo "========================================"
echo "  📦 Creating Project Archive"
echo "========================================"
echo ""

# Remove old archive if exists
rm -f "$OUTPUT_FILE"

# Create tar archive excluding unnecessary files
tar -czf "$OUTPUT_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.staging' \
    --exclude='.env.production' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    --exclude='docker-data' \
    --exclude='clinic-project.tar.gz' \
    -C "$(dirname "$SCRIPT_DIR")" \
    "$(basename "$SCRIPT_DIR")"

# Show result
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "✅ Archive created: $OUTPUT_FILE"
echo "📊 Size: $FILE_SIZE"
echo ""
echo "========================================"
echo "  📤 Transfer to Server"
echo "========================================"
echo ""
echo "  scp -i \"your-key.pem\" $OUTPUT_FILE ubuntu@YOUR_SERVER_IP:/opt/"
echo ""
echo "========================================"
echo "  📥 Extract on Server"
echo "========================================"
echo ""
echo "  cd /opt"
echo "  tar -xzf ${PROJECT_NAME}-project.tar.gz"
echo "  cd ${PROJECT_NAME}"
echo "  # Create .env.production and .env.staging files (see README.md)"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo ""
