# Backend Development Command

Create or modify backend code following the Meal Genie layered architecture.

## Request

$ARGUMENTS

## Instructions

**You MUST use the `backend-dev` skill for this task.** Reference the skill files at `.claude/skills/backend-dev/` for:
- Layered architecture patterns ([SKILL.md](.claude/skills/backend-dev/SKILL.md))
- Layer-specific code patterns ([patterns.md](.claude/skills/backend-dev/patterns.md))
- Code review checklist ([checklist.md](.claude/skills/backend-dev/checklist.md))

### Step 1: Understand the Request

Parse the user's request to determine:
- **Scope:** New feature, bug fix, refactor, or new endpoint?
- **Layers affected:** Which layers need changes (Model → Repo → Service → Route)?
- **Migration needed:** Does this require database schema changes?

### Step 2: Analyze Existing Code

Before implementing, study similar existing code:
1. Find similar models in `backend/app/models/`
2. Find similar services in `backend/app/services/`
3. Find similar routes in `backend/app/api/`
4. Check existing DTOs in `backend/app/dtos/`

### Step 3: Implement Bottom-Up

For new features, work from the data layer up:

1. **Model** (if schema changes)
   - Define SQLAlchemy model with proper types
   - Set up relationships with cascade rules
   - Add indexes for query performance

2. **Migration** (if schema changes)
   ```bash
   alembic revision --autogenerate -m "description"
   ```

3. **DTOs**
   - CreateDTO for POST requests
   - UpdateDTO for PUT/PATCH requests
   - ResponseDTO for API responses
   - FilterDTO for query parameters (if needed)

4. **Repository**
   - CRUD operations only
   - No commits (use flush for IDs)
   - Eager loading to prevent N+1

5. **Service**
   - Business logic and validation
   - Transaction management (commit/rollback)
   - Domain exceptions (not HTTPException)

6. **Route**
   - HTTP layer only
   - Map domain exceptions to HTTP errors
   - Return DTOs, not models

### Step 4: Apply Patterns

Follow these critical rules from the skill:

**Architecture:**
- Routes → Services → Repositories → Models
- No business logic in routes
- No commits in repositories
- No HTTP exceptions in services

**Type Safety:**
- Type hints on all functions
- Use `Mapped[Type]` for model columns
- Use Pydantic DTOs for all API data

**Error Handling:**
- Domain exceptions in services
- HTTPException mapping in routes
- Proper rollback on failure

### Step 5: Self-Audit

Before finishing, verify using the checklist:
- [ ] Follows layered architecture?
- [ ] DTOs for all API data?
- [ ] Type hints complete?
- [ ] Transaction management correct?
- [ ] Eager loading for relationships?
- [ ] Migration created (if needed)?

### Step 6: Report

Provide a summary:
```
✅ Backend code created/updated!

Files changed:
- [file path]: [description]
- [file path]: [description]

Layers modified:
- Model: [Yes/No]
- Repository: [Yes/No]
- Service: [Yes/No]
- Route: [Yes/No]
- DTOs: [Yes/No]
- Migration: [Yes/No]

Key decisions:
- [Decision 1]
- [Decision 2]

Next steps (if any):
- [Step 1]
```

## Notes

- Keep changes minimal and focused
- Match existing code style in the project
- When in doubt, reference the skill files directly
- Ask for clarification if the request is ambiguous
- Always run `alembic upgrade head` after creating migrations