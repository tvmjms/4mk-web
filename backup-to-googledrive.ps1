# Google Drive Backup Script
# This script creates a backup of your project to Google Drive
# Run this regularly to ensure your work is safely backed up

$projectPath = "C:\Users\smmtv\Downloads\4mk-code-fromreplit"
$backupDate = Get-Date -Format "yyyy-MM-dd"
$googleDrivePath = "$env:USERPROFILE\Google Drive\4mk-backups"

# Create backup directory in Google Drive if it doesn't exist
if (-not (Test-Path $googleDrivePath)) {
    Write-Host "Creating Google Drive backup directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $googleDrivePath -Force | Out-Null
}

$backupFolder = Join-Path $googleDrivePath "4mk-code-backup-$backupDate"

# Check if backup for today already exists
if (Test-Path $backupFolder) {
    Write-Host "Backup folder for today already exists: $backupFolder" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite existing backup? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Backup cancelled." -ForegroundColor Red
        exit
    }
    Remove-Item -Path $backupFolder -Recurse -Force
}

Write-Host ""
Write-Host "=== Starting Google Drive Backup ===" -ForegroundColor Cyan
Write-Host "Source: $projectPath" -ForegroundColor Gray
Write-Host "Destination: $backupFolder" -ForegroundColor Gray
Write-Host ""

# Verify source exists
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: Project path not found: $projectPath" -ForegroundColor Red
    exit 1
}

# Verify Google Drive is accessible
if (-not (Test-Path "$env:USERPROFILE\Google Drive")) {
    Write-Host "WARNING: Google Drive folder not found at: $env:USERPROFILE\Google Drive" -ForegroundColor Yellow
    Write-Host "Please check your Google Drive sync location." -ForegroundColor Yellow
    $customPath = Read-Host "Enter custom Google Drive path (or press Enter to use default)"
    if ($customPath) {
        $googleDrivePath = $customPath
        $backupFolder = Join-Path $googleDrivePath "4mk-backups\4mk-code-backup-$backupDate"
        if (-not (Test-Path $googleDrivePath)) {
            New-Item -ItemType Directory -Path $googleDrivePath -Force | Out-Null
        }
    }
}

Write-Host "Copying files to Google Drive..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

try {
    # Copy entire project folder
    Copy-Item -Path $projectPath -Destination $backupFolder -Recurse -Force
    
    Write-Host ""
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "Location: $backupFolder" -ForegroundColor Cyan
    Write-Host ""
    
    # Verify backup
    $sourceFiles = (Get-ChildItem -Path $projectPath -Recurse -File).Count
    $backupFiles = (Get-ChildItem -Path $backupFolder -Recurse -File).Count
    
    Write-Host "Verification:" -ForegroundColor Yellow
    Write-Host "  Source files: $sourceFiles" -ForegroundColor Gray
    Write-Host "  Backup files: $backupFiles" -ForegroundColor Gray
    
    if ($sourceFiles -eq $backupFiles) {
        Write-Host "  ✅ File count matches!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  File count mismatch - please verify manually" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=== Backup Summary ===" -ForegroundColor Cyan
    Write-Host "✅ Project backed up to Google Drive" -ForegroundColor Green
    Write-Host "✅ Files will sync to cloud automatically" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify backup in Google Drive folder" -ForegroundColor Gray
    Write-Host "2. Check Google Drive sync status" -ForegroundColor Gray
    Write-Host "3. Consider setting up automated daily backups" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Backup failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Google Drive is installed and syncing" -ForegroundColor Gray
    Write-Host "2. Verify you have enough space in Google Drive" -ForegroundColor Gray
    Write-Host "3. Try running PowerShell as Administrator" -ForegroundColor Gray
    exit 1
}

