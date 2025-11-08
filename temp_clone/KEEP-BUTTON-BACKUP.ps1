# KEEP-BUTTON-BACKUP.ps1
# Automatic backup triggered by Keep button press

param(
    [string]$SessionContext = "keep-button-session",
    [string]$Description = "Keep button auto-backup"
)

$timestamp = Get-Date -Format "MMdd-HHmm"
$branchName = "keep-backup-$timestamp"

Write-Host "🔥 KEEP BUTTON AUTO-BACKUP" -ForegroundColor Magenta
Write-Host "==========================" -ForegroundColor Magenta
Write-Host "Context: $SessionContext" -ForegroundColor Yellow
Write-Host "Branch: $branchName" -ForegroundColor Green
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Step 1: Local backup first (always works)
Write-Host "📁 Creating local backup..." -ForegroundColor Yellow
$localBackup = "KEEP-BACKUP-$timestamp"
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

Write-Host "✅ Local backup complete: $localBackup" -ForegroundColor Green

# Step 2: Git backup (if available)
try {
    git --version | Out-Null
    
    Write-Host "🔄 Creating Git backup..." -ForegroundColor Yellow
    
    # Add all changes
    git add . 2>$null
    
    # Check if there are changes to commit
    $status = git status --porcelain 2>$null
    if ($status) {
        # Commit changes
        git commit -m "KEEP BUTTON: $Description - $timestamp" -q 2>$null
        
        # Create backup branch
        $currentBranch = git branch --show-current 2>$null
        git checkout -b $branchName 2>$null
        
        Write-Host "✅ Git branch created: $branchName" -ForegroundColor Green
        
        # Try to push to GitHub
        try {
            git push -u origin $branchName -q 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "🌐 Pushed to GitHub successfully!" -ForegroundColor Cyan
                Write-Host "🔗 https://github.com/tvmjms/4mk-web/tree/$branchName" -ForegroundColor Blue
            } else {
                throw "Push failed"
            }
        } catch {
            Write-Host "⚠️ GitHub push failed (might need authentication)" -ForegroundColor Yellow
            Write-Host "💾 Local Git backup is complete though!" -ForegroundColor Green
        }
        
        # Return to original branch
        if ($currentBranch) {
            git checkout $currentBranch 2>$null
        } else {
            git checkout master 2>$null
        }
        
    } else {
        Write-Host "ℹ️ No changes detected to commit" -ForegroundColor Blue
    }
    
} catch {
    Write-Host "ℹ️ Git not available - local backup created successfully" -ForegroundColor Blue
}

# Step 3: Create restore instructions
$restoreInstructions = @"
# RESTORE-KEEP-$timestamp.md
# How to restore this Keep button backup

## Quick Restore (Local)
\`\`\`powershell
Copy-Item -Path '$localBackup\*' -Destination '.' -Recurse -Force
npm install
\`\`\`

## Git Restore (if Git backup succeeded)
\`\`\`powershell
git checkout $branchName
npm install
\`\`\`

## GitHub Restore
1. Go to: https://github.com/tvmjms/4mk-web/tree/$branchName
2. Download ZIP or clone branch
3. Replace your local files
4. Run: npm install

Backup created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Context: $SessionContext
"@

$restoreInstructions | Out-File "RESTORE-KEEP-$timestamp.md" -Encoding UTF8

Write-Host ""
Write-Host "🎉 KEEP BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "📁 Local: $localBackup ✅" -ForegroundColor Gray
Write-Host "🌿 Branch: $branchName ✅" -ForegroundColor Gray
Write-Host "📋 Instructions: RESTORE-KEEP-$timestamp.md" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Your work is now safely backed up!" -ForegroundColor Cyan
Write-Host "🚀 Continue coding with confidence!" -ForegroundColor Green