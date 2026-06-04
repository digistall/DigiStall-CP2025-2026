# Secret Scanner - DigiStall Codebase
# Scans for hardcoded credentials in source files (excluding node_modules)

$root = "c:\Users\Jeno\DigiStall-CP2025-2026"
$extensions = @("*.js","*.ts","*.vue","*.jsx","*.tsx","*.json","*.sh","*.ps1","*.yml","*.yaml","*.md")

$patterns = @{
    "JWT/Secret literal"         = 'jtd2cIUTK5|vIFy9p6iXU'
    "DB Password literal"        = 'AVNS_hxkemfGwzsOdj4pbu35'
    "Gmail App Password"         = 'ugbjrrgztjklzpuu|cacgceaskcfzuuez'
    "Mailgun API Key"            = '0b2712c9f3b15e8d138d27b8491b1982'
    "Mailgun Public Key"         = 'pubkey-1fa2ed5c2c34d6dfae6eca1cde394f60'
    "Resend API Key"             = 're_gE5tMW5F_4CChS4m5J3gsSDvafzhVVYW2'
    "EmailJS Public Key"         = 'sTpDE-Oq2|F2fUGiyhf-FJatviG'
    "Hardcoded host (DO)"        = 'dbaas-db-2078449-do-user'
    "Hardcoded IP (production)"  = '68\.183\.154\.125'
    "process.env missing (jwt)"  = 'jwt\.sign\s*\([^,]+,\s*[''"][A-Za-z0-9]{10,}'
    "Hardcoded Bearer token"     = 'Bearer\s+[A-Za-z0-9\-_\.]{20,}'
    "Hardcoded password field"   = 'password\s*:\s*[''"][A-Za-z0-9!@#]{6,}'
}

$allFiles = Get-ChildItem -Path $root -Recurse -Include $extensions |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' }

Write-Host "`n===== HARDCODED SECRET SCAN REPORT =====" -ForegroundColor Cyan
Write-Host "Scanned path: $root" -ForegroundColor Gray
Write-Host "Total files scanned: $($allFiles.Count)`n" -ForegroundColor Gray

$foundAny = $false

foreach ($patternName in $patterns.Keys) {
    $pattern = $patterns[$patternName]
    $matches = $allFiles | Select-String -Pattern $pattern
    if ($matches) {
        $foundAny = $true
        Write-Host "[ LEAK: $patternName ]" -ForegroundColor Red
        foreach ($m in $matches) {
            Write-Host ("  FILE: " + $m.Filename) -ForegroundColor Yellow
            Write-Host ("  LINE: " + $m.LineNumber) -ForegroundColor Yellow
            Write-Host ("  CODE: " + $m.Line.Trim()) -ForegroundColor White
            Write-Host ""
        }
    }
}

if (-not $foundAny) {
    Write-Host "No hardcoded secrets found in source files." -ForegroundColor Green
}

Write-Host "===== SCAN COMPLETE =====" -ForegroundColor Cyan
