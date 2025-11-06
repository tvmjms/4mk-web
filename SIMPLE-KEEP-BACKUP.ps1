# SIMPLE-KEEP-BACKUP.ps1
# Simple backup for Keep button - always works

param([string]$Message = "Keep button backup")

$timestamp = Get-Date -Format "MMdd-HHmm-ss"
$branchName = "backup-keep-$timestamp"

Write-Host "🤖 KEEP BUTTON BACKUP" -ForegroundColor Green
Write-Host "Branch: $branchName" -ForegroundColor Yellow

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to backup" -ForegroundColor Blue
    exit 0
}

# Create backup
git checkout -b $branchName
git add .
git commit -m "KEEP: $Message - $timestamp"
git push origin $branchName
git checkout master

Write-Host "✅ Backup complete!" -ForegroundColor Green
Write-Host "📱 Mobile: https://github.com/tvmjms/4mk-web/tree/$branchName" -ForegroundColor Cyan

# Log it
"$(Get-Date) - KEEP: $branchName - $Message" >> BACKUP-LOG.txt