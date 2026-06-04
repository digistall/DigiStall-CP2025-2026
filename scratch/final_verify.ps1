# Final verification scan — confirms no raw literals in source files
$hits = Get-ChildItem -Path 'c:\Users\Jeno\DigiStall-CP2025-2026' -Recurse -Include '*.js','*.ts','*.vue','*.jsx','*.tsx' |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' -and $_.FullName -notmatch '\\scratch\\' -and $_.FullName -notmatch '\\dist\\' } |
    Select-String -Pattern 'service_am6pozg|template_3wccajf|F2fUGiyhf|DigiStall2025SecureKey|digistall-salt-v2|fallback_secret'

if ($hits) {
    Write-Host '⚠️  REMAINING LITERALS FOUND:' -ForegroundColor Red
    $hits | ForEach-Object { Write-Host ($_.Filename + ':' + $_.LineNumber + '  ' + $_.Line.Trim()) }
} else {
    Write-Host '✅ Clean! No hardcoded EmailJS keys or encryption fallbacks found in source files.' -ForegroundColor Green
}
