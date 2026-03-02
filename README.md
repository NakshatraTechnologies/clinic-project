# 🏥 Clinic Management System

A full-stack **Clinic Management System** built with the MERN stack (MongoDB, Express.js, React, Node.js). Includes role-based dashboards for **Admin, Doctor, Receptionist, and Patient** with features like appointment booking, prescription management, inventory tracking, and queue management.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Local Development Setup](#-local-development-setup)
- [Docker Setup](#-docker-setup)
- [Production Deployment (Ubuntu Server)](#-production-deployment-ubuntu-server)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Useful Docker Commands](#-useful-docker-commands)
- [Daily Git Workflow](#-daily-git-workflow)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| **Frontend** | React 19, Vite 7, React Bootstrap, React Router v7 |
| **Backend**  | Node.js 20, Express.js 4, Mongoose 8               |
| **Database** | MongoDB Atlas (cloud-hosted)                       |
| **Auth**     | JWT (JSON Web Tokens) + OTP-based phone login      |
| **PDF**      | PDFKit (prescription generation)                   |
| **Server**   | Docker, Docker Compose, Nginx (reverse proxy)      |
| **SSL**      | Let's Encrypt (Certbot)                            |
| **CI/CD**    | GitHub Actions (auto-deploy on push)               |

---

## 📁 Project Folder Structure

```
Clinic/
├── Backend/                        # Express.js API server
│   ├── config/                     # Database config (db.js)
│   ├── controllers/                # Route handlers (auth, appointment, doctor, etc.)
│   ├── middleware/                  # Auth middleware (JWT verify)
│   ├── models/                     # Mongoose schemas (User, Appointment, Prescription, etc.)
│   ├── routes/                     # API route definitions
│   ├── seeders/                    # Admin seeder script
│   ├── uploads/                    # User-uploaded files (PDFs, images)
│   ├── utils/                      # Helper utilities (generateToken, etc.)
│   ├── Dockerfile                  # Production Docker image config
│   ├── .dockerignore               # Files excluded from Docker build
│   ├── .env.example                # Environment variable template
│   ├── package.json                # Backend dependencies
│   ├── package-lock.json           # Locked dependency versions
│   └── server.js                   # Main entry point
│
├── Frontend/                       # React + Vite SPA
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── assets/                 # Images, icons
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # React Context providers (Auth, etc.)
│   │   ├── pages/                  # Page components (admin, doctor, patient, public)
│   │   └── services/               # API client (axios instance)
│   ├── Dockerfile                  # Multi-stage build: Vite → Nginx
│   ├── nginx.conf                  # Nginx config for SPA routing
│   ├── .dockerignore               # Files excluded from Docker build
│   ├── .env.example                # Frontend env variable template
│   ├── package.json                # Frontend dependencies
│   ├── package-lock.json           # Locked dependency versions
│   └── vite.config.js              # Vite configuration
│
├── .github/workflows/              # GitHub Actions CI/CD
│   ├── deploy-staging.yml          # Auto-deploy on push to 'staging'
│   └── deploy-production.yml       # Auto-deploy on push to 'main'
│
├── docker-compose.prod.yml         # Production: Backend :5000, Frontend :3000
├── docker-compose.staging.yml      # Staging: Backend :5001, Frontend :3001
├── .gitignore                      # Root gitignore
├── deploy.sh                       # Server deployment helper script
├── create-tar.sh                   # Script to create distributable tar archive
└── README.md                       # This file
```

---

## ✨ Features

- **OTP-based Phone Login** — No passwords, mobile-first authentication
- **Role-based Dashboards** — Admin, Doctor, Receptionist, Patient
- **Appointment Booking** — Slot-based scheduling with auto-queue
- **Prescription Management** — Create and download PDF prescriptions
- **Inventory Management** — Track medicines and supplies
- **Queue System** — Real-time patient queue tracking
- **Clinic Management** — Multi-clinic support with subscription plans
- **Doctor Profiles** — Public doctor search and profile pages

---

## 🔐 Environment Variables

### Backend (`Backend/.env`)

| Variable       | Description                            | Example                                              |
| -------------- | -------------------------------------- | ---------------------------------------------------- |
| `PORT`         | Server port                            | `5000`                                               |
| `NODE_ENV`     | Environment mode                       | `development` / `staging` / `production`             |
| `MONGO_URI`    | MongoDB Atlas connection string        | `mongodb+srv://user:pass@cluster.mongodb.net/Clinic` |
| `JWT_SECRET`   | Secret key for signing JWT tokens      | `your_random_secret_string_here`                     |
| `JWT_EXPIRE`   | Token expiry duration                  | `30d`                                                |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `http://localhost:5173`                              |

### Frontend (`Frontend/.env.local`)

| Variable        | Description          | Example                     |
| --------------- | -------------------- | --------------------------- |
| `VITE_API_BASE` | Backend API base URL | `http://localhost:5000/api` |

> ⚠️ Frontend env variables must start with `VITE_` to be accessible in the browser (Vite requirement).

---

## 💻 Local Development Setup

### Prerequisites

- **Node.js** v20 or higher
- **npm** v10 or higher
- **MongoDB Atlas** account (free tier works)
- **Git**

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/NakshatraTechnologies/clinic-project.git
cd clinic-project

# 2. Setup Backend
cd Backend
cp .env.example .env
# Edit .env and add your MongoDB URI, JWT secret, etc.
npm install
npm run dev     # Starts with nodemon on port 5000

# 3. Setup Frontend (in a new terminal)
cd Frontend
cp .env.example .env.local
# Default VITE_API_BASE=http://localhost:5000/api (usually no change needed)
npm install
npm run dev     # Starts Vite dev server on port 5173

# 4. Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
```

---

## 🐳 Docker Setup

### Build & Run with Docker Compose (Production)

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check running containers
docker ps

# View logs
docker logs clinic-backend-prod -f
docker logs clinic-frontend-prod -f

# Stop all services
docker compose -f docker-compose.prod.yml down
```

### Build & Run with Docker Compose (Staging)

```bash
docker compose -f docker-compose.staging.yml up -d --build
docker ps
docker logs clinic-backend-staging -f
```

### Build Individual Docker Images

```bash
# Build backend image
cd Backend
docker build -t clinic-backend:latest .

# Build frontend image (pass your API URL)
cd Frontend
docker build --build-arg VITE_API_BASE=https://api.your-domain.com/api -t clinic-frontend:latest .

# Run individual containers
docker run -d --name backend -p 5000:5000 --env-file .env clinic-backend:latest
docker run -d --name frontend -p 3000:80 clinic-frontend:latest
```

### Port Configuration

| Service          | Container Port | Host Port (Prod) | Host Port (Staging) |
| ---------------- | -------------- | ---------------- | ------------------- |
| Backend API      | `5000`/`5001`  | `5000`           | `5001`              |
| Frontend (Nginx) | `80`           | `3000`           | `3001`              |

---

## 🚀 Production Deployment (Ubuntu Server)

### Step 1: Server Dependencies

```bash
# Connect to your server via SSH
ssh -i "your-key.pem" ubuntu@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Nginx & Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Verify installations
docker --version          # Docker 27+
docker compose version    # Docker Compose v2+
nginx -v                  # nginx/1.x
```

### Step 2: Clone Repository

```bash
# Setup GitHub deploy key for private repos
ssh-keygen -t ed25519 -C "server-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
# ↑ Copy this → GitHub Repo → Settings → Deploy Keys → Add

# Configure SSH
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking no
EOF

# Clone project
sudo mkdir -p /opt/clinic && sudo chown ubuntu:ubuntu /opt/clinic
cd /opt/clinic
git clone git@github.com:NakshatraTechnologies/clinic-project.git .
```

### Step 3: Create Environment Files on Server

```bash
# Production env
cat > /opt/clinic/.env.production << 'EOF'
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/Clinic?retryWrites=true&w=majority
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_STRING
JWT_EXPIRE=30d
FRONTEND_URL=https://clinic.yourdomain.com
EOF

# Staging env
cat > /opt/clinic/.env.staging << 'EOF'
PORT=5001
NODE_ENV=staging
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/clinic_test?retryWrites=true&w=majority
JWT_SECRET=CHANGE_THIS_STAGING_SECRET
JWT_EXPIRE=30d
FRONTEND_URL=https://staging.clinic.yourdomain.com
EOF
```

> 💡 Generate a strong JWT_SECRET: `openssl rand -hex 32`

### Step 4: DNS Records

Add these **A records** in your domain DNS panel, all pointing to your server's IP:

| Type | Name                 | Value            |
| ---- | -------------------- | ---------------- |
| A    | `clinic`             | `YOUR_SERVER_IP` |
| A    | `api.clinic`         | `YOUR_SERVER_IP` |
| A    | `staging.clinic`     | `YOUR_SERVER_IP` |
| A    | `staging-api.clinic` | `YOUR_SERVER_IP` |

### Step 5: Nginx Reverse Proxy

```bash
sudo tee /etc/nginx/sites-available/clinic << 'NGINXEOF'
# Production Frontend
server {
    listen 80;
    server_name clinic.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Production API
server {
    listen 80;
    server_name api.clinic.yourdomain.com;
    client_max_body_size 10M;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Staging Frontend
server {
    listen 80;
    server_name staging.clinic.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Staging API
server {
    listen 80;
    server_name staging-api.clinic.yourdomain.com;
    client_max_body_size 10M;
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Enable & reload
sudo ln -sf /etc/nginx/sites-available/clinic /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Certificates (HTTPS)

```bash
sudo certbot --nginx \
  -d clinic.yourdomain.com \
  -d api.clinic.yourdomain.com \
  -d staging.clinic.yourdomain.com \
  -d staging-api.clinic.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos --no-eff-email

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Firewall Configuration

```bash
# Allow required ports
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'    # ports 80 & 443
sudo ufw enable
sudo ufw status
```

### Step 8: Deploy!

```bash
cd /opt/clinic

# Deploy Staging
git checkout staging
docker compose -f docker-compose.staging.yml up -d --build

# Verify
docker ps
curl http://localhost:5001/

# Deploy Production
git checkout main
docker compose -f docker-compose.prod.yml up -d --build

# Verify
docker ps
curl http://localhost:5000/
```

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for automated deployments.

| Trigger                  | Action                           |
| ------------------------ | -------------------------------- |
| Push to `staging` branch | Auto-deploy to staging server    |
| Push to `main` branch    | Auto-deploy to production server |

### Required GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

| Secret Name   | Value                                    |
| ------------- | ---------------------------------------- |
| `EC2_HOST`    | Your server's public IP address          |
| `EC2_USER`    | `ubuntu` (or your SSH username)          |
| `EC2_SSH_KEY` | Full contents of your `.pem` private key |

### Ensure SSH Access

Your server's Security Group / Firewall must allow **inbound SSH (port 22)** from `0.0.0.0/0` (any IP) so GitHub Actions can connect.

---

## 🔧 Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs (follow mode)
docker logs clinic-backend-prod -f
docker logs clinic-frontend-staging -f

# Restart a specific service
docker compose -f docker-compose.prod.yml restart backend-prod

# Full rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Enter a container's shell
docker exec -it clinic-backend-prod sh

# Cleanup disk space (remove unused images)
docker system prune -af

# Check disk usage by Docker
docker system df
```

---

## 📅 Daily Git Workflow

```
🔀 Feature Development:
   git checkout develop
   # Make changes...
   git add . && git commit -m "feat: description"
   git push origin develop

🧪 Deploy to Staging (Testing):
   git checkout staging
   git merge develop
   git push origin staging       ← Auto-deploys to staging

🚀 Deploy to Production (Go Live):
   git checkout main
   git merge staging
   git push origin main          ← Auto-deploys to production

🔥 Emergency Hotfix:
   git checkout -b hotfix/fix-name main
   # Fix the bug...
   git checkout main && git merge hotfix/fix-name
   git push origin main          ← Auto-deploys
   # Then sync back:
   git checkout staging && git merge main && git push origin staging
   git checkout develop && git merge main && git push origin develop
```

---

## 🗜 Creating a Distributable Archive

Use the included `create-tar.sh` script to create a tar file that can be transferred to any server:

```bash
# On your local machine (Git Bash / Linux / macOS)
chmod +x create-tar.sh
./create-tar.sh

# Transfer to server
scp -i "your-key.pem" clinic-project.tar.gz ubuntu@YOUR_SERVER_IP:/opt/

# On the server: Extract
cd /opt
tar -xzf clinic-project.tar.gz
cd clinic
# Create .env files, then build with docker compose
```

---

## ❓ Troubleshooting

### Docker build fails with "npm ci" error

- Ensure `package-lock.json` exists in both `Backend/` and `Frontend/` directories
- Ensure `package-lock.json` is NOT in `.gitignore`

### GitHub Actions SSH timeout

- Verify `EC2_HOST` secret has the correct IP address
- Ensure Security Group allows SSH (port 22) from `0.0.0.0/0`
- Check that the server is running and reachable

### CORS errors in browser

- Update `FRONTEND_URL` in your `.env` to include all allowed origins (comma-separated)
- Example: `FRONTEND_URL=https://clinic.yourdomain.com,https://staging.clinic.yourdomain.com`

### Frontend shows blank page after deploy

- Make sure `VITE_API_BASE` build arg in `docker-compose.*.yml` points to the correct backend API URL
- Check nginx routes: `sudo nginx -t`

### MongoDB connection fails

- Whitelist your server's IP in MongoDB Atlas: Network Access → Add IP → `0.0.0.0/0` (allow all)
- Verify the connection string format in your `.env` file

---

## 👨‍💻 Author

**Nakshatra Technologies**

---

## 📄 License

ISC
