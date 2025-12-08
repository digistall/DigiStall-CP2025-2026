# =============================================
# STALL IMAGE MANAGEMENT - SETUP SCRIPT
# =============================================
# Purpose: Setup directories and verify configuration
# Usage: .\Setup-StallImages.ps1
# =============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STALL IMAGE MANAGEMENT - SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$XAMPP_HTDOCS = "C:\xampp\htdocs"
$UPLOAD_BASE = "$XAMPP_HTDOCS\digistall_uploads"
$STALLS_DIR = "$UPLOAD_BASE\stalls"

# =============================================
# STEP 1: Check XAMPP Installation
# =============================================
Write-Host "Step 1: Checking XAMPP Installation..." -ForegroundColor Yellow

if (Test-Path $XAMPP_HTDOCS) {
    Write-Host "✅ XAMPP htdocs found at: $XAMPP_HTDOCS" -ForegroundColor Green
} else {
    Write-Host "❌ XAMPP htdocs not found at: $XAMPP_HTDOCS" -ForegroundColor Red
    Write-Host "   Please install XAMPP or update the path in this script" -ForegroundColor Red
    exit 1
}

# =============================================
# STEP 2: Create Upload Directories
# =============================================
Write-Host "`nStep 2: Creating Upload Directories..." -ForegroundColor Yellow

# Create base directory
if (!(Test-Path $UPLOAD_BASE)) {
    New-Item -ItemType Directory -Path $UPLOAD_BASE -Force | Out-Null
    Write-Host "✅ Created: $UPLOAD_BASE" -ForegroundColor Green
} else {
    Write-Host "✅ Already exists: $UPLOAD_BASE" -ForegroundColor Green
}

# Create stalls directory
if (!(Test-Path $STALLS_DIR)) {
    New-Item -ItemType Directory -Path $STALLS_DIR -Force | Out-Null
    Write-Host "✅ Created: $STALLS_DIR" -ForegroundColor Green
} else {
    Write-Host "✅ Already exists: $STALLS_DIR" -ForegroundColor Green
}

# Create sample branch/stall directories for testing
$sampleDirs = @(
    "$STALLS_DIR\1\25",
    "$STALLS_DIR\1\26",
    "$STALLS_DIR\2\10"
)

foreach ($dir in $sampleDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created sample: $dir" -ForegroundColor Green
    }
}

# =============================================
# STEP 3: Set Permissions
# =============================================
Write-Host "`nStep 3: Setting Directory Permissions..." -ForegroundColor Yellow

try {
    # Grant full control to Everyone (for development)
    # In production, use more restrictive permissions
    icacls $UPLOAD_BASE /grant Everyone:F /T /Q | Out-Null
    Write-Host "✅ Permissions set successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not set permissions automatically" -ForegroundColor Yellow
    Write-Host "   Please ensure the directories are writable" -ForegroundColor Yellow
}

# =============================================
# STEP 4: Check PHP Configuration
# =============================================
Write-Host "`nStep 4: Checking PHP Configuration..." -ForegroundColor Yellow

$phpIniPath = "C:\xampp\php\php.ini"

if (Test-Path $phpIniPath) {
    $phpIni = Get-Content $phpIniPath
    
    # Check upload_max_filesize
    $uploadMaxFilesize = ($phpIni | Select-String "upload_max_filesize\s*=\s*(.+)").Matches.Groups[1].Value
    Write-Host "   upload_max_filesize: $uploadMaxFilesize" -ForegroundColor Cyan
    
    # Check post_max_size
    $postMaxSize = ($phpIni | Select-String "post_max_size\s*=\s*(.+)").Matches.Groups[1].Value
    Write-Host "   post_max_size: $postMaxSize" -ForegroundColor Cyan
    
    # Check max_file_uploads
    $maxFileUploads = ($phpIni | Select-String "max_file_uploads\s*=\s*(.+)").Matches.Groups[1].Value
    Write-Host "   max_file_uploads: $maxFileUploads" -ForegroundColor Cyan
    
    Write-Host "`n   Recommended settings:" -ForegroundColor Yellow
    Write-Host "   - upload_max_filesize = 10M" -ForegroundColor Yellow
    Write-Host "   - post_max_size = 10M" -ForegroundColor Yellow
    Write-Host "   - max_file_uploads = 20" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  php.ini not found at: $phpIniPath" -ForegroundColor Yellow
}

# =============================================
# STEP 5: Test Apache Access
# =============================================
Write-Host "`nStep 5: Testing Apache Access..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Apache is running and accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Apache is not accessible at http://localhost/" -ForegroundColor Yellow
    Write-Host "   Please start Apache in XAMPP Control Panel" -ForegroundColor Yellow
}

# =============================================
# STEP 6: Verify Database Migration
# =============================================
Write-Host "`nStep 6: Database Migration Check..." -ForegroundColor Yellow

$migrationFile = "database\migrations\create_stall_images_table.sql"

if (Test-Path $migrationFile) {
    Write-Host "✅ Migration file found: $migrationFile" -ForegroundColor Green
    Write-Host "`n   To run the migration:" -ForegroundColor Cyan
    Write-Host "   1. Open MySQL Workbench or phpMyAdmin" -ForegroundColor Cyan
    Write-Host "   2. Connect to 'naga_stall' database" -ForegroundColor Cyan
    Write-Host "   3. Execute the SQL file: $migrationFile" -ForegroundColor Cyan
} else {
    Write-Host "❌ Migration file not found" -ForegroundColor Red
}

# =============================================
# STEP 7: Summary
# =============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SETUP SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Run the database migration (Step 6 above)" -ForegroundColor White
Write-Host "2. Ensure Apache is running in XAMPP" -ForegroundColor White
Write-Host "3. Start your backend server (npm start)" -ForegroundColor White
Write-Host "4. Test image uploads via API or frontend" -ForegroundColor White

Write-Host "`nDirectory Structure Created:" -ForegroundColor Yellow
Write-Host "  $STALLS_DIR\" -ForegroundColor Cyan
Write-Host "  ├── 1\" -ForegroundColor Cyan
Write-Host "  │   ├── 25\" -ForegroundColor Cyan
Write-Host "  │   └── 26\" -ForegroundColor Cyan
Write-Host "  └── 2\" -ForegroundColor Cyan
Write-Host "      └── 10\" -ForegroundColor Cyan

Write-Host "`nTest Image Access:" -ForegroundColor Yellow
Write-Host "  http://localhost/digistall_uploads/stalls/1/25/1.jpg" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host ""
