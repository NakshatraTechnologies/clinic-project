# ============================
# Clinic Backend - Dockerfile
# ============================
FROM node:20-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (will be overridden by docker-compose)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/ || exit 1

# Start server
CMD ["node", "server.js"]
