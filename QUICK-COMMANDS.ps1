# QUICK-COMMANDS.ps1
# Simple commands for daily use

param(
    [string]$Action = "help"
)

switch ($Action.ToLower()) {
    "backup" {
        $name = Read-Host "Backup name (or press Enter for 'daily')"
        if ($name -eq "") { $name = "daily" }
        
        $desc = Read-Host "What did you accomplish? (optional)"
        if ($desc -eq "") { $desc = "Development progress" }
        
        & ".\AUTO-BACKUP.ps1" -Type $name
        Write-Host "📱 Check your mobile GitHub to see the new branch!" -ForegroundColor Cyan
    }
    
    "status" {
        Write-Host "📊 PROJECT STATUS" -ForegroundColor Cyan
        Write-Host "=================" -ForegroundColor Cyan
        
        # Git status
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            $changes = ($gitStatus | Measure-Object).Count
            Write-Host "📝 $changes uncommitted changes" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Working directory clean" -ForegroundColor Green
        }
        
        # Available backups
        $branches = git branch -r | Where-Object { $_ -like "*backup-*" }
        Write-Host "💾 Available backups: $($branches.Count)" -ForegroundColor Blue
        
        # Development server
        $nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcess) {
            Write-Host "🚀 Development server: Running" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Development server: Stopped" -ForegroundColor Yellow
        }
    }
    
    "start" {
        Write-Host "🚀 Starting development environment..." -ForegroundColor Green
        npm run dev
    }
    
    "backups" {
        Write-Host "📋 AVAILABLE BACKUPS" -ForegroundColor Cyan
        Write-Host "====================" -ForegroundColor Cyan
        git branch -r | Where-Object { $_ -like "*backup-*" } | ForEach-Object {
            $branch = $_.Trim().Replace("origin/", "")
            Write-Host "  📁 $branch" -ForegroundColor Gray
        }
    }
    
    "help" {
        Write-Host "🔧 QUICK COMMANDS" -ForegroundColor Cyan
        Write-Host "=================" -ForegroundColor Cyan
        Write-Host ".\QUICK-COMMANDS.ps1 backup   - Create backup" -ForegroundColor White
        Write-Host ".\QUICK-COMMANDS.ps1 status   - Show project status" -ForegroundColor White  
        Write-Host ".\QUICK-COMMANDS.ps1 start    - Start dev server" -ForegroundColor White
        Write-Host ".\QUICK-COMMANDS.ps1 backups  - List all backups" -ForegroundColor White
        Write-Host ".\QUICK-COMMANDS.ps1 help     - Show this help" -ForegroundColor White
    }
    
    default {
        Write-Host "❌ Unknown command: $Action" -ForegroundColor Red
        & ".\QUICK-COMMANDS.ps1" help
    }
}