# ===== DIGISTALL MVC BACKEND DOCKERFILE =====
# Unified backend server for both web and mobile APIs

FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies for native modules (sharp, bcrypt, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

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
