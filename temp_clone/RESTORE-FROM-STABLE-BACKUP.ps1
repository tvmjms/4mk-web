# RESTORE-FROM-STABLE-BACKUP.ps1
# Run this script to restore from the stable backup

$ErrorActionPreference = "Stop"
$backupDir = "BACKUP-STABLE-2025-11-03-1251"

Write-Host " Restoring from stable backup..." -ForegroundColor Yellow
Write-Host "  This will overwrite current files!" -ForegroundColor Red
$confirm = Read-Host "Continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host " Restore cancelled" -ForegroundColor Red
    exit
}

Write-Host " Copying files from backup..." -ForegroundColor Green
Copy-Item -Path "$backupDir\*" -Destination "." -Recurse -Force -Exclude "README-BACKUP.md"

Write-Host " Installing dependencies..." -ForegroundColor Green  
npm install

Write-Host " Running type check..." -ForegroundColor Green
npx tsc --noEmit

Write-Host "  Testing build..." -ForegroundColor Green
npm run build

Write-Host " Restore completed successfully!" -ForegroundColor Green
Write-Host " Run 'npm run dev' to start development server" -ForegroundColor Cyan
