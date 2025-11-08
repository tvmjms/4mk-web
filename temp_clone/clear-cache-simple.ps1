# 4MK Simple Cache Clear
# Quick cache cleanup for daily use

Write-Host "🧹 Quick Cache Clean" -ForegroundColor Cyan

# Remove Next.js build
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Write-Host "✅ .next cleared" -ForegroundColor Green

# Clean npm cache
npm cache clean --force 2>$null
Write-Host "✅ npm cache cleared" -ForegroundColor Green

Write-Host "✨ Quick clean complete!" -ForegroundColor Green