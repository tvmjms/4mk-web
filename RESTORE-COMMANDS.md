# RESTORE-COMMANDS.md
# How I restore your backups

## When you say: "Restore backup from backup-receipt-improvements-1105-1830"

### I run these commands:
```powershell
# 1. Fetch latest from GitHub
git fetch origin

# 2. Switch to the backup branch
git checkout backup-receipt-improvements-1105-1830

# 3. Create a new working branch from backup
git checkout -b restored-from-backup-1105

# 4. Reinstall dependencies
npm install

# 5. Start development server
npm run dev
```

## Result: 
- Your code is restored to exact state from that backup
- All features working as they were on that day
- Ready to continue development

## To return to latest version:
```powershell
git checkout master
```