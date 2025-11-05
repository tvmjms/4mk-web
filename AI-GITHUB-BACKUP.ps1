# AI-GITHUB-BACKUP.ps1
# Optimized for AI assistant use with your existing GitHub repo

param(
    [string]$SessionName = "ai-session",
    [string]$Description = "Backup from AI chat session"
)

$timestamp = Get-Date -Format "MMdd-HHmm"
$branchName = "$SessionName-$timestamp"

Write-Host "🤖 AI ASSISTANT GITHUB BACKUP" -ForegroundColor Magenta
Write-Host "Repository: https://github.com/tvmjms/4mk-web" -ForegroundColor Cyan
Write-Host "Session: $SessionName" -ForegroundColor Yellow
Write-Host "Branch: $branchName" -ForegroundColor Green
Write-Host ""

# Always create local backup first (works without Git)
Write-Host "📁 Creating local backup..." -ForegroundColor Yellow
$localBackup = "LOCAL-BACKUP-$branchName"
New-Item -ItemType Directory -Path $localBackup -Force | Out-Null

$items = @(
    "components", "pages", "styles", "lib", "hooks", "types", "utils",
    "package.json", "next.config.js", "next.config.ts", "tsconfig.json",
    "tailwind.config.js", "postcss.config.js", "eslint.config.mjs"
)

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "$localBackup\$item" -Recurse -Force
    }
}

Write-Host "✅ Local backup: $localBackup" -ForegroundColor Green

# Try Git backup if available
$gitSuccess = $false
try {
    git --version | Out-Null
    
    # Quick setup check
    if (-not (Test-Path ".git")) {
        git init
        git config --local user.name "4MK-AI"
        git config --local user.email "ai@4mk-web.com"
        
        # Try to add your GitHub remote
        try {
            git remote add origin https://github.com/tvmjms/4mk-web.git
        } catch {
            # Remote might already exist
        }
    }
    
    # Add changes
    git add .
    
    # Commit
    git commit -m "AI Backup: $Description ($timestamp)" -q 2>$null
    
    # Create branch
    git checkout -b $branchName 2>$null
    
    Write-Host "✅ Git branch created: $branchName" -ForegroundColor Green
    
    # Try to push (might fail on auth, that's OK)
    try {
        git push -u origin $branchName -q 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🌐 Pushed to GitHub!" -ForegroundColor Cyan
            Write-Host "🔗 https://github.com/tvmjms/4mk-web/tree/$branchName" -ForegroundColor Blue
            $gitSuccess = $true
        } else {
            throw "Push failed"
        }
    } catch {
        Write-Host "⚠️ Could not push to GitHub (authentication needed)" -ForegroundColor Yellow
        Write-Host "💡 Local Git backup is ready, GitHub push needs setup" -ForegroundColor Blue
    }
    
    # Return to main
    git checkout main 2>$null
    
} catch {
    Write-Host "ℹ️ Git not available - local backup created" -ForegroundColor Blue
}

# Create restore instructions
$restoreInstructions = @"
# RESTORE-$branchName.md
# How to restore this backup

## Option 1: Local Restore (Always Works)
``````
Copy-Item -Path '$localBackup\*' -Destination '.' -Recurse -Force
npm install
``````

## Option 2: Git Restore (If Git is set up)
``````
git checkout $branchName
npm install
``````

## Option 3: GitHub Download
1. Go to: https://github.com/tvmjms/4mk-web/tree/$branchName
2. Click "Code" → "Download ZIP"
3. Extract and replace files

## Backup Details
- **Session**: $SessionName
- **Description**: $Description
- **Created**: $timestamp
- **Branch**: $branchName
- **Local Backup**: $localBackup
"@

$restoreInstructions | Out-File "RESTORE-$branchName.md" -Encoding UTF8

Write-Host ""
Write-Host "📋 BACKUP SUMMARY:" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "Session Name: $SessionName" -ForegroundColor Gray
Write-Host "Description: $Description" -ForegroundColor Gray
Write-Host "Timestamp: $timestamp" -ForegroundColor Gray
Write-Host "Local Backup: $localBackup ✅" -ForegroundColor Gray

if ($gitSuccess) {
    Write-Host "GitHub Branch: $branchName ✅" -ForegroundColor Gray
    Write-Host "GitHub URL: https://github.com/tvmjms/4mk-web/tree/$branchName" -ForegroundColor Gray
} else {
    Write-Host "GitHub Branch: $branchName (local only)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔧 Restore Instructions: RESTORE-$branchName.md" -ForegroundColor Cyan

# For the AI assistant to easily call this
Write-Host ""
Write-Host "🤖 FOR AI ASSISTANT:" -ForegroundColor Magenta
Write-Host "Backup successful. Files preserved in:" -ForegroundColor Gray
Write-Host "- Local: $localBackup" -ForegroundColor Gray
if ($gitSuccess) {
    Write-Host "- GitHub: https://github.com/tvmjms/4mk-web/tree/$branchName" -ForegroundColor Gray
}
Write-Host "User can restore using RESTORE-$branchName.md instructions" -ForegroundColor Gray