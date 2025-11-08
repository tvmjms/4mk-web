# SAFE-DEVELOPMENT.ps1
# Comprehensive development workflow to prevent data loss

Write-Host ""
Write-Host "🛡️ SAFE DEVELOPMENT WORKFLOW" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your action:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🔒 Create backup before making changes" -ForegroundColor White
Write-Host "2. ⭐ Mark current version as stable" -ForegroundColor White  
Write-Host "3. 📋 List all backups" -ForegroundColor White
Write-Host "4. 🔄 Restore from backup" -ForegroundColor White
Write-Host "5. 🧹 Clean old backups (keep last 5)" -ForegroundColor White
Write-Host "6. 📊 Show backup status" -ForegroundColor White
Write-Host "0. ❌ Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (0-6)"

switch ($choice) {
    "1" {
        $desc = Read-Host "Describe what changes you plan to make"
        & ".\BEFORE-CHANGES.ps1" -ChangeDescription $desc
    }
    "2" {
        $feature = Read-Host "Describe the stable feature/version"
        & ".\MARK-STABLE.ps1" -FeatureDescription $feature
    }
    "3" {
        Write-Host "📋 Available backups:" -ForegroundColor Green
        Get-ChildItem -Directory -Name "BACKUP-*" | Sort-Object -Descending | ForEach-Object {
            $manifest = "$_\BACKUP-MANIFEST.json"
            if (Test-Path $manifest) {
                $info = Get-Content $manifest | ConvertFrom-Json
                Write-Host "  📁 $_ - $($info.Description)" -ForegroundColor Gray
            } else {
                Write-Host "  📁 $_" -ForegroundColor Gray
            }
        }
    }
    "4" {
        Write-Host "Available restore scripts:" -ForegroundColor Green
        Get-ChildItem -Name "RESTORE-FROM-*.ps1" | Sort-Object -Descending
        $script = Read-Host "Enter the restore script name (or press Enter to cancel)"
        if ($script -ne "") {
            & ".\$script"
        }
    }
    "5" {
        $backups = Get-ChildItem -Directory -Name "BACKUP-*" | Sort-Object -Descending
        if ($backups.Count -gt 5) {
            $toDelete = $backups[5..($backups.Count-1)]
            Write-Host "🧹 Cleaning old backups (keeping newest 5)..." -ForegroundColor Yellow
            foreach ($backup in $toDelete) {
                Write-Host "  🗑️ Deleting: $backup" -ForegroundColor Red
                Remove-Item $backup -Recurse -Force
                $restoreScript = "RESTORE-FROM-$backup.ps1"
                if (Test-Path $restoreScript) {
                    Remove-Item $restoreScript -Force
                }
            }
            Write-Host "✅ Cleanup complete!" -ForegroundColor Green
        } else {
            Write-Host "✅ No cleanup needed (5 or fewer backups)" -ForegroundColor Green
        }
    }
    "6" {
        $backups = Get-ChildItem -Directory -Name "BACKUP-*"
        $totalSize = (Get-ChildItem -Directory -Name "BACKUP-*" | Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeInMB = [math]::Round($totalSize / 1MB, 2)
        
        Write-Host "📊 Backup Status:" -ForegroundColor Green
        Write-Host "  📁 Total backups: $($backups.Count)" -ForegroundColor Gray
        Write-Host "  💾 Total size: $sizeInMB MB" -ForegroundColor Gray
        Write-Host "  📅 Newest: $($backups | Sort-Object -Descending | Select-Object -First 1)" -ForegroundColor Gray
        Write-Host "  📅 Oldest: $($backups | Sort-Object | Select-Object -First 1)" -ForegroundColor Gray
    }
    "0" {
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")