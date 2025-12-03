# DigiStall - Docker Deployment Guide

## 🚀 Quick Start (For Team Members)

**You don't need to install any npm packages locally!** All dependencies are bundled inside the Docker images.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- MySQL database running (locally or remotely)

### Steps to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/digistall/DigiStall-CP2025-2026.git
   cd DigiStall-CP2025-2026
   ```

2. **Create environment file:**
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   
   # Or manually copy .env.example to .env
   ```

3. **Configure your `.env` file:**
   ```env
   DB_HOST=host.docker.internal  # Use this for local MySQL
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=naga_stall
   JWT_SECRET=your_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret
   ```

4. **Build and run with Docker:**
   ```bash
   docker-compose up --build
   ```

5. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

---

## 📦 How Dependencies Work

### For Developers
- All `package.json` and `package-lock.json` files are committed to GitHub
- When Docker builds, it runs `npm ci` which installs exact versions from `package-lock.json`
- **No need to run `npm install` locally** - Docker handles everything

### Adding New Packages
If you need to add a new package:

1. **Install locally first** (to update package-lock.json):
   ```bash
   cd Backend  # or Frontend/Web
   npm install new-package-name
   ```

2. **Commit both files:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Add new-package-name dependency"
   git push
   ```

3. **Rebuild Docker:**
   ```bash
   docker-compose up --build
   ```

Team members will automatically get the new package when they:
- Pull your changes
- Run `docker-compose up --build`

---

## 🐳 Docker Commands

### Start Services
```bash
# Build and start (first time or after changes)
docker-compose up --build

# Start without rebuilding (if no code changes)
docker-compose up

# Start in background (detached mode)
docker-compose up -d --build
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend-web
```

### Rebuild Specific Service
```bash
docker-compose up --build backend
docker-compose up --build frontend-web
```

---

## 🔧 Troubleshooting

### "Cannot connect to database"
- Ensure MySQL is running
- Check `DB_HOST` in `.env`:
  - Use `host.docker.internal` for local MySQL on Windows/Mac
  - Use your database IP for remote MySQL

### "Port 80 already in use"
- Stop any service using port 80, or
- Change the port in `docker-compose.yml`:
  ```yaml
  ports:
    - "8080:80"  # Access at localhost:8080
  ```

### "Image build failed"
```bash
# Clean rebuild
docker-compose build --no-cache
docker-compose up
```

### View container status
```bash
docker-compose ps
```

---

## 📁 Project Structure

```
DigiStall-CP2025-2026/
├── docker-compose.yml      # Main Docker configuration
├── .env.example            # Environment template
├── .env                    # Your local config (not committed)
├── Backend/
│   ├── Dockerfile          # Backend Docker build
│   ├── package.json        # Dependencies definition
│   ├── package-lock.json   # Locked dependency versions
│   └── ...
└── Frontend/Web/
    ├── Dockerfile          # Frontend Docker build
    ├── package.json        # Dependencies definition
    ├── package-lock.json   # Locked dependency versions
    └── ...
```

---

## 🔐 Security Notes

- Never commit `.env` file to GitHub (it's in `.gitignore`)
- Change default JWT secrets in production
- Use strong database passwords
