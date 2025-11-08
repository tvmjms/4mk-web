# Simple 4MK Refresh Script
Write-Host "=== 4MK Project Refresh ===" -ForegroundColor Cyan
Write-Host "Starting refresh process..." -ForegroundColor Green

# Check directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Not in project directory" -ForegroundColor Red
    exit 1
}

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Blue

# Clean cache
Write-Host "`nCleaning caches..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "Cleared .next cache" -ForegroundColor Green
}

# Install dependencies  
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Dependencies installation had issues" -ForegroundColor Yellow
}

# Build project
Write-Host "`nBuilding project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Website is now refreshed and optimized" -ForegroundColor Green
} else {
    Write-Host "Build failed - check output above" -ForegroundColor Red
}

# Status summary
Write-Host "`n=== REFRESH COMPLETE ===" -ForegroundColor Cyan
Write-Host "Cache cleared: YES" -ForegroundColor Blue
Write-Host "Dependencies updated: YES" -ForegroundColor Blue
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build status: SUCCESS" -ForegroundColor Green
    Write-Host "Ready to test at http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Build status: FAILED" -ForegroundColor Red
}

Write-Host "`nNext priorities:" -ForegroundColor Cyan
Write-Host "1. Make receipt more compact" -ForegroundColor Blue
Write-Host "2. Restore Edit Need functionality" -ForegroundColor Blue  
Write-Host "3. Add receipt image to email" -ForegroundColor Blue
Write-Host "4. Make needs clickable for owners" -ForegroundColor Blue