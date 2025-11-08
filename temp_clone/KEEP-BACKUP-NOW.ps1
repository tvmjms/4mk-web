# KEEP-BACKUP-NOW.ps1
# Simple manual Keep backup - run this after pressing Keep

Write-Host "KEEP BACKUP STARTING..." -ForegroundColor Cyan

$time = Get-Date -Format "MMdd-HHmm"
Write-Host "Time: $time" -ForegroundColor Gray

Write-Host "Creating local backup..." -ForegroundColor Yellow
& ".\CREATE-BACKUP.ps1" -BackupName "KEEP-$time" -Description "Keep button backup"

Write-Host "Creating Git backup..." -ForegroundColor Yellow
git add .
git commit -m "Keep backup $time"
git checkout -b "keep-backup-$time"
git push -u origin "keep-backup-$time"
git checkout master

Write-Host "KEEP BACKUP COMPLETE!" -ForegroundColor Green