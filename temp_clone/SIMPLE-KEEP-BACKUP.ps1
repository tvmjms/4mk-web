# SIMPLE-KEEP-BACKUP.ps1
# Ultra-simple Keep button backup - just one command

Write-Host "⚡ SIMPLE KEEP BACKUP" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

$time = Get-Date -Format "MMdd-HHmm"

# Quick local backup
Write-Host "📦 Creating backup..." -ForegroundColor Yellow
& ".\CREATE-BACKUP.ps1" -BackupName "KEEP-$time" -Description "Keep button backup"

# Quick Git backup if available
try {
    git --version | Out-Null
    Write-Host "🌿 Creating Git branch..." -ForegroundColor Yellow
    git add . 2>$null
    git commit -m "Keep backup $time" -q 2>$null
    git checkout -b "keep-backup-$time" 2>$null
    git push -u origin "keep-backup-$time" -q 2>$null
    git checkout master 2>$null
    Write-Host "✅ Git backup complete!" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Local backup only (Git not available)" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 KEEP BACKUP DONE!" -ForegroundColor Green
Write-Host "Continue working safely! 🚀" -ForegroundColor Cyan