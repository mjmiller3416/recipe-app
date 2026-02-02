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

## Interactive Mode

When requested or contextually appropriate, show an interactive menu:

**Step 1: Display current status**
```
Git Status

Branch: feature/shopping-sync
Based on: staging (3 commits ahead, 0 commits behind)

Working tree:
- 2 staged files
- 1 modified (unstaged)
- 0 untracked

Recent commits on this branch:
1. abc1234 feat: add shopping sync service
2. def5678 feat: add sync hook
3. ghi9012 fix: resolve race condition
```

**Step 2: Show interactive menu**
```
What would you like to do?

1. Commit current changes           (/git commit)
2. Sync with latest staging         (/git sync)
3. Merge to staging                 (/git merge)
4. Create pull request              (/git pr)
5. View commit history              (git log --oneline -10)
6. Show detailed diff               (git diff)
7. View status only                 (exit)

Select option [1-7]:
```

**Step 3: Execute selected action**

Based on user selection, execute the corresponding workflow or command.

**When to use interactive mode:**
- User runs `/git` with no arguments multiple times
- User asks "what should I do next?"
- User seems uncertain about next step
- Context suggests user wants guidance

**When NOT to use interactive mode:**
- User runs `/git <subcommand>` with specific intent
- User is in the middle of resolving a conflict
- Automated scripts or CI/CD contexts