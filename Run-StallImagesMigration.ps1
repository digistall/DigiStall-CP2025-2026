# =============================================
# Execute Stall Images Database Migration
# =============================================
# Description: Runs all SQL migration scripts for stall images feature
# Date: December 7, 2025
# =============================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "STALL IMAGES DATABASE MIGRATION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# MySQL Connection Settings
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$mysqlUser = "root"
$mysqlPassword = ""  # Change if you have a password
$database = "naga_stall"

# Migration scripts in order
$migrationScripts = @(
    "database\migrations\create_stall_images_table.sql",
    "database\migrations\fix_all_stall_image_references.sql"
)

# Check if MySQL is accessible
if (-not (Test-Path $mysqlPath)) {
    Write-Host "❌ ERROR: MySQL not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Please update the `$mysqlPath variable with your MySQL installation path" -ForegroundColor Yellow
    exit 1
}

# Execute each migration script
$successCount = 0
$failCount = 0

foreach ($script in $migrationScripts) {
    $scriptPath = Join-Path $PSScriptRoot $script
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "❌ Script not found: $scriptPath" -ForegroundColor Red
        $failCount++
        continue
    }
    
    Write-Host "📄 Executing: $script" -ForegroundColor Yellow
    
    try {
        if ($mysqlPassword) {
            & $mysqlPath -u $mysqlUser -p$mysqlPassword $database -e "source $scriptPath" 2>&1 | Out-Null
        } else {
            & $mysqlPath -u $mysqlUser $database -e "source $scriptPath" 2>&1 | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Success" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ Failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "MIGRATION SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your backend server" -ForegroundColor White
    Write-Host "2. Test the stall image endpoints" -ForegroundColor White
    Write-Host "3. Verify frontend displays images correctly" -ForegroundColor White
} else {
    Write-Host "⚠️  Some migrations failed. Please check the errors above." -ForegroundColor Yellow
    Write-Host "You may need to run the failed scripts manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
