#!/bin/bash
# ===========================================
# DigiStall - Droplet Deployment Script
# Run this ON YOUR DROPLET after SSH'ing in
# ===========================================

echo "🚀 DigiStall Droplet Deployment Script"
echo "======================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt install docker-compose -y
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📥 Installing Git..."
    apt install git -y
fi

# Create app directory
echo "📁 Setting up application directory..."
mkdir -p /opt/digistall
cd /opt/digistall

# Clone or pull repository
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin FullBranch
else
    echo "📥 Cloning repository..."
    git clone -b FullBranch https://github.com/digistall/DigiStall-CP2025-2026.git .
fi

# Create .env file for production
echo "⚙️ Creating environment configuration..."
cat > .env << 'EOF'
# Production Environment Variables
NODE_ENV=production

# Database (DigitalOcean Managed MySQL)
DB_HOST=dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=AVNS_hxkemfGwzsOdj4pbu35
DB_NAME=naga_stall
DB_SSL=true

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your_super_secure_jwt_secret_change_this_in_production
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_change_this_in_production

# CORS
CORS_ORIGIN=http://digi-stall.com
ALLOWED_ORIGINS=http://digi-stall.com,http://68.183.154.125,http://localhost

# Upload path (Docker volume)
UPLOAD_PATH=/opt/digistall/uploads
EOF

# Create uploads directory
mkdir -p /opt/digistall/uploads/stalls
mkdir -p /opt/digistall/uploads/applicants

# Build and start containers
echo "🐳 Building and starting Docker containers..."
docker-compose down 2>/dev/null
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "✅ Deployment complete!"
echo "======================================="
echo "🌐 Frontend Web: http://digi-stall.com (68.183.154.125)"
echo "🔌 Backend Web API: http://digi-stall.com:5000/api (68.183.154.125:5000)"
echo "📱 Backend Mobile API: http://digi-stall.com:5001/api (68.183.154.125:5001)"
echo ""
echo "📊 Container Status:"
docker-compose ps
echo ""
echo "📋 To view logs: docker-compose logs -f"
echo "🔄 To restart: docker-compose restart"
echo "🛑 To stop: docker-compose down"
