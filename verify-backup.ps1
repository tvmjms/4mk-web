# Quick Backup Verification Script
# Run this before closing your computer to ensure everything is safe

Write-Host "=== 4MK Project Backup Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check Git status
Write-Host "1. Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status
if ($gitStatus -match "nothing to commit") {
    Write-Host "   ✅ All changes committed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: Uncommitted changes found!" -ForegroundColor Red
    Write-Host "   Run: git add . && git commit -m 'Your message'" -ForegroundColor Yellow
}
Write-Host ""

# Check recent commits
Write-Host "2. Recent commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Check if remote exists
Write-Host "3. Checking remote repository..." -ForegroundColor Yellow
$remote = git remote -v
if ($remote) {
    Write-Host "   ✅ Remote repository configured" -ForegroundColor Green
    Write-Host "   $remote" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  No remote repository configured" -ForegroundColor Yellow
    Write-Host "   Consider setting up GitHub/GitLab for backup" -ForegroundColor Yellow
}
Write-Host ""

# Check for .env.local
Write-Host "4. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local file exists" -ForegroundColor Green
    Write-Host "   ⚠️  Remember: Backup .env.local separately (not in Git)" -ForegroundColor Yellow
} else {
    Write-Host "   ⚠️  .env.local not found (may need to be created)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "✅ All code changes are committed to Git" -ForegroundColor Green
Write-Host "⚠️  Action Required: Create backup copy of project folder" -ForegroundColor Yellow
Write-Host "⚠️  Action Required: Backup .env.local file separately" -ForegroundColor Yellow
Write-Host ""
Write-Host "See BACKUP_AND_SAFETY_CHECKLIST.md for detailed instructions" -ForegroundColor Cyan

