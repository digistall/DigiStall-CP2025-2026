# ===== BACKEND MOBILE DOCKERFILE =====
# Production Docker image for Mobile Backend (Port 5001)

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
EXPOSE 5001

# Set environment
ENV NODE_ENV=production
ENV MOBILE_PORT=5001

# Start the server
CMD ["node", "server.js"]
