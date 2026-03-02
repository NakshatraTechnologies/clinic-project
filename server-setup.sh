#!/bin/bash
# ====================================================
# Clinic Project — Fresh Server Setup Script (Ubuntu)
# ====================================================
# Run this script on a fresh Ubuntu 22.04 server to
# install all dependencies needed for the Clinic app.
#
# Usage:
#   chmod +x server-setup.sh
#   sudo ./server-setup.sh
# ====================================================

set -e

GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[✅]${NC} $1"; }

echo ""
echo "========================================"
echo "  🏥 Clinic Server Setup Script"
echo "  Ubuntu 22.04+ / Debian"
echo "========================================"
echo ""

# --- 1. System Update ---
log "Updating system packages..."
apt update && apt upgrade -y

# --- 2. Install Docker ---
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    # Add current user to docker group
    usermod -aG docker ${SUDO_USER:-ubuntu}
    log "Docker installed successfully."
else
    log "Docker already installed: $(docker --version)"
fi

# --- 3. Verify Docker Compose ---
log "Verifying Docker Compose..."
if docker compose version &> /dev/null; then
    log "Docker Compose available: $(docker compose version --short)"
else
    log "Docker Compose plugin not found. Installing..."
    apt install -y docker-compose-plugin
fi

# --- 4. Install Nginx ---
log "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log "Nginx installed: $(nginx -v 2>&1)"

# --- 5. Install Certbot (SSL) ---
log "Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
log "Certbot installed: $(certbot --version 2>&1)"

# --- 6. Install Git ---
log "Installing Git..."
apt install -y git
log "Git installed: $(git --version)"

# --- 7. Configure Firewall (UFW) ---
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'   # Ports 80 & 443
ufw --force enable
log "Firewall enabled. Allowed: SSH, HTTP (80), HTTPS (443)"

# --- 8. Create project directory ---
log "Creating project directory at /opt/clinic..."
mkdir -p /opt/clinic
chown ${SUDO_USER:-ubuntu}:${SUDO_USER:-ubuntu} /opt/clinic

echo ""
echo "========================================"
echo "  ✅ Server Setup Complete!"
echo "========================================"
echo ""
echo "  Next steps:"
echo "  1. Log out and log back in (for Docker group)"
echo "     $ exit"
echo "     $ ssh -i your-key.pem ubuntu@YOUR_IP"
echo ""
echo "  2. Clone repo:"
echo "     $ cd /opt/clinic"
echo "     $ git clone <your-repo-url> ."
echo ""
echo "  3. Create .env files:"
echo "     $ cp Backend/.env.example .env.production"
echo "     $ nano .env.production"
echo ""
echo "  4. Deploy:"
echo "     $ chmod +x deploy.sh"
echo "     $ ./deploy.sh production"
echo ""
echo "  5. Setup Nginx & SSL:"
echo "     See README.md Steps 5-6"
echo ""
echo "========================================"
