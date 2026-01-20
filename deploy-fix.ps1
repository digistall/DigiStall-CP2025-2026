# Fix Mobile Document Procedures on DigitalOcean

Write-Host "Deploying mobile document procedure fix to DigitalOcean..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Uploading fix script to server..." -ForegroundColor Yellow
scp C:\Users\Jeno\DigiStall-CP2025-2026\Backend\fix_mobile_procedures.mjs root@68.183.154.125:/opt/digistall/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Fix script uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to upload fix script" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Running fix script on server..." -ForegroundColor Yellow

ssh root@68.183.154.125 "cd /opt/digistall && docker cp fix_mobile_procedures.mjs digistall-backend-mobile:/app/ && docker-compose exec -T backend-mobile node /app/fix_mobile_procedures.mjs && docker-compose restart backend-mobile"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Fix applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Checking backend logs..." -ForegroundColor Yellow
    ssh root@68.183.154.125 "docker logs digistall-backend-mobile --tail 20"
    Write-Host ""
    Write-Host "Deployment complete!" -ForegroundColor Green
} else {
    Write-Host "Failed to apply fix" -ForegroundColor Red
    exit 1
}
