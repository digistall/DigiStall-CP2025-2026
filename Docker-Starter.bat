@echo off
echo ========================================
echo   DIGISTALL SIMPLIFIED STARTUP
echo ========================================
echo.
echo Note: Make sure your database is running externally!
echo.

REM Step 1: Stop everything
echo [1/5] Stopping all containers...
docker-compose down
timeout /t 3 /nobreak >nul
echo    ✅ All containers stopped

REM Step 2: Check Docker is running
echo.
echo [2/5] Verifying Docker Desktop...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Docker Desktop is not running!
    echo    Please start Docker Desktop first
    pause
    exit /b 1
)
echo    ✅ Docker Desktop is running

REM Step 3: Check if ports are free
echo.
echo [3/5] Checking if ports are free...
netstat -ano | findstr :80 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo    ⚠️  Port 80 is occupied
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :80 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
        echo    ✅ Killed process %%a
    )
    timeout /t 2 /nobreak >nul
)
echo    ✅ Port 80 is free

netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo    ⚠️  Port 3001 is occupied
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
        echo    ✅ Killed process %%a
    )
    timeout /t 2 /nobreak >nul
)
echo    ✅ Port 3001 is free

REM Step 4: Fix Backend .env for external database
echo.
echo [4/5] Fixing Backend .env file...
if not exist Backend\.env (
    echo    Creating new .env file...
)

REM Backup existing .env
if exist Backend\.env (
    copy Backend\.env Backend\.env.backup >nul 2>&1
    echo    ✅ Backup created: Backend\.env.backup
)

REM Create correct .env for external database
(
    echo # Database Configuration - EXTERNAL DATABASE
    echo DB_HOST=host.docker.internal
    echo DB_PORT=3306
    echo DB_USER=root
    echo DB_PASSWORD=
    echo DB_NAME=naga_stall
    echo.
    echo # JWT Configuration
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
    echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
    echo.
    echo # Server Configuration
    echo WEB_PORT=3001
    echo MOBILE_PORT=5001
    echo.
    echo # Environment
    echo NODE_ENV=development
    echo.
    echo # Email Configuration
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USER=your-email@gmail.com
    echo SMTP_PASS=your-app-password-here
    echo FROM_EMAIL=noreply@nagastallmanagement.com
    echo FROM_NAME=Naga Stall Management System
    echo APP_BASE_URL=http://localhost
    echo.
    echo # CORS Configuration
    echo ALLOWED_ORIGINS=http://localhost,http://localhost:5173,http://localhost:5174,http://localhost:3000
) > Backend\.env
echo    ✅ Backend .env fixed for external database

REM Step 5: Start containers
echo.
echo [5/5] Starting Docker containers...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo    ❌ Failed to start containers!
    echo.
    echo    Please check:
    echo    1. Docker Desktop is running
    echo    2. docker-compose.yml exists
    echo    3. No syntax errors in docker-compose.yml
    echo    4. Your external database is running
    pause
    exit /b 1
)
echo    ✅ Containers started

echo.
echo ========================================
echo   FINAL STATUS
echo ========================================
docker-compose ps
echo ========================================

echo.
echo Testing API health endpoint...
timeout /t 5 /nobreak >nul
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -ErrorAction SilentlyContinue >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Backend API is responding
) else (
    echo    ⚠️  Backend API not responding yet
)

echo.
echo ========================================
echo   ✅ SETUP COMPLETE!
echo ========================================
echo.
echo 🌐 Your applications are available at:
echo    Web Frontend: http://localhost
echo    Backend API:  http://localhost:3001
echo.
echo 📋 Important Notes:
echo    ⚠️  Make sure your external database is running!
echo    ⚠️  Database should be accessible at localhost:3306
echo    ⚠️  Database name: naga_stall
echo.
echo 🔍 If you see errors:
echo    - Check logs: docker-compose logs backend
echo    - Check logs: docker-compose logs frontend-web
echo    - Restart: docker-compose restart
echo.
pause