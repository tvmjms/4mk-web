# KEEP.ps1
# Ultra-simple Keep backup - just run: .\KEEP.ps1

$t = Get-Date -Format "MMdd-HHmm"
Write-Host "Keep backup $t starting..." -ForegroundColor Cyan

git add .
git commit -m "Keep $t"
git checkout -b "keep-$t"  
git push origin "keep-$t"
git checkout master

Write-Host "Keep backup complete! Branch: keep-$t" -ForegroundColor Green