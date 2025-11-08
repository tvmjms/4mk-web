# CREATE-BACKUP.ps1
# Comprehensive backup system to prevent data loss

param(
    [string]$BackupName = "",
    [string]$Description = ""
)

$ErrorActionPreference = "Stop"

# Generate timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"

# Create backup name
if ($BackupName -eq "") {
    $BackupName = "BACKUP-$timestamp"
} else {
    $BackupName = "BACKUP-$BackupName-$timestamp"
}

$backupDir = $BackupName

Write-Host "🔄 Creating backup: $BackupName" -ForegroundColor Cyan

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Files and folders to backup
$itemsToBackup = @(
    "components", "pages", "styles", "lib", "hooks", "types", "utils",
    "package.json", "next.config.js", "next.config.ts", "tsconfig.json",
    "tailwind.config.js", "postcss.config.js", "eslint.config.mjs",
    "README.md"
)

# Copy each item
foreach ($item in $itemsToBackup) {
    if (Test-Path $item) {
        Write-Host "📁 Backing up: $item" -ForegroundColor Green
        Copy-Item -Path $item -Destination "$backupDir\$item" -Recurse -Force
    }
}

# Create backup manifest
$manifest = @{
    BackupName = $BackupName
    Timestamp = $timestamp  
    Description = $Description
    CreatedBy = $env:USERNAME
    Items = $itemsToBackup
    FileCount = (Get-ChildItem -Path $backupDir -Recurse -File).Count
}

$manifest | ConvertTo-Json -Depth 3 | Out-File "$backupDir\BACKUP-MANIFEST.json"

# Create restore script for this specific backup
$restoreScript = @"
# RESTORE-FROM-$BackupName.ps1
# Auto-generated restore script

`$ErrorActionPreference = "Stop"
`$backupDir = "$BackupName"

Write-Host "🔄 Restoring from backup: $BackupName" -ForegroundColor Yellow
Write-Host "📅 Created: $timestamp" -ForegroundColor Gray
Write-Host "📝 Description: $Description" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  This will overwrite current files!" -ForegroundColor Red
`$confirm = Read-Host "Continue? (y/N)"

if (`$confirm -ne "y" -and `$confirm -ne "Y") {
    Write-Host "❌ Restore cancelled" -ForegroundColor Red
    exit
}

Write-Host "📂 Copying files from backup..." -ForegroundColor Green
Copy-Item -Path "`$backupDir\*" -Destination "." -Recurse -Force -Exclude "BACKUP-MANIFEST.json"

Write-Host "📦 Installing dependencies..." -ForegroundColor Green  
npm install

Write-Host "🔍 Running type check..." -ForegroundColor Green
npx tsc --noEmit

Write-Host "🏗️ Testing build..." -ForegroundColor Green
npm run build

Write-Host "✅ Restore completed successfully!" -ForegroundColor Green
Write-Host "🚀 Run 'npm run dev' to start development server" -ForegroundColor Cyan
"@

$restoreScript | Out-File "RESTORE-FROM-$BackupName.ps1" -Encoding UTF8

Write-Host ""
Write-Host "✅ Backup created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $backupDir" -ForegroundColor Gray
Write-Host "🔧 Restore script: RESTORE-FROM-$BackupName.ps1" -ForegroundColor Gray
Write-Host "📊 Files backed up: $($manifest.FileCount)" -ForegroundColor Gray