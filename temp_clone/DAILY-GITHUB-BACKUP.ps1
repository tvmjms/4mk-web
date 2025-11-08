# DAILY-GITHUB-BACKUP.ps1
# Easy daily backup with intuitive naming for chat interface use

param(
    [string]$SessionName = "daily-work",
    [string]$What = "development session"
)

$timestamp = Get-Date -Format "MM-dd-HH-mm"
$branchName = "$SessionName-$timestamp"
$description = "Backup: $What"

Write-Host "🚀 DAILY BACKUP TO GITHUB" -ForegroundColor Cyan
Write-Host "Session: $SessionName" -ForegroundColor Yellow
Write-Host "What: $What" -ForegroundColor Yellow
Write-Host "Branch: $branchName" -ForegroundColor Green
Write-Host ""

# Run the main GitHub backup script
& ".\GITHUB-BACKUP.ps1" -BackupName $SessionName -Description $description

Write-Host ""
Write-Host "📋 QUICK REFERENCE:" -ForegroundColor Cyan
Write-Host "To restore this session:" -ForegroundColor Gray
Write-Host "  git checkout $branchName" -ForegroundColor White
Write-Host ""
Write-Host "Common backup names you can use:" -ForegroundColor Gray
Write-Host "  .\DAILY-GITHUB-BACKUP.ps1 -SessionName 'receipt-improvements' -What 'Fixed receipt layout and email system'" -ForegroundColor White
Write-Host "  .\DAILY-GITHUB-BACKUP.ps1 -SessionName 'login-fixes' -What 'Restored authentication and UI fixes'" -ForegroundColor White
Write-Host "  .\DAILY-GITHUB-BACKUP.ps1 -SessionName 'stable-working' -What 'All features working perfectly'" -ForegroundColor White