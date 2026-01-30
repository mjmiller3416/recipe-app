# Workflow: `deploy`

**Usage:** `/git deploy`

Creates a PR from staging -> main to deploy to production. This is the **only place PRs are used** in the solo workflow.

## Why PR for Deploy?

Even solo, a PR for production deploys gives you:
- A checkpoint to review all changes going to production
- A clear record in GitHub of what was deployed when
- Easy rollback (revert the PR)
- CI checks run before deploy (if configured)

## Steps

1. **Pre-flight checks**

   > **Always use `origin/` refs** (e.g., `origin/main`, `origin/staging`) for all
   > comparisons. Never compare local `main` vs `staging` -- local refs may be stale
   > and will overstate the diff.

   ```bash
   git fetch origin
   git checkout staging
   git pull origin staging
   git log origin/main..origin/staging --oneline   # Commits to deploy
   git diff origin/main..origin/staging --stat      # Files changed
   ```

   **If staging equals main:**
   ```
   Nothing to deploy. Staging and main are in sync.
   ```

2. **Show deploy preview**
   ```
   Deploy Preview (staging -> main)

   Commits to deploy: 3

   - xyz7890 feat: shopping list sync and filtering
   - abc1234 feat: improved meal planner drag-drop
   - def5678 fix: resolve auth token refresh

   This will trigger Railway auto-deploy to production.

   Create deploy PR? (yes / abort)
   ```

3. **Update changelog** (if user-facing changes exist)

   Read `frontend/src/data/changelog.ts` and add a new section at the top with today's date.

   **Only include user-facing changes:**
   - ✅ Include: `feat:`, `fix:` (user-visible bugs)
   - ❌ Skip: merge commits, `chore:`, `docs:` (internal), `refactor:`, `test:`

   **Categorize by type:**
   ```markdown
   ## YYYY-MM-DD - New Features
   - [User-facing description from feat commits]

   ## YYYY-MM-DD - Bug Fixes
   - [User-facing description from fix commits]

   ## YYYY-MM-DD - Improvements
   - [User-facing description from enhancement commits]
   ```

   **Guidelines:**
   - Write in user-friendly language (avoid technical jargon)
   - Focus on the "what changed for the user" not implementation details
   - Use em dashes (—) for clarifications
   - Be specific about what was fixed/added
   - Combine related changes into a single bullet point if appropriate

   **Commit and push changelog:**
   ```bash
   git add frontend/src/data/changelog.ts
   git commit -m "docs: update changelog for YYYY-MM-DD release

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   git push origin staging
   ```

4. **Create the PR**
   ```bash
   gh pr create --base main --head staging --title "Deploy: <summary>" --body "..."
   ```

   PR body template:
   ```markdown
   ## Production Deploy

   ### Changes
   - feat: shopping list sync and filtering
   - feat: improved meal planner drag-drop
   - fix: resolve auth token refresh
   - docs: update changelog for YYYY-MM-DD release

   ### Checklist
   - [ ] Tested on staging
   - [ ] No console errors
   - [ ] Verified on mobile
   - [ ] Changelog updated

   ---
   Merging this PR will trigger Railway auto-deploy.
   ```

4. **Confirm**
   ```
   Deploy PR created!

   #42: Deploy: Shopping list sync, planner improvements
   https://github.com/user/repo/pull/42

   Next steps:
   1. Review the changes in GitHub
   2. Merge the PR when ready
   3. Railway will auto-deploy to production
   ```

## Quick Deploy (Skip PR)

If you want to deploy without a PR (faster but less ceremony):

```
/git deploy --direct
```

This merges staging -> main directly:
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

Only use this for urgent hotfixes or when you're confident.