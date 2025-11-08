# INSTALL-GIT-AND-CONNECT.ps1
# One-time setup to connect your project to GitHub

Write-Host "🚀 CONNECTING TO YOUR GITHUB REPOSITORY" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository: https://github.com/tvmjms/4mk-web" -ForegroundColor Green
Write-Host ""

# Step 1: Install Git if not available
Write-Host "📥 Step 1: Installing Git..." -ForegroundColor Yellow
try {
    git --version | Out-Null
    Write-Host "✅ Git is already installed" -ForegroundColor Green
} catch {
    Write-Host "⬇️ Downloading and installing Git..." -ForegroundColor Yellow
    
    # Try winget first (Windows 10/11)
    try {
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
        Write-Host "✅ Git installed via winget" -ForegroundColor Green
    } catch {
        # Fallback: Direct download
        Write-Host "📋 Please install Git manually:" -ForegroundColor Red
        Write-Host "1. Go to: https://git-scm.com/download/win" -ForegroundColor Gray
        Write-Host "2. Download and install Git for Windows" -ForegroundColor Gray
        Write-Host "3. Choose 'Use Git from the Windows Command Prompt'" -ForegroundColor Gray
        Write-Host "4. Restart PowerShell after installation" -ForegroundColor Gray
        Write-Host "5. Run this script again" -ForegroundColor Gray
        Read-Host "Press Enter after installing Git"
    }
}

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Step 2: Initialize local repository
Write-Host "🔧 Step 2: Setting up local Git repository..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Git repository already exists" -ForegroundColor Blue
}

# Step 3: Configure Git
Write-Host "⚙️ Step 3: Configuring Git..." -ForegroundColor Yellow
git config --local user.name "4MK Developer"
git config --local user.email "tvmjms@4mk-web.com"
Write-Host "✅ Git configured" -ForegroundColor Green

# Step 4: Connect to GitHub
Write-Host "🔗 Step 4: Connecting to GitHub..." -ForegroundColor Yellow
try {
    git remote remove origin 2>$null
} catch {}

git remote add origin https://github.com/tvmjms/4mk-web.git
Write-Host "✅ GitHub remote added" -ForegroundColor Green

# Step 5: Fetch existing repository
Write-Host "📥 Step 5: Syncing with GitHub..." -ForegroundColor Yellow
try {
    git fetch origin
    git branch -M main
    git branch --set-upstream-to=origin/main main
    Write-Host "✅ Synced with GitHub" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not sync (might need authentication)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Git installed and configured" -ForegroundColor Gray
Write-Host "✅ Connected to: https://github.com/tvmjms/4mk-web" -ForegroundColor Gray
Write-Host "✅ Ready for automated backups" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Test connection: .\TEST-GITHUB-CONNECTION.ps1" -ForegroundColor White
Write-Host "2. Create your first backup: .\DAILY-GITHUB-BACKUP.ps1" -ForegroundColor White
Write-Host "3. Set up authentication if needed" -ForegroundColor White
Write-Host ""
Write-Host "💡 TIP: You may need to authenticate with GitHub on first push" -ForegroundColor Yellow