# 4MK Daily Handoff Script
# Automated daily project status and handoff documentation
# Run this script at the end of each development session

param(
    [string]$SessionSummary = "Daily development session",
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false
)

# Color formatting for output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    switch ($Color) {
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

# Header
Write-ColorOutput "🚀 4MK Daily Handoff Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm')" "Cyan"
Write-ColorOutput "=" * 60 "Blue"

# Project Status Check
Write-ColorOutput "`n📊 PROJECT STATUS CHECK" "Yellow"
Write-ColorOutput "-" * 30 "Blue"

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-ColorOutput "❌ Error: Not in 4mk-web project directory" "Red"
    Write-ColorOutput "Please run this script from the project root directory" "Red"
    exit 1
}

# Git status
Write-ColorOutput "`n📂 Git Status:" "Green"
try {
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-ColorOutput "⚠️  Uncommitted changes detected:" "Yellow"
        git status --short
    } else {
        Write-ColorOutput "✅ Working directory clean" "Green"
    }
    
    $currentBranch = git branch --show-current 2>$null
    Write-ColorOutput "📍 Current branch: $currentBranch" "Blue"
} catch {
    Write-ColorOutput "⚠️  Git not available or not a git repository" "Yellow"
}

# Build Status
if (-not $SkipBuild) {
    Write-ColorOutput "`n🔨 Build Status:" "Green"
    Write-ColorOutput "Running npm run build..." "Blue"
    
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Build successful" "Green"
    } else {
        Write-ColorOutput "❌ Build failed" "Red"
        Write-ColorOutput $buildResult "Red"
    }
} else {
    Write-ColorOutput "`n🔨 Build Status: Skipped" "Yellow"
}

# Package Dependencies
Write-ColorOutput "`n📦 Dependencies:" "Green"
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-ColorOutput "📋 Project: $($packageJson.name) v$($packageJson.version)" "Blue"
    Write-ColorOutput "🔧 Next.js: $($packageJson.dependencies.next)" "Blue"
    
    # Check for outdated packages
    $outdatedPackages = npm outdated --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($outdatedPackages) {
        Write-ColorOutput "⚠️  Outdated packages detected. Run 'npm outdated' for details." "Yellow"
    } else {
        Write-ColorOutput "✅ All packages up to date" "Green"
    }
} catch {
    Write-ColorOutput "⚠️  Could not read package.json" "Yellow"
}

# Environment Check
Write-ColorOutput "`n🌍 Environment:" "Green"
if (Test-Path ".env.local") {
    Write-ColorOutput "✅ .env.local found" "Green"
    
    # Check for required environment variables (without exposing values)
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "EMAIL_USER", "EMAIL_PASS")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            Write-ColorOutput "✅ $var configured" "Green"
        } else {
            Write-ColorOutput "⚠️  $var missing" "Yellow"
        }
    }
} else {
    Write-ColorOutput "⚠️  .env.local not found" "Yellow"
}

# Database Status
Write-ColorOutput "`n🗄️  Database Status:" "Green"
Write-ColorOutput "📋 Schema files:" "Blue"
if (Test-Path "db\schemas\public_schema.sql") {
    Write-ColorOutput "✅ public_schema.sql exists" "Green"
} else {
    Write-ColorOutput "⚠️  public_schema.sql missing" "Yellow"
}

if (Test-Path "db\migrations\add_address_fields.sql") {
    Write-ColorOutput "⚠️  Pending migration: add_address_fields.sql" "Yellow"
    Write-ColorOutput "   📝 Remember to apply this in Supabase dashboard" "Yellow"
} else {
    Write-ColorOutput "✅ No pending migrations" "Green"
}

# File Structure Check
Write-ColorOutput "`n📁 Key Files Status:" "Green"
$keyFiles = @{
    "pages/needs/create.tsx" = "Create Need page (recently redesigned)"
    "pages/index.tsx" = "Home page"
    "pages/dashboard/index.tsx" = "User dashboard"
    "lib/mailer.tsx" = "Email system"
    "utils/usStatesAndCities.ts" = "Location data"
    "lib/textSummarizer.ts" = "AI text processing"
}

foreach ($file in $keyFiles.Keys) {
    if (Test-Path $file) {
        Write-ColorOutput "✅ $file - $($keyFiles[$file])" "Green"
    } else {
        Write-ColorOutput "❌ $file - MISSING: $($keyFiles[$file])" "Red"
    }
}

# Recent Changes Summary
Write-ColorOutput "`n📝 Recent Changes (Last 24 hours):" "Green"
try {
    $recentCommits = git log --since="24 hours ago" --oneline --no-merges 2>$null
    if ($recentCommits) {
        $recentCommits | ForEach-Object { Write-ColorOutput "  📌 $_" "Blue" }
    } else {
        Write-ColorOutput "  📌 No commits in last 24 hours" "Blue"
    }
} catch {
    Write-ColorOutput "  📌 Git history not available" "Blue"
}

# Current Issues & TODOs
Write-ColorOutput "`n⚠️  Known Issues:" "Yellow"
Write-ColorOutput "📌 Database migration required for complete address functionality" "Yellow"
Write-ColorOutput "   Run this in Supabase dashboard:" "Yellow"
Write-ColorOutput "   ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS street text, ADD COLUMN IF NOT EXISTS zip_code text;" "Yellow"

Write-ColorOutput "`n✅ Recently Completed:" "Green"
Write-ColorOutput "📌 Create Need page redesigned with two-card layout" "Green"
Write-ColorOutput "📌 Dynamic city selection based on state" "Green"
Write-ColorOutput "📌 Enhanced email system with HTML support" "Green"
Write-ColorOutput "📌 AI text summarization system" "Green"
Write-ColorOutput "📌 Complete address form fields" "Green"

# Next Session Priorities
Write-ColorOutput "`n🎯 Next Session Priorities:" "Cyan"
Write-ColorOutput "1. 🔥 HIGH: Apply database migration for address fields" "Red"
Write-ColorOutput "2. 🧪 TEST: Verify complete address functionality end-to-end" "Yellow"
Write-ColorOutput "3. 🚀 DEPLOY: Production deployment with new features" "Yellow"
Write-ColorOutput "4. 📱 ENHANCE: ZIP code validation and geolocation" "Blue"

# Documentation Status
Write-ColorOutput "`n📚 Documentation:" "Green"
if (Test-Path "docs\ai-assistant-handoff.md") {
    $handoffSize = (Get-Item "docs\ai-assistant-handoff.md").Length
    Write-ColorOutput "✅ AI Handoff Document: $([math]::Round($handoffSize/1KB, 1))KB" "Green"
} else {
    Write-ColorOutput "⚠️  AI Handoff Document missing" "Yellow"
}

if (Test-Path "docs\Oct 29\session-summary.md") {
    Write-ColorOutput "✅ Latest Session Summary available" "Green"
} else {
    Write-ColorOutput "⚠️  Session summary missing" "Yellow"
}

# Performance Metrics
Write-ColorOutput "`n⚡ Performance Metrics:" "Green"
try {
    # Check build size if .next exists
    if (Test-Path ".next\static") {
        $buildSize = (Get-ChildItem ".next\static" -Recurse | Measure-Object -Property Length -Sum).Sum
        Write-ColorOutput "📊 Build size: $([math]::Round($buildSize/1MB, 2))MB" "Blue"
    }
    
    # Check page count
    $pageCount = (Get-ChildItem "pages" -Recurse -Filter "*.tsx" | Measure-Object).Count
    Write-ColorOutput "📄 Total pages: $pageCount" "Blue"
    
    # Check API routes
    $apiCount = (Get-ChildItem "pages\api" -Recurse -Filter "*.ts*" | Measure-Object).Count
    Write-ColorOutput "🔌 API routes: $apiCount" "Blue"
    
} catch {
    Write-ColorOutput "📊 Performance metrics unavailable" "Blue"
}

# Session Summary
Write-ColorOutput "`n📋 SESSION SUMMARY" "Yellow"
Write-ColorOutput "-" * 30 "Blue"
Write-ColorOutput $SessionSummary "White"

# Generate timestamp for handoff
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Footer
Write-ColorOutput "`n" "White"
Write-ColorOutput "🎯 HANDOFF COMPLETE" "Green"
Write-ColorOutput "=" * 60 "Blue"
Write-ColorOutput "📅 Session Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Blue"
Write-ColorOutput "💻 Machine: $env:COMPUTERNAME" "Blue"
Write-ColorOutput "👤 User: $env:USERNAME" "Blue"
Write-ColorOutput "📂 Directory: $(Get-Location)" "Blue"
Write-ColorOutput "`n🔗 Quick Links:" "Cyan"
Write-ColorOutput "   📖 Handoff Doc: docs\ai-assistant-handoff.md" "Blue"
Write-ColorOutput "   🎨 Create Need: http://localhost:3000/needs/create" "Blue"
Write-ColorOutput "   🏠 Home Page: http://localhost:3000" "Blue"
Write-ColorOutput "   📊 Dashboard: http://localhost:3000/dashboard" "Blue"

Write-ColorOutput "`n✨ Ready for next development session!" "Green"

# Optional: Create a quick handoff file for the day
$handoffFile = "docs\daily-handoff-$timestamp.txt"
$handoffContent = @"
4MK Daily Handoff - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
========================================

Session Summary: $SessionSummary

Build Status: $(if (-not $SkipBuild -and $LASTEXITCODE -eq 0) { "✅ Success" } elseif ($SkipBuild) { "⏭️ Skipped" } else { "❌ Failed" })

Key Status:
- Create Need page: ✅ Redesigned (Oct 29-30)
- Address system: ⚠️ Pending DB migration
- Email system: ✅ Operational
- AI summarization: ✅ Active

Critical Items:
- Database migration required for street/zip_code columns
- Apply SQL in Supabase dashboard

Next Session:
1. Apply database migration
2. Test complete address functionality
3. Production deployment preparation

Generated: $(Get-Date)
"@

try {
    New-Item -Path "docs" -ItemType Directory -Force | Out-Null
    $handoffContent | Out-File -FilePath $handoffFile -Encoding UTF8
    Write-ColorOutput "`n📝 Daily handoff saved to: $handoffFile" "Green"
} catch {
    Write-ColorOutput "`n⚠️  Could not save daily handoff file" "Yellow"
}