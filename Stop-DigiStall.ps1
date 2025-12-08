# Stop-DigiStall.ps1 - Stop all DigiStall services

param(
    [switch]$Force
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║     🛑 DigiStall System Shutdown           ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

# 1. Stop Nginx
Write-Host "⏹️ Stopping Nginx..." -ForegroundColor Gray
$nginxPath = "C:\nginx"
if (Test-Path (Join-Path $nginxPath "nginx.exe")) {
    if ($Force) {
        Start-Process -FilePath (Join-Path $nginxPath "nginx.exe") -ArgumentList "-s", "stop" -WorkingDirectory $nginxPath -WindowStyle Hidden -ErrorAction SilentlyContinue
    } else {
        Start-Process -FilePath (Join-Path $nginxPath "nginx.exe") -ArgumentList "-s", "quit" -WorkingDirectory $nginxPath -WindowStyle Hidden -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ Nginx stopped" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Nginx not found" -ForegroundColor Gray
}

# 2. Stop Node.js processes (Backend and Frontend)
Write-Host ""
Write-Host "⏹️ Stopping Node.js processes..." -ForegroundColor Gray
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $count = $nodeProcesses.Count
    $nodeProcesses | Stop-Process -Force
    Write-Host "   ✅ Stopped $count Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ No Node.js processes running" -ForegroundColor Gray
}

# 3. Optionally stop XAMPP services
if ($Force) {
    Write-Host ""
    Write-Host "⏹️ Stopping XAMPP services..." -ForegroundColor Gray
    
    # Stop Apache
    $apacheProcess = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
    if ($apacheProcess) {
        $apacheProcess | Stop-Process -Force
        Write-Host "   ✅ Apache stopped" -ForegroundColor Green
    }
    
    # Stop MySQL
    $mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
    if ($mysqlProcess) {
        $mysqlProcess | Stop-Process -Force
        Write-Host "   ✅ MySQL stopped" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ DigiStall System Stopped            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if (-not $Force) {
    Write-Host "💡 Tip: Use -Force to also stop XAMPP (MySQL & Apache)" -ForegroundColor Gray
    Write-Host "   Example: .\Stop-DigiStall.ps1 -Force" -ForegroundColor Gray
    Write-Host ""
}
