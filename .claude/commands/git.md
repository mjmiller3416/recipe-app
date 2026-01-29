# Git Workflow Automation

Automate git operations with strict conventions for branches, commits, and pull requests.

## Arguments

$ARGUMENTS

## Supported Workflows

Parse the arguments to determine which workflow to execute:

| Command | Description |
|---------|-------------|
| `start <type> <description>` | Create a new branch from staging |
| `commit [message]` | Stage, validate, and commit changes |
| `sync` | Rebase current branch onto latest staging |
| `merge` | Merge current feature branch into staging (direct) |
| `deploy` | Create PR from staging → main (production deploy) |
| `pr [base-branch]` | Push branch and create pull request (when needed) |
| (no args) | Show status and suggest next action |

---

## Workflow: `start`

**Usage:** `/git start <type> <description>`

**Valid types:** `feature`, `fix`, `chore`, `refactor`, `docs`, `test`

### Steps

1. **Validate arguments**
   ```
   /git start feature shopping-sync
              ↑       ↑
              type    description (kebab-case)
   ```
   - If type is invalid, show valid types and ask for correction
   - If description missing, ask for it

2. **Check git status**
   - If uncommitted changes exist, warn and ask:
     ```
     ⚠️ You have uncommitted changes:
     - Modified: src/components/Header.tsx
     - Untracked: src/utils/helpers.ts

     Options:
     1. Stash changes and continue
     2. Abort and commit first
     ```

3. **Fetch and create branch**
   ```bash
   git fetch origin
   git checkout -b <type>/<description> origin/staging
   ```

   > **Note:** All feature branches are based on `staging`, not `main`.
   > See [Branching Strategy](#branching-strategy) for details.

4. **Confirm success**
   ```
   ✅ Created branch: feature/shopping-sync

   Based on: origin/staging (abc1234)

   Next steps:
   - Make your changes
   - Run `/git commit` to commit with proper format
   - Run `/git pr` when ready to create a pull request (targets staging)
   ```

---

## Workflow: `commit`

**Usage:** `/git commit [message]` or `/git commit`

### Steps

1. **Check for changes**
   ```bash
   git status
   git diff --stat
   git diff --cached --stat
   ```
   - If no changes: "Nothing to commit. Working tree clean."
   - Show summary of staged vs unstaged changes

2. **Verify branch-content alignment** ⚠️

   Analyze the staged/unstaged changes and compare to the current branch name.

   **Detection heuristics:**
   - Extract domain from file paths (e.g., `shopping-list/`, `meal-planner/`, `recipes/`)
   - Look for feature-specific patterns in filenames (e.g., `useShopping.ts`, `PlannerEntry.tsx`)
   - Consider hook names, component names, and API routes
   - Check if changes span multiple domains (likely shared/utility work)

   **Domain mapping examples:**
   | File Pattern | Likely Domain |
   |--------------|---------------|
   | `shopping-list/`, `useShopping`, `ShoppingItem` | `shopping-list` |
   | `meal-planner/`, `usePlanner`, `PlannerEntry` | `meal-planner` |
   | `recipes/`, `useRecipe`, `RecipeCard` | `recipes` |
   | `dashboard/`, `Dashboard`, `Widget` | `dashboard` |
   | `settings/`, `useSettings` | `settings` |
   | `meal-genie/`, `MealGenie`, `useChat` | `meal-genie` |
   | `components/ui/`, `lib/`, `hooks/api/` | (shared - no specific domain) |

   **Case A: Full mismatch (all changes belong elsewhere)**

   First, search for existing branches that match the detected domain:
   ```bash
   git branch -a | grep -E "(feature|fix|chore)/<domain>"
   ```

   **Case A1: Matching branch exists**
   ```
   ⚠️ Branch-content mismatch detected!

   Current branch: feature/meal-planner
   Changes appear related to: shopping-list

   Modified files:
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts
   - backend/app/services/shopping_service.py

   🔍 Found existing branch: feature/shopping-list

   Options:
   1. Switch to feature/shopping-list and move changes there
   2. Create NEW branch (feature/shopping-list-<suffix>)
   3. Continue on current branch (I know what I'm doing)
   ```

   **Case A2: No matching branch exists**
   ```
   ⚠️ Branch-content mismatch detected!

   Current branch: feature/meal-planner
   Changes appear related to: shopping-list

   Modified files:
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts
   - backend/app/services/shopping_service.py

   🔍 No existing branch found for "shopping-list"

   Options:
   1. Create new branch: feature/shopping-list (Recommended)
   2. Create new branch with custom name
   3. Continue on current branch (I know what I'm doing)
   ```

   **If switching to existing branch:**
   ```bash
   git stash push -m "WIP: changes for shopping-list"
   git checkout feature/shopping-list
   git stash pop
   ```

   **If creating new branch:**
   ```bash
   git stash push -m "WIP: changes for shopping-list"
   git fetch origin
   git checkout -b feature/shopping-list origin/staging
   git stash pop
   ```

   ---

   **Case B: Partial mismatch (mixed domains in staged changes)**

   First, search for existing branches matching the non-matching domain:
   ```bash
   git branch -a | grep -E "(feature|fix|chore)/meal-planner"
   ```

   **Case B1: Matching branch exists for non-matching files**
   ```
   ⚠️ Mixed-domain changes detected!

   Current branch: feature/shopping-list

   ✅ Matching files (shopping-list):
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts

   ⚠️ Non-matching files (meal-planner):
   - frontend/src/app/meal-planner/_components/PlannerEntry.tsx
   - backend/app/services/planner_service.py

   🔍 Found existing branch: feature/meal-planner

   Options:
   1. Commit matching files only, stash rest for later
   2. Commit matching files, then switch to feature/meal-planner for the rest
   3. Commit all files here (intentional cross-domain work)
   ```

   **Case B2: No matching branch for non-matching files**
   ```
   ⚠️ Mixed-domain changes detected!

   Current branch: feature/shopping-list

   ✅ Matching files (shopping-list):
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts

   ⚠️ Non-matching files (meal-planner):
   - frontend/src/app/meal-planner/_components/PlannerEntry.tsx
   - backend/app/services/planner_service.py

   🔍 No existing branch found for "meal-planner"

   Options:
   1. Commit matching files only, stash rest for later
   2. Commit matching files, then CREATE feature/meal-planner for the rest
   3. Commit all files here (intentional cross-domain work)
   ```

   **If option 1 selected:**
   ```bash
   # Unstage non-matching files
   git reset HEAD <non-matching-files>
   # Stash them for later
   git stash push -m "WIP: meal-planner changes" -- <non-matching-files>
   # Continue with commit of matching files only
   ```

   **If option 2 selected:**
   ```bash
   # First, commit matching files
   git reset HEAD <non-matching-files>
   git commit -m "<message>"

   # Then handle non-matching files
   git stash push -m "WIP: meal-planner changes" -- <non-matching-files>

   # Switch to existing OR create new branch
   git checkout feature/meal-planner  # if exists
   # OR
   git checkout -b feature/meal-planner origin/staging  # if creating new

   git stash pop
   # Prompt for second commit message
   ```

   ---

   **Case C: Three or more domains detected**
   ```
   📋 Cross-cutting changes detected

   Current branch: feature/shopping-list

   Changes span multiple domains:
   - shopping-list: 2 files
   - meal-planner: 1 file
   - recipes: 1 file
   - shared/utils: 2 files

   This looks like a refactor or shared utility change.

   Options:
   1. Continue (this is intentional cross-domain work)
   2. Let me review and split these changes
   ```

   **Exceptions (no warning needed):**
   - Changes only touch shared files (`components/ui/`, `lib/utils/`, `hooks/api/index.ts`)
   - Changes span 3+ domains (likely a cross-cutting refactor)
   - Branch is `chore/*` or `refactor/*` (expected to touch multiple areas)
   - Commit message includes scope matching branch (user is intentional)

   **If alignment is good:**
   ```
   ✅ Changes align with branch: feature/shopping-list
   ```

3. **Determine what to stage**

   If there are unstaged changes, ask:
   ```
   📝 Unstaged changes found:
   - Modified: src/api/shopping.ts
   - Modified: src/hooks/useShopping.ts
   - Untracked: src/utils/sync.ts

   Options:
   1. Stage all changes (Recommended)
   2. Stage specific files
   3. Only commit already-staged changes
   ```

4. **Get or validate commit message**

   **If message provided in arguments:**
   - Validate against Conventional Commits format
   - Format: `<type>: <description>` or `<type>(<scope>): <description>`
   - Valid types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`

   **If no message provided:**
   - Analyze the staged changes
   - Suggest a commit message based on the diff
   - Ask user to confirm or modify:
     ```
     📝 Suggested commit message based on changes:

     feat: add shopping list sync functionality

     Accept this message? (yes / edit / custom)
     ```

5. **Validate commit message format**

   Check the message follows Conventional Commits:
   ```
   ✅ Valid:   feat: add user authentication
   ✅ Valid:   fix(auth): resolve token refresh bug
   ✅ Valid:   chore: update dependencies

   ❌ Invalid: Added new feature (missing type prefix)
   ❌ Invalid: feat - add feature (wrong separator)
   ❌ Invalid: FEAT: add feature (type must be lowercase)
   ```

   If invalid, show the issue and ask for correction.

6. **Create commit**
   ```bash
   git add <files>  # if staging was requested
   git commit -m "<validated-message>

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

7. **Confirm success**
   ```
   ✅ Committed: feat: add shopping list sync

   Files changed: 3
   Insertions: +127
   Deletions: -15

   Commit: abc1234

   Next: Run `/git pr` when ready to create a pull request
   ```

---

## Workflow: `sync`

**Usage:** `/git sync`

Brings your feature branch up-to-date with the latest staging using rebase. Use this when:
- Another feature was merged to staging and you need those changes
- You've been working on a branch for a while and staging has moved ahead
- Before creating a PR (ensures clean merge)

### When to Use Sync

```
Your situation:
staging:        A → B → C → D ← (someone merged their feature)
                     ↘
your-branch:          E → F   ← (your work)

After /git sync:
staging:        A → B → C → D
                             ↘
your-branch:                  E' → F'  ← (your work, rebased)
```

### Steps

1. **Check for uncommitted changes**
   ```bash
   git status
   ```

   **If uncommitted changes exist:**
   ```
   ⚠️ You have uncommitted changes.

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
   ✅ Already up-to-date with staging

   Your branch: feature/shopping-list
   Staging: abc1234 (0 commits behind)
   ```

3. **Show what will happen**
   ```bash
   git log --oneline HEAD..origin/staging  # New commits from staging
   git log --oneline origin/staging..HEAD  # Your commits to replay
   ```

   ```
   📋 Sync Preview

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
   ⚠️ Conflict detected while rebasing

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
   ✅ Successfully synced with staging!

   Your branch: feature/shopping-list
   Now based on: staging (abc1234)
   Commits replayed: 2

   Your branch is now up-to-date and ready for continued work.

   💡 Note: If you've already pushed this branch, you'll need to force push:
      git push --force-with-lease
   ```

### Force Push Warning

If the branch was previously pushed, rebasing rewrites history. The next push will need `--force-with-lease`:

```
⚠️ This branch was previously pushed to origin.

Since rebase rewrites history, you'll need to force push:
   git push --force-with-lease

--force-with-lease is safer than --force because it checks that
no one else has pushed to this branch since your last fetch.

Push now? (yes / later)
```

### Example Scenario

```
# You're working on shopping-list
/git commit feat: add list filtering

# Another feature was merged to staging
# Your branch is now behind

/git sync
# → Fetches staging, rebases your commits on top
# → Now you have those changes AND your work

# Continue working...
/git commit feat: add sort options

# Ready to merge to staging
/git merge
```

---

## Workflow: `merge`

**Usage:** `/git merge`

Merges your current feature branch directly into staging. This is the **primary way to integrate completed features** in a solo workflow (no PR needed for feature → staging).

### When to Use

- Feature is complete and ready for integration
- You've tested your changes locally
- You want fast iteration without PR overhead

### Steps

1. **Pre-flight checks**
   ```bash
   git status                         # Check for uncommitted changes
   git fetch origin
   git log origin/staging..HEAD       # Your commits to merge
   ```

   **If uncommitted changes:**
   ```
   ⚠️ You have uncommitted changes. Commit them first with `/git commit`
   ```

   **If no commits:**
   ```
   ⚠️ No commits on this branch. Nothing to merge.
   ```

2. **Check branch is synced**
   ```bash
   git rev-list --count HEAD..origin/staging
   ```

   **If behind staging:**
   ```
   ⚠️ Your branch is behind staging by 3 commits.

   You should sync first to avoid merge conflicts:
      /git sync

   Or continue anyway? (sync first / merge anyway)
   ```

3. **Show merge preview**
   ```
   📋 Merge Preview

   Branch: feature/shopping-list → staging
   Commits to merge: 4

   Commits:
   - abc1234 feat: add shopping list sync
   - def5678 feat: add list filtering
   - ghi9012 feat: add sort options
   - jkl3456 fix: resolve edge case

   Merge strategy: Squash merge (single commit on staging)

   Proceed? (yes / abort)
   ```

4. **Perform the merge**
   ```bash
   git checkout staging
   git pull origin staging
   git merge --squash feature/shopping-list
   git commit -m "feat: shopping list sync and filtering

   - Add real-time sync for shopping list items
   - Add list filtering and sorting
   - Fix edge case in item removal

   Squashed from: feature/shopping-list (4 commits)
   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

   > **Why squash merge?** It keeps staging history clean — one commit per feature
   > instead of all your WIP commits. The detailed history lives in git reflog
   > if you ever need it.

5. **Push merge to remote**

   After a successful merge, immediately push staging to origin:
   ```bash
   git push origin staging
   ```

   **If push fails:**
   ```
   ⚠️ Failed to push staging to origin.

   Options:
   1. Pull and retry (may have new remote commits)
   2. Abort (your local staging has the merge — push manually later)
   ```

6. **Delete feature branch**

   Once the merge is pushed, clean up the feature branch:
   ```bash
   git branch -d feature/shopping-list           # Delete local branch
   git push origin --delete feature/shopping-list # Delete remote branch (if pushed)
   ```

   > **Note:** `git branch -d` (lowercase) is a safe delete — it only works
   > if the branch has been fully merged. This prevents accidental data loss.

7. **Confirm success**
   ```
   ✅ Merged to staging!

   Commit: xyz7890 feat: shopping list sync and filtering
   Pushed: origin/staging ✓
   Branch: feature/shopping-list (deleted local + remote)

   Staging is now ready for testing.

   When ready for production: /git deploy
   ```

### Merge Commit Message

The squash merge commit message should:
- Summarize the feature (first line = PR title equivalent)
- List key changes as bullet points
- Reference the source branch

---

## Workflow: `deploy`

**Usage:** `/git deploy`

Creates a PR from staging → main to deploy to production. This is the **only place PRs are used** in the solo workflow.

### Why PR for Deploy?

Even solo, a PR for production deploys gives you:
- A checkpoint to review all changes going to production
- A clear record in GitHub of what was deployed when
- Easy rollback (revert the PR)
- CI checks run before deploy (if configured)

### Steps

1. **Pre-flight checks**
   ```bash
   git fetch origin
   git checkout staging
   git pull origin staging
   git log origin/main..staging --oneline   # Changes to deploy
   ```

   **If staging equals main:**
   ```
   ✅ Nothing to deploy. Staging and main are in sync.
   ```

2. **Show deploy preview**
   ```
   📋 Deploy Preview (staging → main)

   Commits to deploy: 3

   - xyz7890 feat: shopping list sync and filtering
   - abc1234 feat: improved meal planner drag-drop
   - def5678 fix: resolve auth token refresh

   This will trigger Railway auto-deploy to production.

   Create deploy PR? (yes / abort)
   ```

3. **Create the PR**
   ```bash
   gh pr create --base main --head staging --title "Deploy: <summary>" --body "..."
   ```

   PR body template:
   ```markdown
   ## 🚀 Production Deploy

   ### Changes
   - feat: shopping list sync and filtering
   - feat: improved meal planner drag-drop
   - fix: resolve auth token refresh

   ### Checklist
   - [ ] Tested on staging
   - [ ] No console errors
   - [ ] Verified on mobile

   ---
   Merging this PR will trigger Railway auto-deploy.
   ```

4. **Confirm**
   ```
   ✅ Deploy PR created!

   #42: Deploy: Shopping list sync, planner improvements
   https://github.com/user/repo/pull/42

   Next steps:
   1. Review the changes in GitHub
   2. Merge the PR when ready
   3. Railway will auto-deploy to production
   ```

### Quick Deploy (Skip PR)

If you want to deploy without a PR (faster but less ceremony):

```
/git deploy --direct
```

This merges staging → main directly:
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

⚠️ Only use this for urgent hotfixes or when you're confident.

---

## Workflow: `pr`

**Usage:** `/git pr [base-branch]`

Default base branch: `staging` (feature branches should never target main directly)

### Steps

1. **Pre-flight checks**

   Run these checks and report issues:

   ```bash
   git status                    # Check for uncommitted changes
   git log origin/staging..HEAD  # Check for commits to push
   git fetch origin              # Get latest remote state
   ```

   **If uncommitted changes:**
   ```
   ⚠️ You have uncommitted changes. Commit them first with `/git commit`
   ```

   **If no commits:**
   ```
   ⚠️ No commits on this branch yet. Nothing to create a PR for.
   ```

2. **Determine base branch**

   - If argument provided, use it
   - Otherwise, default to `staging`
   - **Warn if user tries to target main:**
     ```
     ⚠️ Feature branches should not target main directly.

     The branching strategy is: feature → staging → main

     Are you sure you want to target main? (yes / use staging instead)
     ```

   ```
   📋 PR will target: staging

   Is this correct? (yes / other)
   ```

3. **Check if remote branch exists**
   ```bash
   git ls-remote --heads origin <current-branch>
   ```

   - If not exists: push with `-u` flag
   - If exists: check if local is ahead and push

4. **Analyze changes for PR content**

   ```bash
   git log <base>..HEAD --oneline   # All commits
   git diff <base>..HEAD --stat     # Changed files summary
   ```

   Generate PR title and body:
   - **Title**: Derive from branch name or commits
     - `feature/shopping-sync` → "Add shopping sync feature"
     - Single commit → use commit message
     - Multiple commits → summarize

   - **Body**: Use this template:
     ```markdown
     ## Summary
     - [Bullet points describing the changes]

     ## Changes
     - [List of modified files/areas]

     ## Test Plan
     - [ ] [How to test these changes]

     ---
     🤖 Generated with Claude Code
     ```

5. **Create the PR**

   Show preview and ask for confirmation:
   ```
   📋 PR Preview:

   Title: Add shopping list sync functionality
   Base: staging ← feature/shopping-sync

   ## Summary
   - Implement real-time sync for shopping list items
   - Add conflict resolution for concurrent edits

   ## Changes
   - src/api/shopping.ts
   - src/hooks/useShopping.ts
   - src/components/ShoppingList.tsx

   ## Test Plan
   - [ ] Open shopping list on two devices
   - [ ] Add item on device A, verify appears on device B

   Create this PR? (yes / edit title / edit body)
   ```

   Then create:
   ```bash
   gh pr create --title "..." --body "..." --base <base-branch>
   ```

6. **Confirm and provide link**
   ```
   ✅ Pull Request Created!

   #42: Add shopping list sync functionality
   https://github.com/user/repo/pull/42

   Base: staging ← feature/shopping-sync
   Status: Ready for review
   ```

---

## Workflow: No Arguments (Status)

When `/git` is run without arguments, show current status and suggest next action:

```bash
git status
git branch --show-current
git log origin/main..HEAD --oneline 2>/dev/null
```

**Output format:**
```
📊 Git Status

Branch: feature/shopping-sync
Based on: main (3 commits ahead)

Changes:
- 2 staged files
- 1 modified (unstaged)
- 0 untracked

Commits on this branch:
1. abc1234 feat: add shopping sync service
2. def5678 feat: add sync hook
3. ghi9012 fix: resolve race condition

💡 Suggested next action:
   /git commit    ← You have unstaged changes
```

---

## Branching Strategy (Solo Workflow)

```
feature/xxx ─┬─► staging ─────► main (production)
fix/xxx     ─┤   (direct)   (PR)     │
chore/xxx   ─┘       │               ▼
                     │        Railway auto-deploy
              Integration/Test
```

| Branch | Purpose | How to Integrate |
|--------|---------|------------------|
| `main` | Production (Railway auto-deploys) | PR from staging only |
| `staging` | Integration and testing | Direct merge from features |
| `feature/*`, `fix/*`, etc. | Development work | `/git merge` to staging |

**Solo Workflow Rules:**
- Feature branches are **created from** `staging`
- Feature branches are **merged directly** to `staging` (no PR needed)
- Staging is deployed to main **via PR** (`/git deploy`)
- **Never merge feature branches directly to main**

**Why this workflow?**
- Fast iteration: no PR overhead for feature development
- Safe deploys: PR checkpoint before production
- Clean history: squash merges keep staging readable

---

## Branch Naming Convention

**Format:** `<type>/<description>`

| Type | Use For |
|------|---------|
| `feature` | New functionality |
| `fix` | Bug fixes |
| `chore` | Maintenance, deps, config |
| `refactor` | Code restructuring |
| `docs` | Documentation only |
| `test` | Test additions/changes |

**Description rules:**
- Use kebab-case: `shopping-list-sync` not `shoppingListSync`
- Keep it short but descriptive: 2-4 words
- No special characters except hyphens

**Examples:**
```
feature/shopping-list-sync
fix/auth-token-refresh
chore/update-dependencies
refactor/api-client-structure
docs/api-documentation
test/shopping-integration
```

---

## Commit Message Convention

**Format:** `<type>: <description>` or `<type>(<scope>): <description>`

| Type | Meaning |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance task |
| `refactor` | Code change that neither fixes nor adds |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, missing semicolons, etc. |
| `perf` | Performance improvement |

**Rules:**
- Type must be lowercase
- Description starts with lowercase
- No period at the end
- Use imperative mood: "add feature" not "added feature"
- Keep under 72 characters

**Examples:**
```
feat: add shopping list sync
fix(auth): resolve token refresh on expiry
chore: update React to v19
refactor(api): simplify error handling
docs: add API documentation for shopping endpoints
test: add integration tests for meal planner
```

---

## Error Handling

**Invalid branch type:**
```
❌ Invalid branch type: "bugfix"

Valid types are:
- feature  → New functionality
- fix      → Bug fixes
- chore    → Maintenance tasks
- refactor → Code restructuring
- docs     → Documentation
- test     → Test changes

Try: /git start fix auth-bug
```

**Invalid commit message:**
```
❌ Invalid commit message format

Your message: "Added new feature"

Issues:
- Missing type prefix (feat, fix, chore, etc.)
- Should use imperative mood: "add" not "added"

Suggested fix: feat: add new feature

Use this suggestion? (yes / edit)
```

**Branch already exists:**
```
⚠️ Branch 'feature/shopping-sync' already exists

Options:
1. Switch to existing branch
2. Delete and recreate from main
3. Use different name
```

---

## Examples

```
/git
```
→ Show current status and suggested next action

```
/git start feature shopping-sync
```
→ Create `feature/shopping-sync` branch from main

```
/git commit
```
→ Analyze changes, suggest message, validate, and commit

```
/git commit feat: add shopping list sync
```
→ Validate message format and commit with it

```
/git pr
```
→ Push branch and create PR to detected base branch

```
/git pr main
```
→ Push branch and create PR targeting main specifically
