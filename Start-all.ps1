# ============================================
# DigiStall - MVC Role-Based Architecture
# ============================================
# This script starts all services using the
# NEW MVC role-based folder structure
# ============================================
# Usage:
#   .\Start-all.ps1           - Start all services
#   .\Start-all.ps1 -Backend  - Start only backend
#   .\Start-all.ps1 -Web      - Start only frontend web
#   .\Start-all.ps1 -Mobile   - Start only mobile app
# ============================================

param(
    [switch]$Backend,
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
    Write-Host "  .\Start-all.ps1           - Start all services" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Backend  - Start only backend server" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Web      - Start only frontend web" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Mobile   - Start only mobile app" -ForegroundColor Gray
    Write-Host "  .\Start-all.ps1 -Help     - Show this help" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Services:" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:3001  (node server.js)" -ForegroundColor Gray
    Write-Host "  Web:      http://localhost:5173  (npm run dev)" -ForegroundColor Gray
    Write-Host "  Mobile:   Expo QR Code           (npx expo start)" -ForegroundColor Gray
    Write-Host ""
    exit
}

# If no specific flag, start all
$startAll = -not ($Backend -or $Web -or $Mobile)

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
    Copy-Item "$projectRoot\.env" "$projectRoot\FRONTEND-RUNNER\WEB\.env" -Force -ErrorAction SilentlyContinue
    Copy-Item "$projectRoot\.env" "$projectRoot\FRONTEND-RUNNER\MOBILE\.env" -Force -ErrorAction SilentlyContinue
    Write-Host "    .env files synced to FRONTEND-RUNNER" -ForegroundColor DarkGray
} else {
    Write-Host "    WARNING: .env file not found!" -ForegroundColor Red
}
Write-Host ""

# ============================================
# 1. Start MVC Backend Server (Node.js - Port 3001)
# ============================================
if ($startAll -or $Backend) {
    Write-Host "[1] Starting MVC Backend Server (port 3001)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$Host.UI.RawUI.WindowTitle = 'DigiStall - MVC Backend (3001)'
        cd '$projectRoot'
        Write-Host '========================================' -ForegroundColor Green
        Write-Host '  MVC BACKEND SERVER - Port 3001' -ForegroundColor Green
        Write-Host '  Using: server.js (NEW MVC Structure)' -ForegroundColor Green
        Write-Host '========================================' -ForegroundColor Green
        Write-Host ''
        node server.js
"@
    Start-Sleep -Seconds 2
}

# ============================================
# 2. Start Frontend Web (Vue.js/Vite - Port 5173)
# ============================================
if ($startAll -or $Web) {
    Write-Host "[2] Starting Frontend Web (port 5173)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$Host.UI.RawUI.WindowTitle = 'DigiStall - Frontend Web (5173)'
        cd '$projectRoot\FRONTEND-RUNNER\WEB'
        Write-Host '========================================' -ForegroundColor Green
        Write-Host '  FRONTEND WEB - Vue.js Port 5173' -ForegroundColor Green
        Write-Host '  Location: FRONTEND-RUNNER/WEB' -ForegroundColor Green
        Write-Host '========================================' -ForegroundColor Green
        Write-Host ''
        npm run dev
"@
    Start-Sleep -Seconds 2
}

# ============================================
# 3. Start Frontend Mobile (Expo)
# ============================================
if ($startAll -or $Mobile) {
    Write-Host "[3] Starting Frontend Mobile (Expo)..." -ForegroundColor Yellow
    
    # Check if FRONTEND-RUNNER/MOBILE has node_modules
    if (-not (Test-Path "$projectRoot\FRONTEND-RUNNER\MOBILE\node_modules")) {
        Write-Host "    Installing mobile dependencies first..." -ForegroundColor DarkYellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
            `$Host.UI.RawUI.WindowTitle = 'DigiStall - Mobile (Expo)'
            cd '$projectRoot\FRONTEND-RUNNER\MOBILE'
            Write-Host '========================================' -ForegroundColor Green
            Write-Host '  FRONTEND MOBILE - Expo' -ForegroundColor Green
            Write-Host '  Location: FRONTEND-RUNNER/MOBILE' -ForegroundColor Green
            Write-Host '========================================' -ForegroundColor Green
            Write-Host ''
            Write-Host 'Installing dependencies...' -ForegroundColor Yellow
            npm install
            Write-Host ''
            npx expo start
"@
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
            `$Host.UI.RawUI.WindowTitle = 'DigiStall - Mobile (Expo)'
            cd '$projectRoot\FRONTEND-RUNNER\MOBILE'
            Write-Host '========================================' -ForegroundColor Green
            Write-Host '  FRONTEND MOBILE - Expo' -ForegroundColor Green
            Write-Host '  Location: FRONTEND-RUNNER/MOBILE' -ForegroundColor Green
            Write-Host '========================================' -ForegroundColor Green
            Write-Host ''
            npx expo start
"@
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   MVC System Started Successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor White
if ($startAll -or $Backend) {
    Write-Host "  [Backend]  http://localhost:3001  (NEW MVC Structure)" -ForegroundColor Cyan
}
if ($startAll -or $Web) {
    Write-Host "  [Web]      http://localhost:5173  (Original UI Preserved)" -ForegroundColor Cyan
}
if ($startAll -or $Mobile) {
    Write-Host "  [Mobile]   Scan QR code in Expo terminal" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Architecture:" -ForegroundColor White
Write-Host "  - Backend uses new MVC role-based folders" -ForegroundColor DarkGray
Write-Host "  - Frontend runs from FRONTEND-RUNNER/" -ForegroundColor DarkGray
Write-Host "  - Views distributed in role folders (MVC)" -ForegroundColor DarkGray
Write-Host "  - Database: DigitalOcean MySQL (cloud)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Tips:" -ForegroundColor White
Write-Host "  - Use Ctrl+C in each terminal to stop" -ForegroundColor DarkGray
Write-Host "  - Run .\Start-all.ps1 -Help for options" -ForegroundColor DarkGray
Write-Host ""
