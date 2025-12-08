# ===== BACKEND DOCKERFILE =====
# Multi-stage build for Node.js backend
# All dependencies are installed inside the image - no need to install locally

# Stage 1: Build stage with all dependencies
FROM node:20-alpine AS builder

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY Backend-Web/package*.json ./Backend-Web/
COPY Backend-Mobile/package*.json ./Backend-Mobile/

# Install root dependencies (including devDependencies for build)
RUN npm ci

# Install Backend-Web dependencies and rebuild native modules
WORKDIR /app/Backend-Web
RUN npm ci && npm rebuild bcrypt --build-from-source

# Install Backend-Mobile dependencies and rebuild native modules
WORKDIR /app/Backend-Mobile
RUN npm ci && npm rebuild bcrypt --build-from-source

# Back to root directory
WORKDIR /app

# Copy all application source code
COPY . .

# Stage 2: Production stage - smaller image
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY Backend-Web/package*.json ./Backend-Web/
COPY Backend-Mobile/package*.json ./Backend-Mobile/

# Install production dependencies only
RUN npm ci --only=production

WORKDIR /app/Backend-Web
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

WORKDIR /app/Backend-Mobile
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

WORKDIR /app

# Copy application code from builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/Backend-Web ./Backend-Web
COPY --from=builder /app/Backend-Mobile ./Backend-Mobile

# Create upload directories for Docker environment
RUN mkdir -p /app/uploads/stalls /app/uploads/applicants

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Give ownership of upload directories to nodejs user
RUN chown -R nodejs:nodejs /app/uploads

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
