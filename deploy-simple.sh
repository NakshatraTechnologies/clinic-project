#!/bin/bash
# ================================================
# Clinic Project — Simple Deploy Script (No Docker)
# ================================================
# Usage (on server):
#   cd /var/www/clinic
#   bash deploy-simple.sh
# ================================================

set -e

APP_DIR="/var/www/clinic"
BRANCH="main"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[✅ INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[⚠️  WARN]${NC} $1"; }
log_error() { echo -e "${RED}[❌ ERROR]${NC} $1"; }

echo ""
echo "========================================"
echo "  🏥 Clinic — Simple Deploy (No Docker)"
echo "========================================"
echo ""

cd "$APP_DIR"

# 1. Pull latest code
log_info "Pulling latest code from $BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 2. Install backend dependencies
log_info "Installing backend dependencies..."
cd "$APP_DIR/Backend"
npm install --production

# 3. Install frontend dependencies & build
log_info "Installing frontend dependencies & building..."
cd "$APP_DIR/Frontend"
npm install
VITE_API_BASE=https://clinic.nakshatratechnologies.in/api npm run build

# 4. Restart backend via PM2
log_info "Restarting backend via PM2..."
cd "$APP_DIR"
pm2 restart ecosystem.config.js --update-env 2>/dev/null || pm2 start ecosystem.config.js

echo ""
log_info "✅ Deployment complete!"
log_info "Backend  → http://localhost:5010"
log_info "Frontend → https://clinic.nakshatratechnologies.in"
echo ""
pm2 status
