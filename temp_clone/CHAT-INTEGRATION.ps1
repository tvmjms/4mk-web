# CHAT-INTEGRATION.ps1
# Monitor for Keep button and trigger backup automatically
# Usage: Run this in background while working in chat

param(
    [int]$CheckInterval = 30,  # seconds between checks
    [switch]$RunOnce = $false
)

Write-Host "🤖 CHAT KEEP BUTTON MONITOR" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Magenta
Write-Host "Monitoring for Keep button presses..." -ForegroundColor Yellow
Write-Host "Check interval: $CheckInterval seconds" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
Write-Host ""

function Check-ForKeepAction {
    # Check for recent file changes (indicates Keep was pressed)
    $recentFiles = Get-ChildItem -Path "." -Recurse -File | 
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-2) -and $_.Name -like "*.tsx" -or $_.Name -like "*.ts" -or $_.Name -like "*.js" }
    
    if ($recentFiles.Count -gt 0) {
        Write-Host "📝 Recent code changes detected!" -ForegroundColor Yellow
        Write-Host "🔥 Triggering Keep backup..." -ForegroundColor Cyan
        
        # Run the backup
        & ".\KEEP-BUTTON-BACKUP.ps1" -SessionContext "chat-monitor" -Description "Auto-detected Keep action"
        
        Write-Host "✅ Auto-backup complete!" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    return $false
}

if ($RunOnce) {
    Check-ForKeepAction
} else {
    # Continuous monitoring
    while ($true) {
        try {
            $detected = Check-ForKeepAction
            if (-not $detected) {
                Write-Host "⏱️ $(Get-Date -Format 'HH:mm:ss') - Monitoring..." -ForegroundColor DarkGray
            }
            Start-Sleep -Seconds $CheckInterval
        } catch {
            Write-Host "❌ Error in monitoring: $($_.Exception.Message)" -ForegroundColor Red
            Start-Sleep -Seconds 5
        }
    }
}

Write-Host "🛑 Monitoring stopped." -ForegroundColor Gray