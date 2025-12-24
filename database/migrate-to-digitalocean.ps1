# =============================================================
# DigitalOcean Database Migration Script
# =============================================================
# This script helps migrate your local naga_stall database to DigitalOcean
# 
# IMPORTANT: Before running, update the connection details below with your
# DigitalOcean database credentials from the dashboard.
# =============================================================

# =============================================
# STEP 1: UPDATE THESE WITH YOUR DO CREDENTIALS
# =============================================
# Connection details from DigitalOcean dashboard

$DO_HOST = "dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com"
$DO_PORT = "25060"
$DO_USER = "doadmin"
$DO_PASSWORD = "AVNS_hxkemfGwzsOdj4pbu35"
$DO_DATABASE = "naga_stall"  # We'll create this database first

# Local MySQL path
$MYSQL_PATH = "C:\xampp\mysql\bin"

# =============================================
# STEP 2: Pre-process SQL file for DigitalOcean
# =============================================
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "DigitalOcean Database Migration Tool" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if credentials are updated
if ($DO_HOST -eq "YOUR-DATABASE-HOST.db.ondigitalocean.com") {
    Write-Host "`n[ERROR] Please update the DigitalOcean connection details at the top of this script!" -ForegroundColor Red
    exit 1
}

Write-Host "Using DigitalOcean Database:" -ForegroundColor Cyan
Write-Host "  Host: $DO_HOST" -ForegroundColor Gray
Write-Host "  Port: $DO_PORT" -ForegroundColor Gray
Write-Host "  User: $DO_USER" -ForegroundColor Gray
Write-Host "  Database: $DO_DATABASE" -ForegroundColor Gray

$SQL_FILE = "naga_stall.sql"
$PROCESSED_FILE = "naga_stall_digitalocean.sql"

Write-Host "`n[Step 1/4] Processing SQL file for DigitalOcean compatibility..." -ForegroundColor Yellow

# Read the original SQL file
$content = Get-Content -Path $SQL_FILE -Raw -Encoding UTF8

# Replace DEFINER clauses (DigitalOcean doesn't allow them)
$content = $content -replace "DEFINER=\`[^\`]+\`@\`[^\`]+\`\s*", ""
$content = $content -replace "DEFINER=``[^``]+``@``[^``]+``\s*", ""

# Remove SQL_MODE that might cause issues
$content = $content -replace 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";', '-- SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";'

# Save processed file
$content | Set-Content -Path $PROCESSED_FILE -Encoding UTF8

Write-Host "[Step 1/4] SQL file processed successfully!" -ForegroundColor Green

# =============================================
# STEP 3: Test Connection to DigitalOcean
# =============================================
Write-Host "`n[Step 2/4] Testing connection to DigitalOcean database..." -ForegroundColor Yellow

$testResult = & "$MYSQL_PATH\mysql.exe" --host=$DO_HOST --port=$DO_PORT --user=$DO_USER --password=$DO_PASSWORD --ssl -e "SELECT 1 AS test;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to connect to DigitalOcean database!" -ForegroundColor Red
    Write-Host "Error: $testResult" -ForegroundColor Red
    Write-Host "`nPossible issues:" -ForegroundColor Yellow
    Write-Host "1. Check your connection credentials" -ForegroundColor White
    Write-Host "2. Make sure your IP is in the trusted sources (Databases > Settings > Trusted Sources)" -ForegroundColor White
    Write-Host "3. Ensure the database 'naga_stall' exists (create it in Users & Databases tab)" -ForegroundColor White
    exit 1
}

Write-Host "[Step 2/4] Connection successful!" -ForegroundColor Green

# =============================================
# STEP 4: Check if database exists
# =============================================
Write-Host "`n[Step 3/4] Checking if 'naga_stall' database exists..." -ForegroundColor Yellow

$dbCheck = & "$MYSQL_PATH\mysql.exe" --host=$DO_HOST --port=$DO_PORT --user=$DO_USER --password=$DO_PASSWORD --ssl -e "SHOW DATABASES LIKE 'naga_stall';" 2>&1

if ($dbCheck -notmatch "naga_stall") {
    Write-Host "[WARNING] Database 'naga_stall' not found!" -ForegroundColor Red
    Write-Host "Please create it in DigitalOcean:" -ForegroundColor Yellow
    Write-Host "1. Go to Databases > dbaas-db-2078449" -ForegroundColor White
    Write-Host "2. Click 'Users & Databases' tab" -ForegroundColor White
    Write-Host "3. Under 'Databases', click 'Add Database'" -ForegroundColor White
    Write-Host "4. Enter 'naga_stall' and click 'Create'" -ForegroundColor White
    
    $createDb = Read-Host "`nWould you like me to try creating the database? (y/n)"
    if ($createDb -eq "y") {
        & "$MYSQL_PATH\mysql.exe" --host=$DO_HOST --port=$DO_PORT --user=$DO_USER --password=$DO_PASSWORD --ssl -e "CREATE DATABASE IF NOT EXISTS naga_stall;"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Could not create database. Please create it manually in the dashboard." -ForegroundColor Red
            exit 1
        }
        Write-Host "Database created successfully!" -ForegroundColor Green
    } else {
        exit 1
    }
}

Write-Host "[Step 3/4] Database 'naga_stall' is ready!" -ForegroundColor Green

# =============================================
# STEP 5: Import database
# =============================================
Write-Host "`n[Step 4/4] Importing database to DigitalOcean..." -ForegroundColor Yellow
Write-Host "This may take a few minutes depending on database size..." -ForegroundColor Gray

$startTime = Get-Date

Get-Content $PROCESSED_FILE | & "$MYSQL_PATH\mysql.exe" --host=$DO_HOST --port=$DO_PORT --user=$DO_USER --password=$DO_PASSWORD --ssl $DO_DATABASE 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to import database!" -ForegroundColor Red
    Write-Host "Try importing manually" -ForegroundColor Yellow
    exit 1
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "SUCCESS! Database migrated to DigitalOcean!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Migration completed in: $($duration.TotalSeconds.ToString('0.00')) seconds" -ForegroundColor Cyan

# =============================================
# STEP 6: Verify migration
# =============================================
Write-Host "`n[Verification] Checking migrated tables..." -ForegroundColor Yellow

& "$MYSQL_PATH\mysql.exe" --host=$DO_HOST --port=$DO_PORT --user=$DO_USER --password=$DO_PASSWORD --ssl $DO_DATABASE -e "SHOW TABLES;"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "1. Update your application's database connection to use:" -ForegroundColor White
Write-Host "   Host: $DO_HOST" -ForegroundColor Gray
Write-Host "   Port: $DO_PORT" -ForegroundColor Gray
Write-Host "   User: $DO_USER" -ForegroundColor Gray
Write-Host "   Database: $DO_DATABASE" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update Backend/config/database.js with these credentials" -ForegroundColor White
Write-Host "3. Share the connection details with your team!" -ForegroundColor White
Write-Host ""
Write-Host "Your team can now connect to the same database!" -ForegroundColor Green
