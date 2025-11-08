# GITHUB-BACKUP.ps1
# Automated GitHub backup with branch creation

param(
    [string]$BackupName = "daily-backup",
    [string]$Description = "Automated backup",
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 GitHub Auto-Backup System" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if git is available
try {
    git --version | Out-Null
    Write-Host "✅ Git is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "📥 Installing Git..." -ForegroundColor Yellow
    
    # Try to install git via winget or provide instructions
    try {
        winget install --id Git.Git -e --source winget --silent
        Write-Host "✅ Git installed successfully" -ForegroundColor Green
        Write-Host "🔄 Please restart PowerShell and run this script again" -ForegroundColor Yellow
        exit
    } catch {
        Write-Host "❌ Could not auto-install Git" -ForegroundColor Red
        Write-Host "📋 Please install Git manually:" -ForegroundColor Yellow
        Write-Host "   1. Download from: https://git-scm.com/download/win" -ForegroundColor Gray
        Write-Host "   2. Install with default options" -ForegroundColor Gray
        Write-Host "   3. Restart PowerShell" -ForegroundColor Gray
        Write-Host "   4. Run this script again" -ForegroundColor Gray
        exit 1
    }
}

# Generate timestamp and branch name
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$branchName = "backup/$BackupName-$timestamp"
$commitMessage = "$Description - $timestamp"

Write-Host "📅 Timestamp: $timestamp" -ForegroundColor Gray
Write-Host "🌿 Branch: $branchName" -ForegroundColor Gray
Write-Host "💬 Message: $commitMessage" -ForegroundColor Gray
Write-Host ""

# Initialize git repo if needed
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git config --local user.name "4MK Developer"
    git config --local user.email "developer@4mk.local"
}

# Add GitHub remote if not exists (you'll need to provide your repo URL)
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    Write-Host "🔗 GitHub remote not configured" -ForegroundColor Yellow
    Write-Host "📋 To connect to GitHub:" -ForegroundColor Yellow
    Write-Host "   1. Create a GitHub repository" -ForegroundColor Gray
    Write-Host "   2. Run: git remote add origin https://github.com/yourusername/yourrepo.git" -ForegroundColor Gray
    Write-Host "   3. Run this script again" -ForegroundColor Gray
    
    $repoUrl = Read-Host "Enter GitHub repository URL (or press Enter to skip)"
    if ($repoUrl -ne "") {
        git remote add origin $repoUrl
        Write-Host "✅ GitHub remote added" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Continuing with local backup only" -ForegroundColor Yellow
    }
}

# Create and switch to backup branch
Write-Host "🌿 Creating backup branch: $branchName" -ForegroundColor Yellow
try {
    git checkout -b $branchName 2>$null
    Write-Host "✅ Branch created and switched" -ForegroundColor Green
} catch {
    if ($Force) {
        git branch -D $branchName 2>$null
        git checkout -b $branchName
        Write-Host "✅ Branch recreated (forced)" -ForegroundColor Green
    } else {
        Write-Host "❌ Branch already exists. Use -Force to overwrite" -ForegroundColor Red
        exit 1
    }
}

# Add all files
Write-Host "📂 Adding files to backup..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMessage
    Write-Host "✅ Changes committed" -ForegroundColor Green
    
    # Push to GitHub if remote exists
    if ($remoteExists -or (git remote get-url origin 2>$null)) {
        Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
        try {
            git push -u origin $branchName
            Write-Host "✅ Backup pushed to GitHub successfully!" -ForegroundColor Green
            Write-Host "🌐 Branch URL: https://github.com/[username]/[repo]/tree/$branchName" -ForegroundColor Cyan
        } catch {
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
            Write-Host "💡 You may need to authenticate with GitHub" -ForegroundColor Yellow
            Write-Host "   Run: gh auth login (if GitHub CLI is installed)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️ No GitHub remote configured - backup saved locally only" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "ℹ️ No changes to commit" -ForegroundColor Blue
}

# Switch back to main branch
Write-Host "🔄 Switching back to main branch..." -ForegroundColor Yellow
git checkout main 2>$null || git checkout master 2>$null || git checkout -b main

Write-Host ""
Write-Host "🎉 Backup complete!" -ForegroundColor Green
Write-Host "📁 Branch: $branchName" -ForegroundColor Gray
Write-Host "💾 Local backup: Available" -ForegroundColor Gray
if ($remoteExists -or (git remote get-url origin 2>$null)) {
    Write-Host "🌐 GitHub backup: Available" -ForegroundColor Gray
}

# Create local restore script
$restoreScript = @"
# RESTORE-GITHUB-$BackupName-$timestamp.ps1
# Restore from GitHub branch: $branchName

Write-Host "🔄 Restoring from GitHub branch: $branchName"
git fetch origin
git checkout $branchName
git checkout -b restore-$timestamp
npm install
Write-Host "✅ Restore complete!"
Write-Host "🔄 To return to main: git checkout main"
"@

$restoreScript | Out-File "RESTORE-GITHUB-$BackupName-$timestamp.ps1" -Encoding UTF8

Write-Host "🔧 Restore script created: RESTORE-GITHUB-$BackupName-$timestamp.ps1" -ForegroundColor Cyan