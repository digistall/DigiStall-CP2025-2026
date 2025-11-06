# ==========================================
# Branch Procedures Fix Verification Script
# ==========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Branch Procedures Fix Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$database = "naga_stall"
$user = "root"

# Test 1: Verify createBranch has 8 parameters (including status)
Write-Host "[Test 1] Checking createBranch procedure parameters..." -ForegroundColor Yellow
$query1 = @"
SELECT COUNT(*) as param_count 
FROM information_schema.PARAMETERS 
WHERE SPECIFIC_NAME = 'createBranch' 
AND SPECIFIC_SCHEMA = '$database'
"@

$result1 = & $mysqlPath -u $user $database -se $query1
if ($result1 -eq 8) {
    Write-Host "  ✅ createBranch has 8 parameters (includes status)" -ForegroundColor Green
} else {
    Write-Host "  ❌ createBranch has $result1 parameters (expected 8)" -ForegroundColor Red
}

# Test 2: Verify status parameter exists
Write-Host "`n[Test 2] Checking if status parameter exists..." -ForegroundColor Yellow
$query2 = @"
SELECT PARAMETER_NAME 
FROM information_schema.PARAMETERS 
WHERE SPECIFIC_NAME = 'createBranch' 
AND SPECIFIC_SCHEMA = '$database' 
AND PARAMETER_NAME = 'p_status'
"@

$result2 = & $mysqlPath -u $user $database -se $query2
if ($result2 -eq "p_status") {
    Write-Host "  ✅ Status parameter exists in createBranch" -ForegroundColor Green
} else {
    Write-Host "  ❌ Status parameter NOT found in createBranch" -ForegroundColor Red
}

# Test 3: Verify deleteBranch has hard delete logic
Write-Host "`n[Test 3] Checking deleteBranch procedure for hard delete..." -ForegroundColor Yellow
$query3 = @"
SHOW CREATE PROCEDURE deleteBranch
"@

$result3 = & $mysqlPath -u $user $database -se $query3
if ($result3 -like "*DELETE FROM branch*" -and $result3 -notlike "*UPDATE branch SET status*") {
    Write-Host "  ✅ deleteBranch performs HARD DELETE" -ForegroundColor Green
} else {
    Write-Host "  ❌ deleteBranch still performs soft delete" -ForegroundColor Red
}

# Test 4: Verify migration was recorded
Write-Host "`n[Test 4] Checking if migration was recorded..." -ForegroundColor Yellow
$query4 = @"
SELECT migration_name 
FROM migrations 
WHERE migration_name = '013_fix_branch_procedures'
"@

$result4 = & $mysqlPath -u $user $database -se $query4
if ($result4 -eq "013_fix_branch_procedures") {
    Write-Host "  ✅ Migration recorded successfully" -ForegroundColor Green
} else {
    Write-Host "  ❌ Migration NOT recorded" -ForegroundColor Red
}

# Test 5: Count current branches
Write-Host "`n[Test 5] Checking current branches in database..." -ForegroundColor Yellow
$query5 = @"
SELECT branch_id, branch_name, status 
FROM branch 
ORDER BY branch_id
"@

Write-Host "  Current branches:" -ForegroundColor Cyan
& $mysqlPath -u $user $database -e $query5

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Restart your backend server" -ForegroundColor White
Write-Host "   - Stop with Ctrl+C" -ForegroundColor Gray
Write-Host "   - Start with: npm start" -ForegroundColor Gray

Write-Host "`n2. Test Branch Creation" -ForegroundColor White
Write-Host "   - Create a new branch with status selection" -ForegroundColor Gray
Write-Host "   - Status should be saved correctly" -ForegroundColor Gray

Write-Host "`n3. Test Branch Deletion" -ForegroundColor White
Write-Host "   - Delete a test branch" -ForegroundColor Gray
Write-Host "   - Branch should be COMPLETELY REMOVED from database" -ForegroundColor Gray
Write-Host "   - Refresh browser - branch should not reappear" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan
