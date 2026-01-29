# Workflow: Status (no arguments)

**Usage:** `/git` (no arguments)

Show current git status and suggest the next action.

## Steps

1. **Gather state**
   ```bash
   git fetch origin
   git status
   git branch --show-current
   git log origin/staging..HEAD --oneline 2>/dev/null
   ```

2. **Display status**
   ```
   Git Status

   Branch: feature/shopping-sync
   Based on: staging (3 commits ahead)

   Changes:
   - 2 staged files
   - 1 modified (unstaged)
   - 0 untracked

   Commits on this branch:
   1. abc1234 feat: add shopping sync service
   2. def5678 feat: add sync hook
   3. ghi9012 fix: resolve race condition

   Suggested next action:
      /git commit    <-- You have unstaged changes
   ```

3. **Suggest next action** based on state:

   | State | Suggestion |
   |-------|------------|
   | Uncommitted changes | `/git commit` |
   | Commits not pushed | `/git pr` or `/git merge` |
   | On staging, ahead of main | `/git deploy` |
   | Clean, up-to-date | "All good! Start new work with `/git start`" |