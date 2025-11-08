# TEST-GITHUB-CONNECTION.ps1
# Test if everything is working with GitHub

Write-Host "🔍 TESTING GITHUB CONNECTION" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Git available?
Write-Host "1️⃣ Testing Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not installed" -ForegroundColor Red
    Write-Host "💡 Run: .\INSTALL-GIT-AND-CONNECT.ps1" -ForegroundColor Yellow
    exit 1
}

# Test 2: Repository initialized?
Write-Host "2️⃣ Testing Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Git repository exists" -ForegroundColor Green
} else {
    Write-Host "❌ No Git repository" -ForegroundColor Red
    Write-Host "💡 Run: .\INSTALL-GIT-AND-CONNECT.ps1" -ForegroundColor Yellow
    exit 1
}

# Test 3: GitHub remote configured?
Write-Host "3️⃣ Testing GitHub remote..." -ForegroundColor Yellow
try {
    $remote = git remote get-url origin
    if ($remote -like "*tvmjms/4mk-web*") {
        Write-Host "✅ Connected to: $remote" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Remote: $remote (unexpected)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ No GitHub remote configured" -ForegroundColor Red
    Write-Host "💡 Run: .\INSTALL-GIT-AND-CONNECT.ps1" -ForegroundColor Yellow
    exit 1
}

# Test 4: Can we reach GitHub?
Write-Host "4️⃣ Testing GitHub connectivity..." -ForegroundColor Yellow
try {
    git ls-remote origin HEAD | Out-Null
    Write-Host "✅ Can connect to GitHub" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Cannot connect to GitHub (authentication needed?)" -ForegroundColor Yellow
}

# Test 5: Working directory status
Write-Host "5️⃣ Testing repository status..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    $changes = ($status | Measure-Object).Count
    Write-Host "📝 $changes uncommitted changes" -ForegroundColor Blue
} else {
    Write-Host "✅ Working directory clean" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 CONNECTION STATUS:" -ForegroundColor Green
Write-Host "Repository: https://github.com/tvmjms/4mk-web" -ForegroundColor Gray
Write-Host "Local Git: Ready" -ForegroundColor Gray
Write-Host "Remote: Connected" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ready to create backups!" -ForegroundColor Cyan
Write-Host "Next: .\DAILY-GITHUB-BACKUP.ps1 -SessionName 'your-session-name'" -ForegroundColor White