# Workflow: `sync`

**Usage:** `/git sync`

Brings your feature branch up-to-date with the latest staging using rebase. Use this when:
- Another feature was merged to staging and you need those changes
- You've been working on a branch for a while and staging has moved ahead
- Before creating a PR (ensures clean merge)

## When to Use Sync

```
Your situation:
staging:        A -> B -> C -> D  <-- (someone merged their feature)
                     \
your-branch:          E -> F      <-- (your work)

After /git sync:
staging:        A -> B -> C -> D
                              \
your-branch:                   E' -> F'  <-- (your work, rebased)
```

## Steps

1. **Check for uncommitted changes**
   ```bash
   git status
   ```

   **If uncommitted changes exist:**
   ```
   You have uncommitted changes.

   Options:
   1. Commit changes first, then sync (Recommended)
   2. Stash changes, sync, then pop stash
   3. Abort
   ```

   > **Why commit first?** Rebasing with uncommitted changes can lead to
   > confusing states. It's cleaner to commit your work-in-progress first,
   > even if it's not complete.

2. **Check if already up-to-date**
   ```bash
   git fetch origin
   git rev-list --count HEAD..origin/staging
   ```

   **If already up-to-date:**
   ```
   Already up-to-date with staging

   Your branch: feature/shopping-list
   Staging: abc1234 (0 commits behind)
   ```

3. **Show what will happen**
   ```bash
   git log --oneline HEAD..origin/staging  # New commits from staging
   git log --oneline origin/staging..HEAD  # Your commits to replay
   ```

   ```
   Sync Preview

   Your branch: feature/shopping-list
   Behind staging by: 3 commits
   Your commits to replay: 2 commits

   New commits from staging:
   - d4e5f6g fix(planner): resolve drag-drop bug
   - a1b2c3d feat(planner): add meal swapping
   - 9f8e7d6 chore: update dependencies

   Your commits:
   - h1i2j3k feat: add shopping list sync
   - l4m5n6o feat: implement list filtering

   Continue with rebase? (yes / abort)
   ```

4. **Perform the rebase**
   ```bash
   git rebase origin/staging
   ```

5. **Handle conflicts (if any)**

   **If conflicts occur:**
   ```
   Conflict detected while rebasing

   Conflicting files:
   - frontend/src/hooks/api/index.ts

   Options:
   1. Help me resolve this conflict
   2. Abort rebase and return to previous state
   ```

   **If option 1 selected:**
   - Show the conflicting sections
   - Suggest resolution based on context
   - After resolution:
     ```bash
     git add <resolved-files>
     git rebase --continue
     ```

   **If option 2 selected:**
   ```bash
   git rebase --abort
   ```

6. **Confirm success**
   ```
   Successfully synced with staging!

   Your branch: feature/shopping-list
   Now based on: staging (abc1234)
   Commits replayed: 2

   Your branch is now up-to-date and ready for continued work.

   Note: If you've already pushed this branch, you'll need to force push:
      git push --force-with-lease
   ```

## Force Push Warning

If the branch was previously pushed, rebasing rewrites history. The next push will need `--force-with-lease`:

```
This branch was previously pushed to origin.

Since rebase rewrites history, you'll need to force push:
   git push --force-with-lease

--force-with-lease is safer than --force because it checks that
no one else has pushed to this branch since your last fetch.

Push now? (yes / later)
```

## Example Scenario

```
# You're working on shopping-list
/git commit feat: add list filtering

# Another feature was merged to staging
# Your branch is now behind

/git sync
# -> Fetches staging, rebases your commits on top
# -> Now you have those changes AND your work

# Continue working...
/git commit feat: add sort options

# Ready to merge to staging
/git merge
```
