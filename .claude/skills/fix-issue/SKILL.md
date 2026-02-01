---
name: fix-issue
description: Automatically fetch, analyze, and fix GitHub issues with proper branch management and architecture adherence. Integrates with git, frontend-designer, and backend-architect agents.
---

# Fix GitHub Issue Skill

**Purpose**: Automatically fetch, analyze, and fix GitHub issues with proper branch management and architecture adherence.

## Usage

```bash
/fix-issue <issue-number>
/fix-issue 57
```

## What This Skill Does

1. **Fetches Issue Details** - Uses `gh` CLI to get full issue context (title, body, labels, comments)
2. **Creates Branch** - Invokes `/git start` with proper naming convention
3. **Analyzes Issue Type** - Determines if it's frontend, backend, or full-stack based on labels and content
4. **Plans the Fix** - Uses TodoWrite to create a detailed implementation plan
5. **Implements the Fix** - Invokes appropriate agents and makes changes
6. **Verifies the Fix** - Runs tests, builds, and checks the implementation
7. **Prepares for Commit** - Leaves work ready for user to review and commit

## Architecture-Aware Implementation

The skill respects the project's layered architecture:

**Frontend Issues** (labels: frontend, ui, design, Next.js, React):
- Invokes `frontend-designer` agent for scaffolding/patterns
- Uses shadcn/ui components and design tokens
- Follows component patterns from SKILL.md
- Updates types in `src/types/`
- Updates API hooks in `hooks/api/`

**Backend Issues** (labels: backend, api, database, FastAPI, SQLAlchemy):
- Invokes `backend-architect` agent for layered architecture
- Creates DTOs → Services → Repositories → Models
- Follows transaction patterns
- Creates Alembic migrations if needed
- Updates tests

**Full-Stack Issues**:
- Implements backend changes first (API contract)
- Then implements frontend changes (consuming the API)
- Ensures type safety across the stack

## Branch Naming Convention

Follows `.claude/skills/git/SKILL.md` conventions:

```
claude/issue-<number>-<YYYYMMDD>-<HHMM>
```

Example: `claude/issue-57-20260130-1445`

## Workflow Steps

### 1. Fetch Issue

```bash
gh issue view <number> --json title,body,labels,comments
```

Extracts:
- Issue title and description
- Labels (to determine issue type)
- Acceptance criteria or requirements
- Any code snippets or error messages

### 2. Create Branch

Invokes the git skill:
```
/git start "Fix #<number>: <short-title>"
```

### 3. Plan Implementation

Uses TodoWrite to create tasks like:
- [ ] Analyze issue requirements and constraints
- [ ] Identify affected files and components
- [ ] Implement backend changes (if applicable)
- [ ] Create/update database migrations (if applicable)
- [ ] Implement frontend changes (if applicable)
- [ ] Update types and API hooks
- [ ] Test the fix manually
- [ ] Run automated tests
- [ ] Run build verification

### 4. Implement Fix

**For Backend Issues**:
- Read existing code in affected areas
- Follow layered architecture (DTOs → Services → Repos → Models)
- Use transaction patterns from backend-dev skill
- Create Alembic migration if schema changes
- Update or create tests

**For Frontend Issues**:
- Read existing components and patterns
- Use shadcn/ui components (never raw divs)
- Follow design system tokens (no hardcoded colors)
- Update TypeScript types
- Update API hooks if needed
- Ensure responsive design

**For Full-Stack Issues**:
- Start with backend (API contract first)
- Implement and test API endpoints
- Update frontend types to match DTOs
- Implement UI changes
- Test end-to-end flow

### 5. Verification

- Run type checking: `npx tsc` (frontend)
- Run linting: `npm run lint` (frontend)
- Run tests: `pytest` (backend)
- Build verification: `npm run build` (frontend)
- Manual testing guidance provided

### 6. Summary

Provides:
- List of files changed
- Summary of changes made
- Testing recommendations
- Next steps (commit, PR, etc.)

## Error Handling

If the issue number doesn't exist:
```
Error: Issue #<number> not found. Please check the issue number.
```

If `gh` CLI is not installed:
```
Error: GitHub CLI (gh) is not installed. Please install it:
- Windows: winget install GitHub.cli
- Mac: brew install gh
- Linux: https://github.com/cli/cli#installation
```

If the issue is too vague:
- Asks clarifying questions using AskUserQuestion
- Requests more details before implementing

## Integration with Existing Skills

This skill acts as an orchestrator:

```
/fix-issue
    ↓
  /git start (branch creation)
    ↓
  Analyze issue → Determine type
    ↓
  /frontend-designer (if frontend)
    OR
  /backend-architect (if backend)
    OR
  Both (if full-stack)
    ↓
  Verify & Test
    ↓
  Summary (ready for /git commit)
```

## Examples

### Example 1: Frontend Bug Fix

```bash
/fix-issue 57
```

Issue #57: "Recipe card image not displaying on mobile"
- Creates branch: `claude/issue-57-20260130-1445`
- Analyzes: Frontend issue (label: ui, bug)
- Invokes: frontend-designer agent for scaffolding/patterns
- Fixes: Responsive image sizing in RecipeCard component
- Verifies: npm run lint, npx tsc, visual test
- Summary: "Fixed responsive image in RecipeCard by using aspect-ratio utilities"

### Example 2: Backend Feature

```bash
/fix-issue 82
```

Issue #82: "Add recipe rating API endpoint"
- Creates branch: `claude/issue-82-20260130-1500`
- Analyzes: Backend feature (label: api, enhancement)
- Invokes: backend-dev skill for layered architecture
- Implements:
  - DTO: `RatingCreateDTO`, `RatingResponseDTO`
  - Service: `RatingService.add_rating()`
  - Repository: `RatingRepository.create()`
  - Model: Update `Recipe` model with `ratings` relationship
  - Migration: Alembic migration for ratings table
  - Route: `POST /api/recipes/{id}/ratings`
- Verifies: pytest, backend runs without errors
- Summary: "Added recipe rating API with full CRUD operations"

### Example 3: Full-Stack Feature

```bash
/fix-issue 91
```

Issue #91: "Add favorite recipes feature"
- Creates branch: `claude/issue-91-20260130-1530`
- Analyzes: Full-stack (labels: frontend, backend, feature)
- Implements Backend First:
  - Model: `user_favorite_recipes` association table
  - Repository: `RecipeRepository.add_favorite()`, `get_favorites()`
  - Service: `RecipeService.toggle_favorite()`
  - Route: `POST /api/recipes/{id}/favorite`
  - Migration: Alembic migration
- Then Frontend:
  - Type: `RecipeCardData` updated with `is_favorite`
  - Hook: `useFavoriteRecipe()` mutation
  - Component: Add heart icon to RecipeCard
  - Update: FilterBar to filter favorites
- Verifies: Full end-to-end flow
- Summary: "Added favorite recipes with backend API and UI toggle"

## Best Practices

1. **Always read before writing** - Never modify files without reading them first
2. **Follow existing patterns** - Match the codebase style and architecture
3. **Keep changes minimal** - Only change what's needed to fix the issue
4. **Test thoroughly** - Verify the fix works as expected
5. **Document assumptions** - If the issue is ambiguous, document what you assumed
6. **Use existing components** - Don't reinvent wheels, use shadcn/ui and existing utils
7. **Type safety** - Ensure full type safety across frontend/backend boundary
8. **No over-engineering** - Simple, direct fixes are preferred

## Limitations

- Cannot automatically create PR (use `/git pr` after fix)
- Cannot automatically commit (user reviews changes first)
- May need clarification for vague issues
- Won't fix issues that require architectural decisions (will ask user)
- Won't make destructive changes without confirmation

## Configuration

No configuration needed. Uses:
- GitHub CLI (`gh`) for issue fetching
- Existing git, frontend-designer, backend-architect agents
- Project's CLAUDE.md conventions

## Exit Conditions

The skill completes when:
1. Issue is fully implemented
2. All verification steps pass
3. Changes are ready for user review

The skill exits early if:
- Issue number is invalid
- Issue is too vague (asks for clarification)
- Requires architectural decision (escalates to user)