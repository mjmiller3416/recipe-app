# Workflow: `pr`

**Usage:** `/git pr [base-branch]`

Default base branch: `staging` (feature branches should never target main directly)

## Steps

1. **Pre-flight checks**

   Run these checks and report issues:

   ```bash
   git status                    # Check for uncommitted changes
   git log origin/staging..HEAD  # Check for commits to push
   git fetch origin              # Get latest remote state
   ```

   **If uncommitted changes:**
   ```
   You have uncommitted changes. Commit them first with `/git commit`
   ```

   **If no commits:**
   ```
   No commits on this branch yet. Nothing to create a PR for.
   ```

2. **Determine base branch**

   - If argument provided, use it
   - Otherwise, default to `staging`
   - **Warn if user tries to target main:**
     ```
     ⚠️  Feature branches should not target main directly.

     The normal flow is: feature → staging → main

     Exception: Use `/git hotfix` for emergency production fixes that bypass staging.

     Are you sure you want to target main? (yes / use staging / create hotfix)
     ```

   ```
   PR will target: staging

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
     - `feature/shopping-sync` -> "Add shopping sync feature"
     - Single commit -> use commit message
     - Multiple commits -> summarize

   - **Body**: Use this template:
     ```markdown
     ## Summary
     - [Bullet points describing the changes]

     ## Changes
     - [List of modified files/areas]

     ## Test Plan
     - [ ] [How to test these changes]

     ---
     Generated with Claude Code
     ```

5. **Create the PR**

   Show preview and ask for confirmation:
   ```
   PR Preview:

   Title: Add shopping list sync functionality
   Base: staging <- feature/shopping-sync

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
   Pull Request Created!

   #42: Add shopping list sync functionality
   https://github.com/user/repo/pull/42

   Base: staging <- feature/shopping-sync
   Status: Ready for review
   ```