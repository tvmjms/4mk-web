# Safe Development Workflow

This document outlines the step-by-step process for making changes safely to prevent data loss.

## Pre-Change Checklist

Before making ANY changes:

1. ✅ **Create Backup**
   ```powershell
   .\SAFE-DEVELOPMENT.ps1
   # Choose option 1: Create backup before making changes
   ```

2. ✅ **Pull Latest from GitHub**
   ```bash
   git pull origin main
   ```

3. ✅ **Check Current Status**
   ```bash
   git status
   ```

4. ✅ **Create Feature Branch**
   ```bash
   git checkout -b feature/description-of-change
   ```

5. ✅ **Document Change**
   - Add to `CHANGE-REQUESTS.md` if it's a new request
   - Update `REQUIREMENTS.md` if starting work on existing request
   - Note what files you plan to modify

---

## During Development

### Making Changes

1. **Work Incrementally**
   - Make small, logical changes
   - Test after each unit of work
   - Don't make multiple unrelated changes in one session

2. **Commit Frequently**
   ```bash
   git add <files>
   git commit -m "Descriptive message about what changed"
   ```
   - Commit messages should be clear and specific
   - Each commit should represent a complete, working state

3. **Update Documentation**
   - Update `REQUIREMENTS.md` as you progress
   - Note any issues or blockers
   - Document any new features or changes

4. **Test Regularly**
   - Run the dev server: `npm run dev`
   - Test the specific functionality you're working on
   - Check for console errors
   - Verify UI looks correct

### If Something Goes Wrong

1. **Don't Panic**
   - All changes are in git history
   - You have backups

2. **Check Git Status**
   ```bash
   git status
   git log --oneline -10
   ```

3. **Recover Options**:
   - **Undo uncommitted changes**: `git restore <file>`
   - **Revert to last commit**: `git reset --hard HEAD`
   - **Go back to specific commit**: `git checkout <commit-hash>`
   - **Use backup**: Run restore script from `SAFE-DEVELOPMENT.ps1`
   - **Return to Point 0**: `git checkout point-0-baseline`

4. **Document What Went Wrong**
   - Add to `REQUIREMENTS.md` under Known Issues
   - Note what you were trying to do
   - Document the error or problem

---

## Completion Process

### Before Merging/Completing

1. ✅ **Review All Changes**
   ```bash
   git diff main
   git log --oneline main..HEAD
   ```

2. ✅ **Test Everything**
   - Test all affected functionality
   - Test edge cases
   - Check for regressions
   - Verify no console errors

3. ✅ **Update Documentation**
   - Move completed item from Pending to Completed in `REQUIREMENTS.md`
   - Update `CHANGE-REQUESTS.md` status to "Completed"
   - Document any new features or changes

4. ✅ **Final Commit**
   - Ensure all changes are committed
   - Write clear commit message
   - Tag if it's a significant milestone

### Merging to Main

1. **Switch to Main**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Merge Feature Branch**
   ```bash
   git merge feature/description-of-change
   ```

3. **Resolve Conflicts** (if any)
   - Review conflicts carefully
   - Test after resolving
   - Commit merge

4. **Push to GitHub**
   ```bash
   git push origin main
   ```

5. **Clean Up**
   ```bash
   git branch -d feature/description-of-change  # Delete local branch
   git push origin --delete feature/description-of-change  # Delete remote branch
   ```

---

## Recovery Procedures

### Return to Point 0 Baseline

If you need to start fresh from the baseline:

```bash
git checkout point-0-baseline
# or
git checkout stable/point-0-baseline
```

**Warning**: This will discard any uncommitted changes. Make sure to commit or stash first.

### Use Local Backup

1. Run `SAFE-DEVELOPMENT.ps1`
2. Choose option 4: Restore from backup
3. Select the backup you want to restore
4. Follow the restore script instructions

### Recover from Git History

1. Find the commit you want to return to:
   ```bash
   git log --oneline
   ```

2. Checkout that commit:
   ```bash
   git checkout <commit-hash>
   ```

3. Create a new branch if you want to continue from there:
   ```bash
   git checkout -b recovery/<description>
   ```

---

## Best Practices

1. **Never work directly on main branch** (except for hotfixes)
2. **Commit often** - small, frequent commits are safer
3. **Test before committing** - each commit should be working
4. **Write clear commit messages** - future you will thank you
5. **Update documentation** - keep REQUIREMENTS.md current
6. **Use backups** - especially before major changes
7. **Pull before pushing** - avoid merge conflicts
8. **Review before merging** - understand what you're merging

---

## Emergency Procedures

### Complete Reset to Point 0

If everything is broken and you need a complete reset:

```bash
# Save current work (if any is worth saving)
git stash

# Return to Point 0
git checkout point-0-baseline

# Create new branch from Point 0
git checkout -b recovery/from-point-0

# Or restore from backup using SAFE-DEVELOPMENT.ps1
```

### Recover Lost Work

1. Check git reflog:
   ```bash
   git reflog
   ```

2. Find the commit with your work:
   ```bash
   git show <commit-hash>
   ```

3. Recover it:
   ```bash
   git checkout <commit-hash> -- <file>
   # or
   git cherry-pick <commit-hash>
   ```

---

## Workflow Summary

```
1. Backup → 2. Pull → 3. Branch → 4. Work → 5. Commit → 6. Test → 7. Repeat
                                                              ↓
8. Review → 9. Merge → 10. Push → 11. Document → 12. Clean Up
```

---

## Questions?

- Check `REQUIREMENTS.md` for current state
- Check `CHANGE-REQUESTS.md` for pending work
- Review git history: `git log --oneline --graph`
- Check backups: `SAFE-DEVELOPMENT.ps1` option 3

