# Start-DigiStall.ps1 - Start all DigiStall services with Nginx

param(
    [switch]$NoNginx,
    [switch]$NoXampp
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 DigiStall System Startup Script     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$MaxAttempts = 30
    )
    
    $attempt = 0
    while ($attempt -lt $MaxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ $Name is ready" -ForegroundColor Green
                return $true
            }
        } catch {
            # Service not ready yet
        }
        $attempt++
        Start-Sleep -Milliseconds 500
    }
    Write-Host "   ⚠️ $Name may not be fully ready" -ForegroundColor Yellow
    return $false
}

# 1. Start XAMPP Services (MySQL and Apache)
if (-not $NoXampp) {
    Write-Host "📊 Starting XAMPP Services..." -ForegroundColor Yellow
    
    # Check and start MySQL
    if (-not (Test-PortInUse 3306)) {
        if (Test-Path "C:\xampp\mysql\bin\mysqld.exe") {
            Write-Host "   Starting MySQL..." -ForegroundColor Gray
            Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -WindowStyle Hidden -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        } else {
            Write-Host "   ⚠️ MySQL not found at C:\xampp\mysql\bin\mysqld.exe" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✅ MySQL already running on port 3306" -ForegroundColor Green
    }
    
    # Check and start Apache
    if (-not (Test-PortInUse 80)) {
        if (Test-Path "C:\xampp\apache\bin\httpd.exe") {
            Write-Host "   Starting Apache (for htdocs static files)..." -ForegroundColor Gray
            Start-Process -FilePath "C:\xampp\apache\bin\httpd.exe" -WindowStyle Hidden -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        } else {
            Write-Host "   ⚠️ Apache not found at C:\xampp\apache\bin\httpd.exe" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✅ Apache already running on port 80" -ForegroundColor Green
    }
}

# 2. Start Backend-Web
Write-Host ""
Write-Host "🔧 Starting Backend-Web (port 3001)..." -ForegroundColor Yellow
if (-not (Test-PortInUse 3001)) {
    $backendWebPath = Join-Path $scriptPath "Backend\Backend-Web"
    Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", "cd '$backendWebPath'; npm start" -WindowStyle Minimized
    Write-Host "   Started Backend-Web process" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Backend-Web already running on port 3001" -ForegroundColor Green
}

# 3. Start Backend-Mobile
Write-Host ""
Write-Host "📱 Starting Backend-Mobile (port 5000)..." -ForegroundColor Yellow
if (-not (Test-PortInUse 5000)) {
    $backendMobilePath = Join-Path $scriptPath "Backend\Backend-Mobile"
    Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", "cd '$backendMobilePath'; npm start" -WindowStyle Minimized
    Write-Host "   Started Backend-Mobile process" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Backend-Mobile already running on port 5000" -ForegroundColor Green
}

# 4. Start Frontend-Web
Write-Host ""
Write-Host "🖥️ Starting Frontend-Web (port 5174)..." -ForegroundColor Yellow
if (-not (Test-PortInUse 5174)) {
    $frontendPath = Join-Path $scriptPath "Frontend\Web"
    Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Minimized
    Write-Host "   Started Frontend-Web process" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Frontend-Web already running on port 5174" -ForegroundColor Green
}

# Wait for services to start
Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 5. Start Nginx (if configured)
if (-not $NoNginx) {
    Write-Host ""
    Write-Host "⚡ Starting Nginx reverse proxy..." -ForegroundColor Yellow
    
    $nginxPath = "C:\nginx"
    if (Test-Path (Join-Path $nginxPath "nginx.exe")) {
        # Stop any existing Nginx instance
        Start-Process -FilePath (Join-Path $nginxPath "nginx.exe") -ArgumentList "-s", "quit" -WorkingDirectory $nginxPath -WindowStyle Hidden -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        
        # Start Nginx
        Start-Process -FilePath (Join-Path $nginxPath "nginx.exe") -WorkingDirectory $nginxPath -WindowStyle Hidden
        Write-Host "   ✅ Nginx started" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Nginx not found at C:\nginx" -ForegroundColor Yellow
        Write-Host "   📥 Download from: https://nginx.org/en/download.html" -ForegroundColor Gray
        Write-Host "   📄 Copy nginx\nginx.conf to C:\nginx\conf\nginx.conf" -ForegroundColor Gray
    }
}

# Display status
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ DigiStall System Started!           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Access Points:" -ForegroundColor Cyan
Write-Host "   ┌─────────────────────────────────────────┐" -ForegroundColor DarkGray
Write-Host "   │ Frontend (direct):    http://localhost:5174     │" -ForegroundColor White
Write-Host "   │ Web API:              http://localhost:3001/api │" -ForegroundColor White
Write-Host "   │ Mobile API:           http://localhost:5000/api │" -ForegroundColor White
Write-Host "   │ Static Files:         http://localhost/digistall_uploads │" -ForegroundColor Gray
Write-Host "   └─────────────────────────────────────────┘" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🩺 Health Checks:" -ForegroundColor Cyan
Write-Host "   Web API:    http://localhost:3001/api/health" -ForegroundColor Gray
Write-Host "   Mobile API: http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop all services, run: .\Stop-DigiStall.ps1" -ForegroundColor Yellow
Write-Host ""
