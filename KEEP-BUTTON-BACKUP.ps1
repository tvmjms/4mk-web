# KEEP-BUTTON-BACKUP.ps1
# Automatic backup triggered by "Keep" button in AI chat

param(
    [string]$Message = "AI Chat Keep Button Backup",
    [switch]$Silent = $false
)

# Generate timestamp for unique branch name
$timestamp = Get-Date -Format "MMdd-HHmm-ss"
$branchName = "backup-keep-$timestamp"

if (-not $Silent) {
    Write-Host "🔄 KEEP BUTTON TRIGGERED BACKUP" -ForegroundColor Green
    Write-Host "Creating branch: $branchName" -ForegroundColor Yellow
}

try {
    # Check if there are any changes to backup
    $status = git status --porcelain
    if (-not $status) {
        if (-not $Silent) {
            Write-Host "ℹ️ No changes detected - backup skipped" -ForegroundColor Blue
        }
        exit 0
    }

    # Step 1: Create new branch from current state
    git checkout -b $branchName 2>$null
    
    # Step 2: Add all changes
    git add . 2>$null
    
    # Step 3: Commit with timestamp and message
    $commitMessage = "KEEP: $Message - $timestamp"
    git commit -m $commitMessage -q 2>$null
    
    # Step 4: Push to GitHub
    git push origin $branchName -q 2>$null
    
    # Step 5: Return to master branch
    git checkout master 2>$null
    
    if (-not $Silent) {
        Write-Host "✅ BACKUP COMPLETE!" -ForegroundColor Green
        Write-Host "📱 Check mobile: https://github.com/tvmjms/4mk-web/tree/$branchName" -ForegroundColor Cyan
    }
    
    # Log the backup for tracking
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - KEEP BACKUP: $branchName - $Message"
    $logEntry | Out-File "BACKUP-LOG.txt" -Append -Encoding UTF8
    
    return $branchName
    
} catch {
    if (-not $Silent) {
        Write-Host "⚠️ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Try to return to master even if backup failed
    git checkout master 2>$null
    return $null
}