# ============================================
# DigiStall - MVC Role-Based Architecture
# ============================================
# This script starts all services using the
# NEW MVC role-based folder structure
# ============================================
# Usage:
#   .\Start-all.ps1              - Start all services
#   .\Start-all.ps1 -Backend     - Start both backends (web + mobile)
#   .\Start-all.ps1 -BackendWeb  - Start only web backend (port 5000)
#   .\Start-all.ps1 -BackendMobile - Start only mobile backend (port 5001)
#   .\Start-all.ps1 -Web         - Start only frontend web
#   .\Start-all.ps1 -Mobile      - Start only mobile app
# ============================================

param(
    [switch]$Backend,
    [switch]$BackendWeb,
    [switch]$BackendMobile,
    [switch]$Web,
    [switch]$Mobile,
    [switch]$Help
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Show help
if ($Help) {
    Write-Host ""
    Write-Host "DigiStall - MVC Role-Based System Starter" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  .\Start-all.ps1              - Start all services (4 terminals)" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Backend     - Start both backends (web + mobile)" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -BackendWeb  - Start only web backend (port 5000)" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -BackendMobile - Start only mobile backend (port 5001)" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Web         - Start only frontend web" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Mobile      - Start only mobile app" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Help        - Show this help" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Services:" -ForegroundColor White
    Write-Host "  Backend Web:    http://localhost:5000  (node server.js - for web frontend)" -ForegroundColor Gray
    Write-Host "  Backend Mobile: http://localhost:5001  (node server.js - for mobile app)" -ForegroundColor Gray
    Write-Host "  Frontend Web:   http://localhost:5173  (npm run dev)" -ForegroundColor Gray
    Write-Host "  Frontend Mobile: Expo QR Code          (npx expo start)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Environment:" -ForegroundColor White
    Write-Host "  Expo Go  -> Connects to LOCAL backend  (192.168.1.105:5001)" -ForegroundColor Gray
    Write-Host "  APK      -> Connects to DIGITALOCEAN   (68.183.154.125:5001)" -ForegroundColor Gray
    Write-Host ""
    exit
}

# If no specific flag, start all
$startAll = -not ($Backend -or $BackendWeb -or $BackendMobile -or $Web -or $Mobile)

Clear-Host
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   DigiStall - MVC Role-Based System" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Root: $projectRoot" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Role Folders Active:" -ForegroundColor White
Write-Host "  - BUSINESS/" -ForegroundColor DarkGray
Write-Host "    - BUSINESS-OWNER (Branch, Subscription)" -ForegroundColor DarkGray
Write-Host "    - BUSINESS-MANAGER (Shared features)" -ForegroundColor DarkGray
Write-Host "    - SHARED (Dashboard, Employees, Stalls, etc.)" -ForegroundColor DarkGray
Write-Host "  - EMPLOYEE/ (WEB-EMPLOYEE, MOBILE-EMPLOYEE)" -ForegroundColor DarkGray
Write-Host "  - STALL-HOLDER" -ForegroundColor DarkGray
Write-Host "  - VENDOR" -ForegroundColor DarkGray
Write-Host "  - APPLICANTS" -ForegroundColor DarkGray
Write-Host "  - AUTH" -ForegroundColor DarkGray
Write-Host "  - PUBLIC-LANDINGPAGE" -ForegroundColor DarkGray
Write-Host "  - SYSTEM-ADMINISTRATOR" -ForegroundColor DarkGray
Write-Host ""

# ============================================
# 0. Sync .env files to all folders
# ============================================
Write-Host "[0] Syncing .env files..." -ForegroundColor Gray
if (Test-Path "$projectRoot\.env") {
    Write-Host "    .env present at project root" -ForegroundColor DarkGray
} else {
    Write-Host "    WARNING: .env file not found!" -ForegroundColor Red
}
Write-Host ""

# ============================================
# 1. Start Backend Web Server (Port 5000)
# ============================================
if ($startAll -or $Backend -or $BackendWeb) {
    Write-Host "[1] Starting Backend Web Server (port 5000)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$Host.UI.RawUI.WindowTitle = 'DigiStall - Backend WEB (5000)'
        cd '$projectRoot'
        Write-Host '========================================' -ForegroundColor Green
        Write-Host '  BACKEND WEB SERVER - Port 5000' -ForegroundColor Green
        Write-Host '  For: Web Frontend (Vue.js)' -ForegroundColor Green
        Write-Host '  Using: server.js (MVC Structure)' -ForegroundColor Green
        Write-Host '========================================' -ForegroundColor Green
        Write-Host ''
        `$env:PORT = '5000'
        `$env:NODE_ENV = 'development'
        node server.js
"@
    Start-Sleep -Seconds 2
}

# ============================================
# 2. Start Backend Mobile Server (Port 5001)
# ============================================
if ($startAll -or $Backend -or $BackendMobile) {
    Write-Host "[2] Starting Backend Mobile Server (port 5001)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$Host.UI.RawUI.WindowTitle = 'DigiStall - Backend MOBILE (5001)'
        cd '$projectRoot'
        Write-Host '========================================' -ForegroundColor Green
        Write-Host '  BACKEND MOBILE SERVER - Port 5001' -ForegroundColor Green
        Write-Host '  For: Mobile App (Expo / APK)' -ForegroundColor Green
        Write-Host '  Using: server.js (MVC Structure)' -ForegroundColor Green
        Write-Host '========================================' -ForegroundColor Green
        Write-Host ''
        `$env:PORT = '5001'
        `$env:NODE_ENV = 'development'
        node server.js
"@
    Start-Sleep -Seconds 2
}

# ============================================
# 3. Start Frontend Web (Vue.js/Vite - Port 5173)
# ============================================
if ($startAll -or $Web) {
    Write-Host "[3] Starting Frontend Web (port 5173)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$Host.UI.RawUI.WindowTitle = 'DigiStall - Frontend Web (5173)'
        cd '$projectRoot\FRONTEND\WEB'
        Write-Host '========================================' -ForegroundColor Green
        Write-Host '  FRONTEND WEB - Vue.js Port 5173' -ForegroundColor Green
        Write-Host '  Location: FRONTEND/WEB' -ForegroundColor Green
        Write-Host '========================================' -ForegroundColor Green
        Write-Host ''
        npm run dev
"@
    Start-Sleep -Seconds 2
}

# ============================================
# 4. Start Frontend Mobile (Expo)
# ============================================
if ($startAll -or $Mobile) {
    Write-Host "[4] Starting Frontend Mobile (Expo)..." -ForegroundColor Yellow
    
    # Check if FRONTEND/MOBILE has node_modules
    if (-not (Test-Path "$projectRoot\FRONTEND\MOBILE\node_modules")) {
        Write-Host "    Installing mobile dependencies first..." -ForegroundColor DarkYellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
            `$Host.UI.RawUI.WindowTitle = 'DigiStall - Mobile (Expo)'
            cd '$projectRoot\FRONTEND\MOBILE'
            Write-Host '========================================' -ForegroundColor Green
            Write-Host '  FRONTEND MOBILE - Expo' -ForegroundColor Green
            Write-Host '  Location: FRONTEND/MOBILE' -ForegroundColor Green
            Write-Host '========================================' -ForegroundColor Green
            Write-Host ''
            Write-Host 'Installing dependencies...' -ForegroundColor Yellow
            npm install
            Write-Host ''
            npx expo start -c --offline
"@
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
            `$Host.UI.RawUI.WindowTitle = 'DigiStall - Mobile (Expo)'
            cd '$projectRoot\FRONTEND\MOBILE'
            Write-Host '========================================' -ForegroundColor Green
            Write-Host '  FRONTEND MOBILE - Expo' -ForegroundColor Green
            Write-Host '  Location: FRONTEND/MOBILE' -ForegroundColor Green
            Write-Host '========================================' -ForegroundColor Green
            Write-Host ''
            npx expo start -c --offline
"@
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   MVC System Started Successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor White
if ($startAll -or $Backend -or $BackendWeb) {
    Write-Host "  [Backend Web]    http://localhost:5000  (for Web Frontend)" -ForegroundColor Cyan
}
if ($startAll -or $Backend -or $BackendMobile) {
    Write-Host "  [Backend Mobile] http://localhost:5001  (for Mobile App)" -ForegroundColor Cyan
}
if ($startAll -or $Web) {
    Write-Host "  [Frontend Web]   http://localhost:5173  (Vue.js UI)" -ForegroundColor Cyan
}
if ($startAll -or $Mobile) {
    Write-Host "  [Frontend Mobile] Scan QR code in Expo terminal" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Architecture:" -ForegroundColor White
Write-Host "  - Backend Web (5000)  = same server.js, different port" -ForegroundColor DarkGray
Write-Host "  - Backend Mobile (5001) = same server.js, different port" -ForegroundColor DarkGray
Write-Host "  - Matches production (DigitalOcean: 5000/5001)" -ForegroundColor DarkGray
Write-Host "  - Frontend runs from FRONTEND/" -ForegroundColor DarkGray
Write-Host "  - Database: DigitalOcean MySQL (cloud)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Mobile Backend Routing:" -ForegroundColor White
Write-Host "  - Expo Go (dev)  -> Local backend  (192.168.1.105:5001)" -ForegroundColor DarkGray
Write-Host "  - APK (prod)     -> DigitalOcean    (68.183.154.125:5001)" -ForegroundColor DarkGray
Write-Host "  - Auto-detected via __DEV__ flag (no manual config needed)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Tips:" -ForegroundColor White
Write-Host "  - Use Ctrl+C in each terminal to stop" -ForegroundColor DarkGray
Write-Host "  - Run .\Start-all.ps1 -Help for options" -ForegroundColor DarkGray
Write-Host ""
