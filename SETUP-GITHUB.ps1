# SETUP-GITHUB.ps1
# Simple GitHub connection setup

Write-Host "Setting up GitHub connection..." -ForegroundColor Cyan
Write-Host "Repository: https://github.com/tvmjms/4mk-web" -ForegroundColor Green
Write-Host ""

# Try to install git via winget
Write-Host "Installing Git..." -ForegroundColor Yellow
try {
    winget install --id Git.Git -e --source winget --silent --accept-package-agreements --accept-source-agreements
    Write-Host "Git installation initiated" -ForegroundColor Green
    Write-Host "Please wait for installation to complete..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
} catch {
    Write-Host "Could not auto-install Git" -ForegroundColor Red
    Write-Host ""
    Write-Host "MANUAL INSTALLATION NEEDED:" -ForegroundColor Yellow
    Write-Host "1. Download Git from: https://git-scm.com/download/win" -ForegroundColor Gray
    Write-Host "2. Install with default settings" -ForegroundColor Gray
    Write-Host "3. Restart PowerShell" -ForegroundColor Gray
    Write-Host "4. Run this script again" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Restart PowerShell" -ForegroundColor Gray
Write-Host "2. Run: .\TEST-GITHUB-CONNECTION.ps1" -ForegroundColor Gray