# ===== FRONTEND DOCKERFILE =====
# Multi-stage build for Vue.js application
# All dependencies are installed inside the image - no need to install locally

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# This ensures all packages are available for the build process
RUN npm ci

# Copy application code
COPY . .

# Set API URL to use relative path (proxied by nginx)
ENV VITE_API_URL=/api

# Build the application for production
RUN npm run build

# Stage 2: Serve with nginx (lightweight production image)
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security (optional for nginx)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
