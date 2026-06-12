# Deep source-file scan for hardcoded EmailJS keys and IDs
$root = "c:\Users\Jeno\DigiStall-CP2025-2026"
$extensions = @("*.js","*.ts","*.vue","*.jsx","*.tsx")

$hits = Get-ChildItem -Path $root -Recurse -Include $extensions |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' } |
    Select-String -Pattern 'F2fUGiyhf|sTpDE-Oq2|service_am6pozg|service_e2awvdk|template_3wccajf|template_r6kxcnh|DigiStall2025SecureKey|digistall-salt-v2|AVNS_hxkemfGwzsOdj4pbu35|ugbjrrgztjklzpuu|cacgceaskcfzuuez|0b2712c9f3b15e8d|re_gE5tMW5F|68\.183\.154\.125'

if ($hits) {
    $hits | ForEach-Object {
        Write-Host ("FILE: " + $_.Filename + "  LINE: " + $_.LineNumber)
        Write-Host ("  " + $_.Line.Trim())
        Write-Host ""
    }
} else {
    Write-Host "No raw secret literals found in JS/TS/Vue source files."
}
