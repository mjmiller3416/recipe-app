# Workflow: `start`

**Usage:** `/git start <type> <description>`

**Valid types:** `feature`, `fix`, `chore`, `refactor`, `docs`, `test`

## Steps

1. **Validate arguments**
   ```
   /git start feature shopping-sync
              ^       ^
              type    description (kebab-case)
   ```
   - If type is invalid, show valid types and ask for correction
   - If description missing, ask for it

2. **Check git status**
   - If uncommitted changes exist, warn and ask:
     ```
     You have uncommitted changes:
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

4. **Confirm success**
   ```
   Created branch: feature/shopping-sync

   Based on: origin/staging (abc1234)

   Next steps:
   - Make your changes
   - Run `/git commit` to commit with proper format
   - Run `/git pr` when ready to create a pull request (targets staging)
   ```

## Error Handling

**Invalid branch type:**
```
Invalid branch type: "bugfix"

Valid types are:
- feature  -> New functionality
- fix      -> Bug fixes
- chore    -> Maintenance tasks
- refactor -> Code restructuring
- docs     -> Documentation
- test     -> Test changes

Try: /git start fix auth-bug
```

**Branch already exists:**
```
Branch 'feature/shopping-sync' already exists

Options:
1. Switch to existing branch
2. Delete and recreate from staging
3. Use different name
```
