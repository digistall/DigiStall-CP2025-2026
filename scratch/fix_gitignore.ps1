# Fix .gitignore - remove corrupt null-character entries
$file = 'c:\Users\Jeno\DigiStall-CP2025-2026\.gitignore'
$content = Get-Content $file -Raw

# Split into lines
$lines = $content -split "`r`n"

# Filter out lines containing null characters and the now-redundant specific env entries
$cleaned = $lines | Where-Object {
    # Remove lines with null bytes (corrupt UTF-16 artifact)
    ($_ -notmatch [char]0) -and
    # Remove the now-redundant explicit entries already covered by .env.*
    ($_ -ne '.env.prod') -and
    ($_ -ne '.env.production') -and
    ($_ -ne 'FRONTEND/WEB/.env.production')
}

$result = $cleaned -join "`r`n"
[System.IO.File]::WriteAllText($file, $result, [System.Text.Encoding]::UTF8)
Write-Host "✅ .gitignore cleaned successfully"
Write-Host "--- Last 25 lines ---"
Get-Content $file | Select-Object -Last 25
