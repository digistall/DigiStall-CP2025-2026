# ===================================================
# DigitalOcean Database Migration - Alternative Method
# ===================================================
# This script uses mysqldump format compatible with cloud import
# ===================================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "DigitalOcean Database Migration (Manual)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$SQL_FILE = "naga_stall.sql"
$CLOUD_READY_FILE = "naga_stall_cloud_ready.sql"

Write-Host "`n[Step 1/2] Processing SQL file for cloud compatibility..." -ForegroundColor Yellow

# Read and process the SQL file
$content = Get-Content -Path $SQL_FILE -Raw -Encoding UTF8

# Remove DEFINER clauses
$content = $content -replace "DEFINER=\`[^\`]+\`@\`[^\`]+\`\s*", ""

# Remove problematic SQL_MODE
$content = $content -replace 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";', '-- SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";'

# Save processed file
$content | Set-Content -Path $CLOUD_READY_FILE -Encoding UTF8

Write-Host "[SUCCESS] Cloud-ready SQL file created: $CLOUD_READY_FILE" -ForegroundColor Green

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS - Import via DigitalOcean Web UI:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://cloud.digitalocean.com/databases" -ForegroundColor White
Write-Host ""
Write-Host "2. Click on 'dbaas-db-2078449'" -ForegroundColor White
Write-Host ""
Write-Host "3. Go to 'Users & Databases' tab" -ForegroundColor White
Write-Host "   - Click 'Add Database'" -ForegroundColor White
Write-Host "   - Name it 'naga_stall' and click Create" -ForegroundColor White
Write-Host ""
Write-Host "4. Connect via MySQL client:" -ForegroundColor White
Write-Host "   Download MySQL Workbench or use the web console:" -ForegroundColor Gray
Write-Host "   - Install from: https://dev.mysql.com/downloads/workbench/" -ForegroundColor Gray
Write-Host ""
Write-Host "   Connection details:" -ForegroundColor Yellow
Write-Host "   Host: dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com" -ForegroundColor Gray
Write-Host "   Port: 25060" -ForegroundColor Gray
Write-Host "   User: doadmin" -ForegroundColor Gray
Write-Host "   Password: AVNS_1pEaBjecDIyx_K1wgJ7" -ForegroundColor Gray
Write-Host "   Database: naga_stall" -ForegroundColor Gray
Write-Host "   SSL: Required" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Import the file:" -ForegroundColor White
Write-Host "   File to import: $((Get-Location).Path)\$CLOUD_READY_FILE" -ForegroundColor Gray
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "OR - Use Cloud Console (Easier):" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. In DigitalOcean database page, click 'Access' > 'Web Console'" -ForegroundColor White
Write-Host "2. Select database 'naga_stall' from dropdown" -ForegroundColor White
Write-Host "3. Copy and paste the contents of: $CLOUD_READY_FILE" -ForegroundColor White
Write-Host "   (You may need to split into smaller chunks if file is large)" -ForegroundColor Gray
Write-Host ""
Write-Host "File is ready at: $((Get-Location).Path)\$CLOUD_READY_FILE" -ForegroundColor Cyan
