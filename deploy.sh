#!/bin/bash
# ================================================
# Clinic Project — Server Deployment Helper Script
# ================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh staging     # Deploy staging
#   ./deploy.sh production  # Deploy production
#   ./deploy.sh all         # Deploy both
# ================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[✅ INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[⚠️  WARN]${NC} $1"; }
log_error() { echo -e "${RED}[❌ ERROR]${NC} $1"; }

# === Pre-flight Checks ===
preflight() {
    echo ""
    echo "========================================"
    echo "  🏥 Clinic Deployment Script"
    echo "========================================"
    echo ""

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Run: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available."
        exit 1
    fi

    log_info "Docker $(docker --version | cut -d' ' -f3)"
    log_info "Docker Compose $(docker compose version --short)"
}

# === Deploy Staging ===
deploy_staging() {
    log_info "Deploying STAGING environment..."

    # Check env file
    if [ ! -f ".env.staging" ]; then
        log_error ".env.staging not found! Create it first (see README.md)"
        exit 1
    fi

    # Pull latest code
    git fetch origin staging
    git checkout staging
    git pull origin staging

    # Build and start
    docker compose -f docker-compose.staging.yml down || true
    docker compose -f docker-compose.staging.yml up -d --build

    # Cleanup old images
    docker image prune -f

    echo ""
    log_info "✅ STAGING deployed successfully!"
    log_info "Backend  → http://localhost:5001"
    log_info "Frontend → http://localhost:3001"
    echo ""
    docker ps --filter "name=clinic-*-staging"
}

# === Deploy Production ===
deploy_production() {
    log_info "Deploying PRODUCTION environment..."

    # Check env file
    if [ ! -f ".env.production" ]; then
        log_error ".env.production not found! Create it first (see README.md)"
        exit 1
    fi

    # Pull latest code
    git fetch origin main
    git checkout main
    git pull origin main

    # Build and start
    docker compose -f docker-compose.prod.yml down || true
    docker compose -f docker-compose.prod.yml up -d --build

    # Cleanup old images
    docker image prune -f

    echo ""
    log_info "✅ PRODUCTION deployed successfully!"
    log_info "Backend  → http://localhost:5000"
    log_info "Frontend → http://localhost:3000"
    echo ""
    docker ps --filter "name=clinic-*-prod"
}

# === Main ===
preflight

case "${1}" in
    staging)
        deploy_staging
        ;;
    production|prod)
        deploy_production
        ;;
    all)
        deploy_staging
        echo ""
        echo "----------------------------------------"
        echo ""
        deploy_production
        ;;
    *)
        echo ""
        echo "Usage: $0 {staging|production|all}"
        echo ""
        echo "  staging     - Deploy staging environment"
        echo "  production  - Deploy production environment"
        echo "  all         - Deploy both staging and production"
        echo ""
        exit 1
        ;;
esac
