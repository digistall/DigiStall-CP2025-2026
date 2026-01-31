# fix-expo-metro-v2.ps1
# Fixed PowerShell script to fix Metro bundler error on Windows
# Run this from ANY directory - it will navigate to the correct path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Metro Bundler Fix Script v2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to the correct project directory
$projectPath = "C:\Users\Jeno\DigiStall-CP2025-2026\FRONTEND-RUNNER\MOBILE"

Write-Host "Navigating to: $projectPath" -ForegroundColor Yellow

if (-Not (Test-Path $projectPath)) {
    Write-Host "ERROR: Project directory not found!" -ForegroundColor Red
    Write-Host "Please verify the path: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 1: Stop any running Metro bundler
Write-Host "[1/8] Stopping any running Metro bundler..." -ForegroundColor Green
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  Done" -ForegroundColor DarkGreen

# Step 2: Remove node_modules
Write-Host "[2/8] Removing node_modules..." -ForegroundColor Green
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "  Removed node_modules" -ForegroundColor DarkGreen
} else {
    Write-Host "  node_modules not found (skipping)" -ForegroundColor DarkYellow
}

# Step 3: Remove .expo folder
Write-Host "[3/8] Removing .expo cache..." -ForegroundColor Green
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    Write-Host "  Removed .expo" -ForegroundColor DarkGreen
} else {
    Write-Host "  .expo not found (skipping)" -ForegroundColor DarkYellow
}

# Step 4: Remove package-lock.json
Write-Host "[4/8] Removing package-lock.json..." -ForegroundColor Green
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    Write-Host "  Removed package-lock.json" -ForegroundColor DarkGreen
} else {
    Write-Host "  package-lock.json not found (skipping)" -ForegroundColor DarkYellow
}

# Step 5: Clear npm cache
Write-Host "[5/8] Clearing npm cache..." -ForegroundColor Green
npm cache clean --force 2>&1 | Out-Null
Write-Host "  Cleared npm cache" -ForegroundColor DarkGreen

# Step 6: Create/Update metro.config.js
Write-Host "[6/8] Creating metro.config.js..." -ForegroundColor Green

$metroConfig = @'
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Fix for 'to' argument undefined error
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
};

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [],
};

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
'@

$metroConfig | Out-File -FilePath "metro.config.js" -Encoding UTF8 -Force
Write-Host "  Created metro.config.js" -ForegroundColor DarkGreen

# Step 7: Reinstall dependencies
Write-Host "[7/8] Reinstalling dependencies..." -ForegroundColor Green
Write-Host "  This may take several minutes, please wait..." -ForegroundColor Yellow
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Installed dependencies successfully" -ForegroundColor DarkGreen
} else {
    Write-Host "  Error installing dependencies, trying with --legacy-peer-deps..." -ForegroundColor Yellow
    npm install --legacy-peer-deps 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Installed dependencies with --legacy-peer-deps" -ForegroundColor DarkGreen
    } else {
        Write-Host "  ERROR: Could not install dependencies" -ForegroundColor Red
        Write-Host "  Please run manually: npm install" -ForegroundColor Red
        exit 1
    }
}

# Step 8: Start Expo with cleared cache
Write-Host "[8/8] Starting Expo with cleared cache..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Expo now..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop if needed" -ForegroundColor Yellow
Write-Host ""

npx expo start --clear

# If we reach here, user stopped the server
Write-Host ""
Write-Host "If the error persists, try:" -ForegroundColor Yellow
Write-Host "1. Check Node.js version: node --version (should be 18.x or 20.x)" -ForegroundColor White
Write-Host "2. Update Expo: npx expo install expo@latest" -ForegroundColor White
Write-Host "3. Check package.json for expo dependency" -ForegroundColor White