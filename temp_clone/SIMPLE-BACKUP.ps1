# SIMPLE-BACKUP.ps1
# Simple backup system that works reliably

param([string]$Description = "Backup created at $(Get-Date -Format 'yyyy-MM-dd HH:mm')")

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupDir = "BACKUP-$timestamp"

Write-Host "Creating backup: $backupDir"
Write-Host "Description: $Description"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$items = @("components", "pages", "styles", "lib", "hooks", "types", "utils", "package.json", "next.config.js", "tsconfig.json", "tailwind.config.js")

foreach ($item in $items) {
    if (Test-Path $item) {
        Write-Host "Copying: $item"
        Copy-Item -Path $item -Destination "$backupDir\$item" -Recurse -Force
    }
}

# Create simple restore script
$restoreContent = @"
# RESTORE-$timestamp.ps1
Write-Host "Restoring from $backupDir..."
Copy-Item -Path "$backupDir\*" -Destination "." -Recurse -Force
npm install
Write-Host "Restore complete!"
"@

$restoreContent | Out-File "RESTORE-$timestamp.ps1" -Encoding ASCII

Write-Host "Backup complete!"
Write-Host "Location: $backupDir"
Write-Host "Restore with: .\RESTORE-$timestamp.ps1"