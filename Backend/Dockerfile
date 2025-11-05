# ===== BACKEND DOCKERFILE =====
# Multi-stage build for Node.js backend

FROM node:20-alpine AS base

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy application code first (excluding node_modules via .dockerignore)
COPY . .

# Install root dependencies
RUN npm ci --only=production

# Install Backend-Web dependencies and rebuild native modules
WORKDIR /app/Backend-Web
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

# Install Backend-Mobile dependencies and rebuild native modules
WORKDIR /app/Backend-Mobile
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

# Back to root directory
WORKDIR /app

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
