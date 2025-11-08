# MARK-STABLE.ps1
# Mark current state as stable after successful changes

param(
    [string]$FeatureDescription = "Stable version"
)

Write-Host "⭐ Marking current version as STABLE..." -ForegroundColor Green
Write-Host "📝 Feature: $FeatureDescription" -ForegroundColor Gray
Write-Host ""

# Create stable backup
& ".\CREATE-BACKUP.ps1" -BackupName "STABLE" -Description "STABLE: $FeatureDescription"

# Update the main stable restore script to point to this new backup
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$newStableBackup = "BACKUP-STABLE-$timestamp"

Write-Host ""
Write-Host "✅ Stable version marked!" -ForegroundColor Green
Write-Host "📁 Backup: $newStableBackup" -ForegroundColor Gray
Write-Host "🔧 Use restore script to restore this version" -ForegroundColor Cyan