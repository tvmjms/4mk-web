# CHAT-INTEGRATION.ps1
# Integration with AI chat interface for automatic backups

# This script can be called by the AI assistant whenever you press "Keep"
# or when significant changes are detected

param(
    [string]$TriggerType = "keep",
    [string]$SessionDescription = "",
    [switch]$AutoMode = $false
)

$timestamp = Get-Date -Format "MMdd-HHmm"

switch ($TriggerType.ToLower()) {
    "keep" {
        Write-Host "🤖 AI CHAT: Keep button detected" -ForegroundColor Magenta
        $desc = if ($SessionDescription) { $SessionDescription } else { "Chat session progress saved" }
        & ".\KEEP-BUTTON-BACKUP.ps1" -Message $desc
    }
    
    "session" {
        Write-Host "🤖 AI CHAT: End of session backup" -ForegroundColor Magenta
        $branchName = "backup-session-$timestamp"
        
        git checkout -b $branchName
        git add .
        git commit -m "AI Session: $SessionDescription - $timestamp"
        git push origin $branchName
        git checkout master
        
        Write-Host "✅ Session backup: $branchName" -ForegroundColor Green
    }
    
    "feature" {
        Write-Host "🤖 AI CHAT: Feature completion backup" -ForegroundColor Magenta
        $branchName = "backup-feature-$timestamp"
        
        git checkout -b $branchName
        git add .
        git commit -m "Feature: $SessionDescription - $timestamp"
        git push origin $branchName
        git checkout master
        
        Write-Host "✅ Feature backup: $branchName" -ForegroundColor Green
    }
    
    "stable" {
        Write-Host "🤖 AI CHAT: Stable version backup" -ForegroundColor Magenta
        $branchName = "backup-stable-$timestamp"
        
        git checkout -b $branchName
        git add .
        git commit -m "STABLE: $SessionDescription - $timestamp"
        git push origin $branchName
        git checkout master
        
        Write-Host "⭐ Stable backup: $branchName" -ForegroundColor Green
        
        # Also tag as a release point
        git tag -a "stable-$timestamp" -m "Stable release: $SessionDescription"
        git push origin "stable-$timestamp"
    }
    
    default {
        Write-Host "❓ Unknown trigger: $TriggerType" -ForegroundColor Yellow
        & ".\KEEP-BUTTON-BACKUP.ps1" -Message "Unknown trigger backup"
    }
}

# Update backup log
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $TriggerType BACKUP: $SessionDescription"
$logEntry | Out-File "BACKUP-LOG.txt" -Append -Encoding UTF8