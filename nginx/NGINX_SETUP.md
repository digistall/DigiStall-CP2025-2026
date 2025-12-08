# DigiStall Nginx Setup Guide

## Overview

Nginx is configured as a reverse proxy for the DigiStall system to provide:
- **Load Balancing**: Distribute traffic across multiple backend instances
- **Caching**: Cache static files (images, uploads) for faster delivery
- **Rate Limiting**: Protect against DDoS and brute-force attacks
- **SSL Termination**: Handle HTTPS connections (when configured)
- **Compression**: Gzip compression for faster page loads

## Installation (Windows)

### 1. Download Nginx for Windows

1. Download the latest stable version from: https://nginx.org/en/download.html
2. Choose the Windows version (e.g., `nginx-1.24.0.zip`)
3. Extract to `C:\nginx` (or your preferred location)

### 2. Configure Nginx

1. Copy the configuration file:
   ```powershell
   Copy-Item -Path ".\nginx\nginx.conf" -Destination "C:\nginx\conf\nginx.conf" -Force
   ```

2. Create required directories:
   ```powershell
   New-Item -ItemType Directory -Force -Path "C:\nginx\cache\nginx"
   New-Item -ItemType Directory -Force -Path "C:\nginx\logs"
   ```

### 3. Start Nginx

```powershell
cd C:\nginx
.\nginx.exe
```

### 4. Nginx Commands

```powershell
# Start Nginx
cd C:\nginx; .\nginx.exe

# Stop Nginx gracefully
cd C:\nginx; .\nginx.exe -s quit

# Stop Nginx immediately
cd C:\nginx; .\nginx.exe -s stop

# Reload configuration (no downtime)
cd C:\nginx; .\nginx.exe -s reload

# Test configuration
cd C:\nginx; .\nginx.exe -t
```

## Configuration Details

### Port Mapping

| Service | Direct Port | Via Nginx |
|---------|-------------|-----------|
| Frontend Web | 5174 | 80 |
| Backend Web API | 3001 | 80/api/* |
| Backend Mobile API | 5000 | 8080 |
| Static Files (htdocs) | 80 | 80/digistall_uploads/* |

### Rate Limiting

- **API endpoints**: 30 requests/second with burst of 50
- **Login endpoints**: 5 requests/minute with burst of 3
- **Connection limit**: 20 concurrent connections per IP

### Caching

Static files from `/digistall_uploads/` are cached:
- **Nginx cache**: 1 hour
- **Browser cache**: 7 days

## Running the Complete System

### PowerShell Script to Start All Services

Create `Start-DigiStall.ps1`:

```powershell
# Start-DigiStall.ps1 - Start all DigiStall services

Write-Host "🚀 Starting DigiStall System..." -ForegroundColor Cyan

# 1. Start XAMPP MySQL (if not running)
Write-Host "📊 Starting MySQL..." -ForegroundColor Yellow
Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -WindowStyle Hidden -ErrorAction SilentlyContinue

# 2. Start XAMPP Apache (for htdocs static files)
Write-Host "🌐 Starting Apache..." -ForegroundColor Yellow
Start-Process -FilePath "C:\xampp\apache\bin\httpd.exe" -WindowStyle Hidden -ErrorAction SilentlyContinue

# 3. Start Backend-Web
Write-Host "🔧 Starting Backend-Web on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Backend\Backend-Web'; npm start" -WindowStyle Minimized

# 4. Start Backend-Mobile
Write-Host "📱 Starting Backend-Mobile on port 5000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Backend\Backend-Mobile'; npm start" -WindowStyle Minimized

# 5. Start Frontend-Web
Write-Host "🖥️ Starting Frontend-Web on port 5174..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\Frontend\Web'; npm run dev" -WindowStyle Minimized

# Wait for services to start
Start-Sleep -Seconds 5

# 6. Start Nginx
Write-Host "⚡ Starting Nginx..." -ForegroundColor Yellow
Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx" -WindowStyle Hidden

Write-Host ""
Write-Host "✅ DigiStall System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  - Web App (via Nginx):    http://localhost" -ForegroundColor White
Write-Host "  - Web App (direct):       http://localhost:5174" -ForegroundColor Gray
Write-Host "  - Web API (via Nginx):    http://localhost/api" -ForegroundColor White
Write-Host "  - Mobile API (via Nginx): http://localhost:8080" -ForegroundColor White
Write-Host "  - Mobile API (direct):    http://localhost:5000" -ForegroundColor Gray
Write-Host ""
Write-Host "Health checks:" -ForegroundColor Cyan
Write-Host "  - Nginx:      http://localhost/health" -ForegroundColor White
Write-Host "  - Web API:    http://localhost:3001/api/health" -ForegroundColor White
Write-Host "  - Mobile API: http://localhost:5000/api/health" -ForegroundColor White
```

### Stop All Services

Create `Stop-DigiStall.ps1`:

```powershell
# Stop-DigiStall.ps1 - Stop all DigiStall services

Write-Host "🛑 Stopping DigiStall System..." -ForegroundColor Yellow

# Stop Nginx
Write-Host "Stopping Nginx..." -ForegroundColor Gray
& "C:\nginx\nginx.exe" -s quit 2>$null

# Stop Node.js processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Gray
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "✅ DigiStall System Stopped" -ForegroundColor Green
```

## Troubleshooting

### Common Issues

#### 1. Port 80 Already in Use
If Apache or another service is using port 80:
```powershell
# Find what's using port 80
netstat -ano | findstr :80

# Option A: Stop the conflicting service
# Option B: Change Nginx port to 8000 in nginx.conf
```

#### 2. Nginx Won't Start
```powershell
# Test configuration
cd C:\nginx; .\nginx.exe -t

# Check error log
Get-Content C:\nginx\logs\error.log -Tail 20
```

#### 3. 502 Bad Gateway
This means Nginx can't connect to the backend:
- Ensure Backend-Web is running on port 3001
- Ensure Backend-Mobile is running on port 5000
- Check backend logs for errors

#### 4. Cache Not Working
Clear the Nginx cache:
```powershell
Remove-Item -Recurse -Force "C:\nginx\cache\nginx\*"
cd C:\nginx; .\nginx.exe -s reload
```

### Viewing Logs

```powershell
# Access log (all requests)
Get-Content C:\nginx\logs\access.log -Tail 50 -Wait

# Error log
Get-Content C:\nginx\logs\error.log -Tail 50 -Wait
```

## Production Recommendations

1. **Enable HTTPS**: Uncomment the SSL server block and configure certificates
2. **Increase worker processes**: Set `worker_processes` to number of CPU cores
3. **Tune keepalive**: Increase `keepalive_timeout` for production
4. **Enable logging rotation**: Use logrotate or Windows Task Scheduler
5. **Set up monitoring**: Monitor Nginx status endpoint `/nginx_status`
6. **Use PM2**: For Node.js process management instead of direct npm start

## Performance Tuning

For high-traffic scenarios, adjust these settings in `nginx.conf`:

```nginx
# Increase connections
worker_connections 4096;

# Increase buffer sizes
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;

# Increase cache size
proxy_cache_path cache/nginx levels=1:2 keys_zone=digistall_cache:100m max_size=10g inactive=7d;
```
