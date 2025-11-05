# Start All Services Script
# This script starts Backend, Frontend Web, and Frontend Mobile in separate terminal windows

Write-Host "Starting all services..." -ForegroundColor Green

# Get the script's directory (project root)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\Backend'; Write-Host 'Backend Server' -ForegroundColor Yellow; npm start"

# Start Frontend Web
Write-Host "Starting Frontend Web..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\Frontend\Web'; Write-Host 'Frontend Web' -ForegroundColor Yellow; npm run dev"

# Start Frontend Mobile
Write-Host "Starting Frontend Mobile..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\Frontend\Mobile'; Write-Host 'Frontend Mobile' -ForegroundColor Yellow; npx expo start"

Write-Host "`nAll services are starting in separate windows!" -ForegroundColor Green
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
