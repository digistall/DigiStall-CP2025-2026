# Quick Test: Verify Branch Display Fix

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Branch Display Fix Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if stored procedure exists
Write-Host "[Test 1] Checking if getAllBranchesDetailed exists..." -ForegroundColor Yellow
$procedureCheck = & "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='naga_stall' AND ROUTINE_NAME='getAllBranchesDetailed';" naga_stall 2>&1
if ($procedureCheck -match "getAllBranchesDetailed") {
    Write-Host "  ✅ Stored procedure exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ Stored procedure not found" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check if migration was applied
Write-Host "[Test 2] Checking if migration was applied..." -ForegroundColor Yellow
$migrationCheck = & "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "SELECT migration_name FROM migrations WHERE migration_name='012_fix_getAllBranchesDetailed';" naga_stall 2>&1
if ($migrationCheck -match "012_fix_getAllBranchesDetailed") {
    Write-Host "  ✅ Migration applied successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Migration not found in database" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Test the stored procedure output
Write-Host "[Test 3] Testing stored procedure output..." -ForegroundColor Yellow
Write-Host "  Running: CALL getAllBranchesDetailed()..." -ForegroundColor Gray
$output = & "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "CALL getAllBranchesDetailed();" naga_stall 2>&1

if ($output -match "branch_name" -and $output -match "manager_name") {
    Write-Host "  ✅ Stored procedure returns correct fields" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Sample output:" -ForegroundColor Gray
    Write-Host "  $($output | Select-String 'Naga City Peoples Mall')" -ForegroundColor White
} else {
    Write-Host "  ❌ Stored procedure output is incorrect" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check backend file
Write-Host "[Test 4] Checking backend controller file..." -ForegroundColor Yellow
$backendFile = "c:\Users\Jeno\DigiStall-CP2025-2026\Backend\Backend-Web\controllers\branch\branchComponents\getAllBranches.js"
if (Test-Path $backendFile) {
    $content = Get-Content $backendFile -Raw
    if ($content -match "results\[0\]") {
        Write-Host "  ✅ Backend controller has been fixed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend controller may need manual fix" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ Backend controller file not found" -ForegroundColor Red
}
Write-Host ""

# Final instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart your backend server" -ForegroundColor White
Write-Host "   - Stop with Ctrl+C" -ForegroundColor Gray
Write-Host "   - Start with: npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Refresh your browser" -ForegroundColor White
Write-Host "   - Use Ctrl+Shift+R for hard refresh" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check Branch Management page" -ForegroundColor White
Write-Host "   - Branches should now display correctly" -ForegroundColor Gray
Write-Host "   - Manager names should be visible" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
