# BEFORE-CHANGES.ps1  
# Run this before making any significant changes

param(
    [string]$ChangeDescription = "Before making changes"
)

Write-Host "🛡️ SAFETY FIRST - Creating backup before changes..." -ForegroundColor Yellow
Write-Host "📝 Change: $ChangeDescription" -ForegroundColor Gray
Write-Host ""

# Create backup
& ".\CREATE-BACKUP.ps1" -BackupName "BEFORE-CHANGES" -Description $ChangeDescription

Write-Host ""
Write-Host "✅ Safety backup complete!" -ForegroundColor Green
Write-Host "🚀 You can now safely make your changes!" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 After your changes work, run: .\MARK-STABLE.ps1" -ForegroundColor Yellow