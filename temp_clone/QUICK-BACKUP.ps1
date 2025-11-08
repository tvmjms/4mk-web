# QUICK-BACKUP.ps1
# Super fast backup - just run this!

$desc = Read-Host "Quick description of current state (optional)"
if ($desc -eq "") { 
    $desc = "Quick backup - $(Get-Date -Format 'HH:mm')"
}

Write-Host "⚡ Creating quick backup..." -ForegroundColor Cyan
& ".\CREATE-BACKUP.ps1" -BackupName "QUICK" -Description $desc
Write-Host "✅ Done! Continue working safely." -ForegroundColor Green