$base = "c:\Users\Jeno\DigiStall-CP2025-2026\FRONTEND\MOBILE"
$files = Get-ChildItem -Path $base -Recurse -Include "*.js","*.jsx" -File | Where-Object { $_.FullName -notmatch 'node_modules|\.expo|\\android\\|\\ios\\' }
$broken = @()
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    # Match import ... from '...' and require('...')
    $matches1 = [regex]::Matches($content, "(?:import\s+.*?\s+from\s+['""])(\.{1,2}/[^'""]+)(['""])", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $matches2 = [regex]::Matches($content, "require\(\s*['""](\.\./[^'""]+|\.\/[^'""]+)['""]")
    $allImports = @()
    foreach ($m in $matches1) { $allImports += $m.Groups[1].Value }
    foreach ($m in $matches2) { $allImports += $m.Groups[1].Value }
    foreach ($importPath in $allImports) {
        $dir = $file.DirectoryName
        $resolved = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($dir, $importPath))
        # Check if file exists with various extensions
        $found = $false
        $extensions = @("", ".js", ".jsx", ".ts", ".tsx", ".json", "/index.js", "/index.jsx", "/index.ts")
        foreach ($ext in $extensions) {
            if (Test-Path "$resolved$ext") { $found = $true; break }
        }
        if (-not $found) {
            $rel = $file.FullName.Replace("$base\", "")
            $broken += [PSCustomObject]@{
                File = $rel
                Import = $importPath
                ResolvedTo = $resolved.Replace("$base\", "")
            }
        }
    }
}
Write-Output "=== BROKEN IMPORTS FOUND: $($broken.Count) ==="
foreach ($b in $broken) {
    Write-Output ""
    Write-Output "FILE: $($b.File)"
    Write-Output "  IMPORT: $($b.Import)"
    Write-Output "  RESOLVES TO: $($b.ResolvedTo)"
}
