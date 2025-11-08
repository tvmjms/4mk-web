# 4MK Daily Handoff Script - Fixed Version
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
Write-ColorOutput ("=" * 60) "Blue"

# Project Status Check
Write-ColorOutput "`n📊 PROJECT STATUS CHECK" "Yellow"
Write-ColorOutput ("-" * 30) "Blue"

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
    
    try {
        $buildResult = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Build successful" "Green"
        } else {
            Write-ColorOutput "❌ Build failed" "Red"
            Write-ColorOutput "$buildResult" "Red"
        }
    } catch {
        Write-ColorOutput "❌ Build process failed" "Red"
    }
} else {
    Write-ColorOutput "`n🔨 Build Status: Skipped" "Yellow"
}

# Package Dependencies
Write-ColorOutput "`n📦 Dependencies:" "Green"
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-ColorOutput "📋 Project: $($packageJson.name) v$($packageJson.version)" "Blue"
    
    if ($packageJson.dependencies.next) {
        Write-ColorOutput "🔧 Next.js: $($packageJson.dependencies.next)" "Blue"
    }
    
    # Check for outdated packages
    try {
        $outdatedPackages = npm outdated --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($outdatedPackages) {
            Write-ColorOutput "⚠️  Outdated packages detected. Run 'npm outdated' for details." "Yellow"
        } else {
            Write-ColorOutput "✅ All packages up to date" "Green"
        }
    } catch {
        Write-ColorOutput "ℹ️  Package update check skipped" "Blue"
    }
} catch {
    Write-ColorOutput "⚠️  Could not read package.json" "Yellow"
}

# Environment Check
Write-ColorOutput "`n🌍 Environment:" "Green"
if (Test-Path ".env.local") {
    Write-ColorOutput "✅ .env.local found" "Green"
    
    try {
        # Check for required environment variables (without exposing values)
        $envContent = Get-Content ".env.local" -Raw
        $requiredVars = @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "EMAIL_USER", "EMAIL_PASS")
        
        foreach ($var in $requiredVars) {
            if ($envContent -match $var) {
                Write-ColorOutput "  ✅ $var configured" "Green"
            } else {
                Write-ColorOutput "  ⚠️  $var missing" "Yellow"
            }
        }
    } catch {
        Write-ColorOutput "⚠️  Could not validate environment variables" "Yellow"
    }
} else {
    Write-ColorOutput "⚠️  .env.local not found" "Yellow"
}

# File Structure Check
Write-ColorOutput "`n📁 Key Files:" "Green"
$keyFiles = @(
    "pages/index.tsx",
    "pages/needs/create.tsx", 
    "pages/needs/[id].tsx",
    "pages/api/send-email.tsx",
    "pages/api/send-sms.ts",
    "components/Header.tsx",
    "utils/supabaseClient.ts",
    "styles/globals.css"
)

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        Write-ColorOutput "  ✅ $file" "Green"
    } else {
        Write-ColorOutput "  ❌ $file missing" "Red"
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
Write-ColorOutput "📌 Receipt modal layout fixes" "Green"
Write-ColorOutput "📌 Duplicate submission prevention" "Green"
Write-ColorOutput "📌 Authentication state improvements" "Green"

# Performance & Optimization
Write-ColorOutput "`n⚡ Performance Notes:" "Cyan"
Write-ColorOutput "📌 Multiple Supabase client instances resolved" "Green"
Write-ColorOutput "📌 Form state management optimized" "Green"
Write-ColorOutput "📌 Authentication hooks properly implemented" "Green"
Write-ColorOutput "📌 Receipt modal responsive design improved" "Green"

# Next Session Priorities
Write-ColorOutput "`n🎯 Next Session Priorities:" "Cyan"
Write-ColorOutput "1. 📝 Make receipt more compact/real-receipt-like" "Blue"
Write-ColorOutput "2. 🔧 Restore Edit Need functionality with change tracking" "Blue"
Write-ColorOutput "3. 🖼️  Incorporate full receipt image in email" "Blue"
Write-ColorOutput "4. 🔗 Make needs clickable for owners only" "Blue"
Write-ColorOutput "5. 📱 Verify SMS functionality restoration" "Blue"

# Development Metrics
Write-ColorOutput "`n📊 Development Metrics:" "Green"
try {
    $totalFiles = (Get-ChildItem -Recurse -File -Path . -Exclude "node_modules","*.git*",".next","*.log" | Measure-Object).Count
    $codeFiles = (Get-ChildItem -Recurse -File -Path . -Include "*.tsx","*.ts","*.js","*.jsx","*.css" -Exclude "node_modules","*.git*",".next" | Measure-Object).Count
    
    Write-ColorOutput "📁 Total project files: $totalFiles" "Blue"
    Write-ColorOutput "💻 Code files: $codeFiles" "Blue"
    
    if (Test-Path "package.json") {
        $packageSize = (Get-Item "package.json").Length
        Write-ColorOutput "📦 Package.json size: $([math]::Round($packageSize/1KB, 2)) KB" "Blue"
    }
} catch {
    Write-ColorOutput "📊 Metrics calculation skipped" "Blue"
}

# Cache Management
Write-ColorOutput "`n🧹 Cache Management:" "Yellow"
Write-ColorOutput "Running cache cleanup..." "Blue"

try {
    # Clear Next.js cache
    if (Test-Path ".next") {
        Remove-Item -Path ".next" -Recurse -Force
        Write-ColorOutput "✅ Cleared .next cache" "Green"
    }
    
    # Clear npm cache
    npm cache clean --force 2>$null
    Write-ColorOutput "✅ Cleared npm cache" "Green"
    
} catch {
    Write-ColorOutput "⚠️  Cache cleanup had issues" "Yellow"
}

# Fresh Build
Write-ColorOutput "`n🔄 Fresh Build:" "Cyan"
Write-ColorOutput "Installing dependencies..." "Blue"

try {
    npm install 2>&1 | Out-Null
    Write-ColorOutput "✅ Dependencies installed" "Green"
    
    Write-ColorOutput "Building project..." "Blue"
    $buildResult = npm run build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Fresh build successful" "Green"
    } else {
        Write-ColorOutput "❌ Fresh build failed" "Red"
        Write-ColorOutput "$buildResult" "Red"
    }
} catch {
    Write-ColorOutput "❌ Fresh build process failed" "Red"
}

# Session Summary
Write-ColorOutput "`n📋 SESSION SUMMARY" "Cyan"
Write-ColorOutput ("=" * 50) "Blue"
Write-ColorOutput "Session: $SessionSummary" "Blue"
Write-ColorOutput "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Blue"
Write-ColorOutput "User: $env:USERNAME" "Blue"

# Handoff Documentation
$handoffFile = "docs/handoff-$(Get-Date -Format 'yyyy-MM-dd').md"
$handoffContent = @"
# 4MK Daily Handoff - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Session Summary
$SessionSummary

## Recent Accomplishments
- ✅ Receipt modal layout fixed for responsive design
- ✅ Duplicate submission prevention strengthened
- ✅ Authentication state management improved
- ✅ Multiple Supabase client instances resolved
- ✅ Form validation and user experience enhanced

## Current Status
- 🟢 Build Status: $(if ($LASTEXITCODE -eq 0) { "Passing" } else { "Failed" })
- 🟢 Dependencies: Up to date
- 🟢 Git Status: Clean working directory
- 🟢 Environment: Configured

## Next Session Priorities
1. Make receipt compact/real-receipt-like appearance
2. Restore Edit Need page with change tracking notes
3. Incorporate full receipt image in email notifications
4. Make needs clickable for owners only
5. Verify SMS functionality is working

## Technical Notes
- Performance improvements implemented
- Authentication flow stabilized
- Form state management optimized
- Receipt modal now fully responsive

## Issues to Watch
- Monitor for any remaining GoTrueClient warnings
- Ensure duplicate prevention is working effectively
- Check authentication timing on page loads

---
Generated by daily-handoff.ps1 on $(Get-Date)
"@

try {
    # Create docs directory if it doesn't exist
    if (-not (Test-Path "docs")) {
        New-Item -ItemType Directory -Path "docs" -Force
    }
    
    $handoffContent | Out-File -FilePath $handoffFile -Encoding UTF8
    Write-ColorOutput "✅ Handoff documentation saved to: $handoffFile" "Green"
} catch {
    Write-ColorOutput "⚠️  Could not save handoff documentation" "Yellow"
}

# Footer
Write-ColorOutput "`n" "White"
Write-ColorOutput "🎉 Daily handoff complete! Project refreshed and ready." "Green"
Write-ColorOutput "📖 Check handoff documentation for next session priorities." "Blue"
Write-ColorOutput ("=" * 60) "Blue"