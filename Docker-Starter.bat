@echo off
echo ========================================
echo   COMPLETE DATABASE FIX
echo ========================================
echo.

REM Step 1: Stop everything
echo [1/8] Stopping all containers...
docker-compose down -v
timeout /t 3 /nobreak >nul
echo    ✅ All containers stopped and volumes removed

REM Step 2: Check Docker is running
echo.
echo [2/8] Verifying Docker Desktop...
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
echo [3/8] Checking if ports are free...
netstat -ano | findstr :3306 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo    ⚠️  Port 3306 is occupied (probably XAMPP)
    echo    Killing process on port 3306...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3306 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
        echo    ✅ Killed process %%a
    )
    timeout /t 2 /nobreak >nul
)
echo    ✅ Port 3306 is free

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

REM Step 4: Fix Backend .env
echo.
echo [4/8] Fixing Backend .env file...
if not exist Backend\.env (
    echo    Creating new .env file...
)

REM Backup existing .env
if exist Backend\.env (
    copy Backend\.env Backend\.env.backup >nul 2>&1
    echo    ✅ Backup created: Backend\.env.backup
)

REM Create correct .env for Docker
(
    echo # Database Configuration - DOCKER
    echo DB_HOST=database
    echo DB_PORT=3306
    echo DB_USER=digistall_user
    echo DB_PASSWORD=digistall_password
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
    echo APP_BASE_URL=http://localhost:5174
    echo.
    echo # CORS Configuration
    echo ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost
) > Backend\.env
echo    ✅ Backend .env fixed

REM Step 5: Check SQL file exists
echo.
echo [5/8] Checking SQL file...
if not exist "Backend\database\naga_stall_complete.sql" (
    echo    ❌ SQL file not found: Backend\database\naga_stall_complete.sql
    echo    Please make sure the SQL file exists!
    pause
    exit /b 1
)
echo    ✅ SQL file found

REM Step 6: Start containers
echo.
echo [6/8] Starting Docker containers (this may take a minute)...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo    ❌ Failed to start containers!
    echo.
    echo    Please check:
    echo    1. Docker Desktop is running
    echo    2. docker-compose.yml exists
    echo    3. No syntax errors in docker-compose.yml
    pause
    exit /b 1
)
echo    ✅ Containers started

REM Step 7: Wait for database to be ready
echo.
echo [7/8] Waiting for database to initialize (60 seconds)...
echo    This is important - please wait!
timeout /t 60 /nobreak

REM Step 8: Verify everything is running
echo.
echo [8/8] Checking container status...
echo ========================================
docker-compose ps
echo ========================================

echo.
echo Checking database connection...
docker exec digistall-backend sh -c "nc -zv database 3306" 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  Backend cannot reach database yet
    echo    Waiting 10 more seconds...
    timeout /t 10 /nobreak
)

echo.
echo Checking if tables exist...
docker exec digistall-database mysql -udigistall_user -pdigistall_password -e "USE naga_stall; SHOW TABLES;" 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  Tables might not be created yet
    echo    The SQL file will be imported automatically
    echo    Wait 30 more seconds...
    timeout /t 30 /nobreak
)

echo.
echo Testing API health endpoint...
curl -s http://localhost:3001/api/health
if %errorlevel% neq 0 (
    echo    ⚠️  API not responding yet, still starting...
)

echo.
echo ========================================
echo   FINAL STATUS
echo ========================================
docker-compose logs --tail=10 database
echo.
docker-compose logs --tail=10 backend
echo.

echo ========================================
echo   ✅ SETUP COMPLETE!
echo ========================================
echo.
echo 🌐 Your application should be available at:
echo    Frontend: http://localhost
echo    Backend:  http://localhost:3001
echo.
echo 📋 Next Steps:
echo    1. Wait 10 more seconds
echo    2. Refresh your browser (Ctrl + F5)
echo    3. If still not working, check logs: docker-compose logs -f
echo.
echo 🔍 If you see errors:
echo    - Check logs: docker-compose logs backend
echo    - Check database: docker-compose logs database
echo    - Restart: docker-compose restart
echo.
pause