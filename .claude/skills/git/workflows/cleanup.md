# Workflow: `cleanup`

**Usage:** `/git cleanup`

Removes local and remote branches that have already been merged. Feature branches merged to staging and hotfix branches merged to main are both cleaned up.

## When to Use

- After accumulating stale branches over several features
- Periodic maintenance to keep your branch list tidy
- After a deploy cycle (features merged to staging, staging merged to main)

## Steps

1. **Fetch and prune remote tracking refs**
   ```bash
   git fetch origin --prune
   ```

   > **Why prune?** This removes local tracking references to remote branches that
   > no longer exist on origin (e.g., deleted after a PR merge).

2. **Identify branches to clean up**

   Scan for branches in three categories:

   **A. Local branches merged to staging:**
   ```bash
   git branch --merged origin/staging
   ```
   Filter out `main` and `staging` (protected branches).

   **B. Local branches merged to main** (hotfix branches):
   ```bash
   git branch --merged origin/main
   ```
   Filter out `main` and `staging`.

   **C. Stale remote-tracking branches** (remote already deleted):
   ```bash
   git branch -vv | grep ': gone]'
   ```

   Deduplicate across all three categories.

3. **Show cleanup preview**
   ```
   Branch Cleanup Preview

   Merged to staging (safe to delete):
     - feature/shopping-sync         (local + remote)
     - fix/auth-token-refresh        (local only)
     - chore/update-deps             (local + remote)

   Merged to main (hotfix branches):
     - hotfix/auth-token-leak        (local + remote)

   Stale (remote already deleted):
     - refactor/api-client           (local only, remote gone)

   Protected (will NOT be deleted):
     - main
     - staging

   Total: 5 branches to remove

   Proceed with cleanup? (yes / abort)
   ```

   **If no branches to clean:**
   ```
   No stale branches found

   All branches are either active or protected. Nothing to clean up.
   ```

4. **Delete local branches**

   Use safe delete (`-d`) for merged branches first:
   ```bash
   git branch -d feature/shopping-sync fix/auth-token-refresh chore/update-deps hotfix/auth-token-leak
   ```

   For stale branches where the remote is already gone, use force delete (`-D`)
   since git can't verify the merge status against a deleted remote:
   ```bash
   git branch -D refactor/api-client
   ```

   > **Safety:** `-d` (lowercase) refuses to delete unmerged branches.
   > `-D` (uppercase) is only used for branches whose remote is already gone,
   > meaning the work was already merged or intentionally abandoned on the remote.

5. **Delete remote branches**

   Only delete remotes that still exist on origin:
   ```bash
   git push origin --delete feature/shopping-sync chore/update-deps hotfix/auth-token-leak
   ```

   > **Note:** Skip branches whose remote was already pruned in step 1.

6. **Confirm success**
   ```
   Cleanup complete!

   Deleted 5 branches:
     Local:  5 removed
     Remote: 3 removed (2 were already gone)

   Remaining branches:
     - main (protected)
     - staging (protected)
     - feature/new-dashboard (active, not merged)

   Tip: Run /git cleanup periodically to keep branches tidy.
   ```

## Error Handling

**Currently on a branch that would be deleted:**
```
You're currently on branch: feature/shopping-sync

This branch is merged and would be deleted. Switching to staging first.
```

Then:
```bash
git checkout staging
git pull origin staging
```

**Delete fails for a branch:**
```
Warning: Could not delete branch 'feature/shopping-sync'

This may mean it has unmerged commits. Skipping.
To force delete: git branch -D feature/shopping-sync
```

**Remote delete fails:**
```
Warning: Could not delete remote branch 'feature/shopping-sync'

The remote branch may have already been deleted or you lack permissions.
Skipping remote deletion for this branch.
```

**Uncommitted changes on current branch:**
```
You have uncommitted changes on your current branch.

Options:
1. Stash changes and continue cleanup
2. Abort and commit first
```

## Protected Branches

The following branches are **never deleted**, regardless of merge status:

- `main` — production branch
- `staging` — integration branch

## Quick Reference

```
Cleanup Flow:
  1. /git cleanup                # Start cleanup
  2. Review branch list          # Verify what will be deleted
  3. Confirm deletion            # Removes local + remote
  4. Done                        # Protected branches remain

What gets cleaned:
  - feature/*, fix/*, chore/*, refactor/*, docs/*, test/* merged to staging
  - hotfix/* merged to main
  - Any branch whose remote tracking ref is gone
```
