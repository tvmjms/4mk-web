# RESTORE-2025-11-05-1745.ps1
Write-Host "Restoring from BACKUP-2025-11-05-1745..."
Copy-Item -Path "BACKUP-2025-11-05-1745\*" -Destination "." -Recurse -Force
npm install
Write-Host "Restore complete!"
