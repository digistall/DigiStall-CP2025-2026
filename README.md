# DigiStall - Naga City Stall Management System

A comprehensive web and mobile stall management system for Naga City market administration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Database Setup](#database-setup)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

DigiStall is a unified backend system that manages stall applications, payments, complaints, and administrative functions for Naga City's market management. The system supports both web-based administration and mobile applications for stallholders and market administrators.

## Features

### For Administrators
- **Stall Management**: View, approve, and manage stall applications
- **Payment Tracking**: Monitor payments, generate receipts, and track payment history
- **Complaint Management**: Handle complaints and track resolutions
- **Applicant Management**: Process applications and manage applicant information
- **Analytics Dashboard**: View statistics and generate reports
- **Branch Management**: Manage multiple market locations

### For Stallholders
- **Application Submission**: Apply for stall allocations
- **Payment Management**: View payment due dates and make payments
- **Complaint Filing**: Submit and track complaints
- **Notifications**: Receive updates on application status and payments

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL 8.0 (DigitalOcean Managed Database)
- **Frontend**: Vue.js 3 with Composition API
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with Sharp for image processing
- **Deployment**: Docker & Docker Compose

## Database Setup

DigiStall uses a **DigitalOcean Managed MySQL Database** that can be accessed from both local development and production environments.

### 📋 For Team Members

**New to the project?** Follow the complete setup guide:
- **[Team Database Access Setup Guide](docs/TEAM_DATABASE_SETUP.md)** - Step-by-step instructions for new team members

### Quick Start

1. **Set up your environment configuration**:
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Switch to cloud database (default)
   npm run db:cloud
   ```

2. **Whitelist your IP on DigitalOcean** (Required for connection):
   - Visit: https://cloud.digitalocean.com/databases
   - Select database: `dbaas-db-2078449-do-user-29954926-0`
   - Go to **Settings** → **Trusted Sources**
   - Click **Add Trusted Source** → **My Computer's IP**
   - Save changes and wait 1-2 minutes

3. **Test your connection**:
   ```bash
   npm run db:test
   ```

4. **Success!** You should see:
   ```
   ✅ SUCCESS: Database connection established!
   ```

### Environment Switching

Switch between cloud and local database configurations:

```bash
# Switch to DigitalOcean cloud database
npm run db:cloud

# Switch to local database (requires local MySQL server)
npm run db:local

# Show current database configuration
npm run db:switch

# Test database connection
npm run db:test
```

### MySQL Workbench Setup

To connect using MySQL Workbench:

**Connection Settings:**
- **Host**: `dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com`
- **Port**: `25060`
- **Username**: `doadmin`
- **Database**: `naga_stall`
- **SSL**: Required (leave certificate files empty)

**Detailed Instructions**: See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for comprehensive setup guide, troubleshooting, and security best practices.

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/digistall/DigiStall-CP2025-2026.git
   cd DigiStall-CP2025-2026
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   # Copy example environment file
   cp .env.example .env

   # Switch to cloud database
   npm run db:cloud
   ```

4. **Whitelist your IP address**:
   - Follow the [Database Setup](#database-setup) instructions above
   - Make sure your IP is added to DigitalOcean Trusted Sources

5. **Test database connection**:
   ```bash
   npm run db:test
   ```

## Running the Application

### Development Mode

```bash
# Start with auto-reload (nodemon)
npm run dev
```

### Production Mode

```bash
# Start normally
npm start
```

The application will start two API servers:
- **Backend Web API**: http://localhost:5000/api
- **Backend Mobile API**: http://localhost:5001/api

### Frontend Development

The frontend is located in `FRONTEND/WEB/LANDINGPAGE/` and requires separate setup:

```bash
cd FRONTEND/WEB/LANDINGPAGE
npm install
npm run dev
```

## Available Scripts

### Application Scripts
- `npm start` - Start the backend server in production mode
- `npm run dev` - Start the backend server with auto-reload (nodemon)
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and automatically fix issues

### Database Scripts
- `npm run db:test` - Test database connection with current configuration
- `npm run db:switch` - Display current database configuration
- `npm run db:local` - Switch to local MySQL database (localhost:3301)
- `npm run db:cloud` - Switch to DigitalOcean cloud database
- `npm run db:restore:local` - Restore latest/full backup SQL into localhost MySQL (.env.local)
- `npm run db:backup:cloud-to-local` - Create cloud backup then restore it directly to localhost MySQL

## Project Structure

```
DigiStall-CP2025-2026/
├── BACKEND/
│   ├── MANAGER/
│   │   ├── stalls/           # Stall management endpoints
│   │   ├── payments/         # Payment processing
│   │   ├── complaints/       # Complaint handling
│   │   ├── applicants/       # Applicant management
│   │   └── ...
│   └── MOBILE/               # Mobile API endpoints
├── FRONTEND/
│   └── WEB/
│       └── LANDINGPAGE/      # Vue.js web application
├── DATABASE/                 # Database schemas and migrations
├── config/
│   └── database.js          # Database configuration with connection pooling
├── middleware/              # Express middleware (auth, validation, etc.)
├── utils/                   # Utility functions (dbRetry, etc.)
├── scripts/                 # Utility scripts
│   ├── switch-env.js       # Environment switcher
│   └── test-db-connection.js # Connection tester
├── docs/                    # Documentation
│   └── DATABASE_SETUP.md   # Database setup guide
├── docker-compose.yml      # Docker deployment configuration
├── deploy-to-droplet.sh   # Automated deployment script
├── .env.example           # Environment configuration template
├── index.js               # Main application entry point
└── package.json           # Node.js dependencies and scripts
```

## Deployment

### Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Deployment to DigitalOcean Droplet

```bash
# SSH into your droplet
ssh root@68.183.154.125

# Run the deployment script
cd /opt/digistall
bash deploy-to-droplet.sh
```

The deployment script will:
- Install Docker and Docker Compose
- Clone/pull the latest code
- Create production `.env` configuration
- Build and start Docker containers
- Set up upload directories

**Production URLs:**
- Frontend: http://digi-stall.com (http://68.183.154.125)
- Backend Web API: http://digi-stall.com:5000/api
- Backend Mobile API: http://digi-stall.com:5001/api

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
DB_HOST=dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=naga_stall
DB_USER=doadmin
DB_PASSWORD=<password>
DB_SSL=true

# Server
NODE_ENV=production
PORT_WEB=5000
PORT_MOBILE=5001

# JWT
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

# CORS
CORS_ORIGIN=http://digi-stall.com
ALLOWED_ORIGINS=http://digi-stall.com,http://68.183.154.125,http://localhost:3000
```

## Troubleshooting

### Cannot Connect to Database

**Problem**: Connection timeout or "Cannot Connect to Database Server"

**Solution**:
1. Verify your IP is whitelisted on DigitalOcean Trusted Sources
2. Check your firewall allows outbound connections on port 25060
3. Test network connectivity:
   ```powershell
   Test-NetConnection -ComputerName dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -Port 25060
   ```
4. See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for detailed troubleshooting

### Environment Switching Issues

**Problem**: `npm run db:local` or `npm run db:cloud` not working

**Solution**:
1. Ensure environment files exist (`.env.local`, `.env.production`)
2. Check file permissions
3. Run directly: `node scripts/switch-env.js cloud`

### Docker Issues

**Problem**: Containers fail to start or can't connect to database

**Solution**:
1. Check `.env` file exists with correct configuration
2. Verify database credentials
3. Check container logs: `docker-compose logs backend-web`
4. Ensure DigitalOcean droplet IP is whitelisted

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Create a Pull Request

## License

ISC License - Copyright (c) 2025 Naga Stall Management Team

## Support

- **Documentation**: See [docs/](docs/) directory
- **Database Setup**: [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)
- **Issues**: Create an issue in the repository
- **DigitalOcean Dashboard**: https://cloud.digitalocean.com/

---

**Version**: 2.0.0
**Last Updated**: 2026-03-26
