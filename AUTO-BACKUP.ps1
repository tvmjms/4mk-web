# AUTO-BACKUP.ps1
# Automatic backup system - runs every few minutes

param(
    [string]$Type = "auto",
    [switch]$Silent = $false
)

$timestamp = Get-Date -Format "MMdd-HHmm"
$branchName = "backup-$Type-$timestamp"

if (-not $Silent) {
    Write-Host "🔄 Auto-backup: $branchName" -ForegroundColor Cyan
}

# Check if there are changes to backup
$status = git status --porcelain
if (-not $status) {
    if (-not $Silent) {
        Write-Host "ℹ️ No changes to backup" -ForegroundColor Blue
    }
    exit 0
}

try {
    # Create backup branch
    git checkout -b $branchName 2>$null
    
    # Add and commit
    git add . 2>$null
    git commit -m "Auto-backup: $Type - $timestamp" -q 2>$null
    
    # Push to GitHub
    git push origin $branchName -q 2>$null
    
    # Return to master
    git checkout master 2>$null
    
    if (-not $Silent) {
        Write-Host "✅ Auto-backup complete: $branchName" -ForegroundColor Green
    }
    
} catch {
    if (-not $Silent) {
        Write-Host "⚠️ Auto-backup failed (continuing work)" -ForegroundColor Yellow
    }
}