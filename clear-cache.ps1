# 4MK Cache Cleaning Script
# Comprehensive cleanup of all Next.js and npm caches

Write-Host "🧹 4MK Cache Cleaning Script" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Blue

# Stop any running development servers
Write-Host "`n🛑 Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean Next.js build cache
Write-Host "`n🗂️  Cleaning Next.js build cache..." -ForegroundColor Green
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next directory not found (already clean)" -ForegroundColor Blue
}

# Clean npm cache
Write-Host "`n📦 Cleaning npm cache..." -ForegroundColor Green
npm cache clean --force
Write-Host "✅ npm cache cleaned" -ForegroundColor Green

# Clean node_modules (optional - uncommment if needed)
# Write-Host "`n📚 Removing node_modules..." -ForegroundColor Yellow
# if (Test-Path "node_modules") {
#     Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
#     Write-Host "✅ Removed node_modules" -ForegroundColor Green
#     Write-Host "📥 Reinstalling dependencies..." -ForegroundColor Yellow
#     npm install
# }

# Clean TypeScript cache
Write-Host "`n📝 Cleaning TypeScript cache..." -ForegroundColor Green
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
    Write-Host "✅ Removed TypeScript build cache" -ForegroundColor Green
}

# Clean ESLint cache
Write-Host "`n🔍 Cleaning ESLint cache..." -ForegroundColor Green
if (Test-Path ".eslintcache") {
    Remove-Item .eslintcache -ErrorAction SilentlyContinue
    Write-Host "✅ Removed ESLint cache" -ForegroundColor Green
}

# Clean temporary files
Write-Host "`n🗑️  Cleaning temporary files..." -ForegroundColor Green
Get-ChildItem -Path . -Recurse -Name "*.tmp" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Recurse -Name "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "✅ Temporary files cleaned" -ForegroundColor Green

# Clean Vercel cache (if exists)
Write-Host "`n☁️  Cleaning Vercel cache..." -ForegroundColor Green
if (Test-Path ".vercel") {
    Remove-Item -Recurse -Force .vercel\.cache -ErrorAction SilentlyContinue
    Write-Host "✅ Vercel cache cleaned" -ForegroundColor Green
}

Write-Host "`n✨ Cache cleaning complete!" -ForegroundColor Green
Write-Host "🚀 Ready for fresh build. Run 'npm run dev' or 'npm run build'" -ForegroundColor Cyan