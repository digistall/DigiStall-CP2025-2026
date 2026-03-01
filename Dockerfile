# ===== DIGISTALL MVC BACKEND DOCKERFILE =====
# Unified backend server for both web and mobile APIs

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all application files
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/stalls /app/uploads/applicants

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
