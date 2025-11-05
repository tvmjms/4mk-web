# CHAT-BACKUP.ps1
# Optimized for use through AI chat interface

param(
    [string]$Name = "chat-session",
    [string]$Description = "Backup from chat session"
)

Write-Host "🤖 AI CHAT BACKUP SYSTEM" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Magenta

# Quick backup without complex interactions
$timestamp = Get-Date -Format "MMdd-HHmm"
$safeName = $Name -replace '[^a-zA-Z0-9-]', '-'
$branchName = "$safeName-$timestamp"

# First, do a local backup (always works)
Write-Host "📁 Creating local backup..." -ForegroundColor Yellow
$backupDir = "CHAT-BACKUP-$branchName"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$items = @("components", "pages", "styles", "lib", "hooks", "types", "utils", "package.json", "next.config.js", "tsconfig.json")
foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "$backupDir\$item" -Recurse -Force
    }
}

Write-Host "✅ Local backup complete: $backupDir" -ForegroundColor Green

# Try Git backup if available
try {
    git --version | Out-Null
    
    # Initialize if needed
    if (-not (Test-Path ".git")) {
        git init
        git config --local user.name "4MK-AI-Assistant"
        git config --local user.email "ai@4mk.dev"
    }
    
    # Create branch and commit
    git add .
    git commit -m "AI Backup: $Description - $timestamp" -q
    
    # Try to create branch
    git checkout -b $branchName 2>$null
    
    Write-Host "✅ Git backup complete: branch '$branchName'" -ForegroundColor Green
    
    # Try to push if remote exists
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl) {
        git push -u origin $branchName -q 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🌐 Pushed to GitHub: $branchName" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️ GitHub push failed (auth needed)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️ No GitHub remote configured" -ForegroundColor Blue
    }
    
    # Return to main
    try {
        git checkout main 2>$null
    } catch {
        git checkout master 2>$null
    }
    
} catch {
    Write-Host "ℹ️ Git not available - local backup only" -ForegroundColor Blue
}

# Create simple restore command
Write-Host ""
Write-Host "🔧 TO RESTORE THIS BACKUP:" -ForegroundColor Cyan
Write-Host "  Copy-Item -Path '$backupDir\*' -Destination '.' -Recurse -Force" -ForegroundColor White
if (Test-Path ".git") {
    Write-Host "  OR: git checkout $branchName" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 BACKUP SUMMARY:" -ForegroundColor Green
Write-Host "  Name: $Name" -ForegroundColor Gray
Write-Host "  Description: $Description" -ForegroundColor Gray
Write-Host "  Branch: $branchName" -ForegroundColor Gray
Write-Host "  Local: $backupDir" -ForegroundColor Gray