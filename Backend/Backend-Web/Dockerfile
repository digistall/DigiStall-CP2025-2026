# ===== BACKEND WEB DOCKERFILE =====
# Production Docker image for Web Backend (Port 5000)

FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/stalls /app/uploads/applicants

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV WEB_PORT=5000

# Start the server with logging
CMD ["node", "--trace-warnings", "server.js"]
