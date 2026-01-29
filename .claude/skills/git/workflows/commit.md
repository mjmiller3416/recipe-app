# Workflow: `commit`

**Usage:** `/git commit [message]` or `/git commit`

## Steps

1. **Check for changes**
   ```bash
   git status
   git diff --stat
   git diff --cached --stat
   ```
   - If no changes: "Nothing to commit. Working tree clean."
   - Show summary of staged vs unstaged changes

2. **Verify branch-content alignment**

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
   Branch-content mismatch detected!

   Current branch: feature/meal-planner
   Changes appear related to: shopping-list

   Modified files:
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts
   - backend/app/services/shopping_service.py

   Found existing branch: feature/shopping-list

   Options:
   1. Switch to feature/shopping-list and move changes there
   2. Create NEW branch (feature/shopping-list-<suffix>)
   3. Continue on current branch (I know what I'm doing)
   ```

   **Case A2: No matching branch exists**
   ```
   Branch-content mismatch detected!

   Current branch: feature/meal-planner
   Changes appear related to: shopping-list

   Modified files:
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts
   - backend/app/services/shopping_service.py

   No existing branch found for "shopping-list"

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
   Mixed-domain changes detected!

   Current branch: feature/shopping-list

   Matching files (shopping-list):
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts

   Non-matching files (meal-planner):
   - frontend/src/app/meal-planner/_components/PlannerEntry.tsx
   - backend/app/services/planner_service.py

   Found existing branch: feature/meal-planner

   Options:
   1. Commit matching files only, stash rest for later
   2. Commit matching files, then switch to feature/meal-planner for the rest
   3. Commit all files here (intentional cross-domain work)
   ```

   **Case B2: No matching branch for non-matching files**
   ```
   Mixed-domain changes detected!

   Current branch: feature/shopping-list

   Matching files (shopping-list):
   - frontend/src/app/shopping-list/_components/ShoppingListView.tsx
   - frontend/src/hooks/api/useShopping.ts

   Non-matching files (meal-planner):
   - frontend/src/app/meal-planner/_components/PlannerEntry.tsx
   - backend/app/services/planner_service.py

   No existing branch found for "meal-planner"

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
   Cross-cutting changes detected

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
   Changes align with branch: feature/shopping-list
   ```

3. **Determine what to stage**

   If there are unstaged changes, ask:
   ```
   Unstaged changes found:
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
     Suggested commit message based on changes:

     feat: add shopping list sync functionality

     Accept this message? (yes / edit / custom)
     ```

5. **Validate commit message format**

   Check the message follows Conventional Commits:
   ```
   Valid:   feat: add user authentication
   Valid:   fix(auth): resolve token refresh bug
   Valid:   chore: update dependencies

   Invalid: Added new feature (missing type prefix)
   Invalid: feat - add feature (wrong separator)
   Invalid: FEAT: add feature (type must be lowercase)
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
   Committed: feat: add shopping list sync

   Files changed: 3
   Insertions: +127
   Deletions: -15

   Commit: abc1234

   Next: Run `/git pr` when ready to create a pull request
   ```