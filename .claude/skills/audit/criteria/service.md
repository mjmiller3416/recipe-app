# Service Audit Criteria

> Backend service audit checklist. Applied with `general.md`.
> Also applicable to repository files when checking flush/commit rules.

## Reference Standards

- `@.claude/context/backend/backend-core.md` — Critical rules, layered architecture, pre-edit checklist
- `@.claude/context/backend/architecture.md` — Layer responsibilities, forbidden patterns, dependency flow
- `@.claude/context/backend/services.md` — Transaction pattern, domain exceptions, modular service packages
- `@.claude/context/backend/exceptions.md` — Exception naming, mapping by layer, HTTP status mapping
- `@.claude/context/backend/repositories.md` — Flush-only rule, user isolation, query patterns

---

## Checklist

### Transaction Management (CRITICAL)

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| S.1 | Service calls `session.commit()` after write operations | Error | _(write method missing commit)_ |
| S.2 | Service calls `session.rollback()` in exception handlers for write operations | Error | `except.*:` blocks without `rollback` in write methods |
| S.3 | Read-only operations do NOT call commit or rollback | Warning | `commit\(\)` in a get/list method |
| S.4 | Repository NEVER calls `session.commit()` — flush only | Error | `commit\(\)` in a repository file |

### Error Handling

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| S.5 | Domain exceptions defined at top of service file | Warning | _(exceptions defined elsewhere or missing)_ |
| S.6 | Services raise domain exceptions, NEVER `HTTPException` | Error | `from fastapi import.*HTTPException` or `raise HTTPException` in service |
| S.7 | Exception names follow `<Entity><Problem>Error` pattern (e.g., `RecipeNotFoundError`) | Suggestion | _(visual check)_ |
| S.8 | Error messages are user-friendly and descriptive | Suggestion | _(visual check)_ |

### Architecture Boundaries

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| S.9 | Constructor takes `(session: Session, user_id: int)` and creates repo internally | Warning | _(visual: constructor signature)_ |
| S.10 | No direct DB queries — all data access through repository | Error | `select\(` or `session\.query\(` or `session\.execute\(` in service |
| S.11 | No HTTP concerns — no status codes, request/response objects | Error | `HTTPException\|status_code\|Request\|Response` in service |
| S.12 | All data access filtered by `user_id` for multi-tenant isolation | Error | _(repo queries missing user_id filter)_ |

### Type Safety

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| S.13 | All method signatures have parameter types and return type | Warning | `def .*\):\s*$` (missing return type) |
| S.14 | Nullable returns use `Optional[]` or `\| None` | Warning | _(visual check)_ |

---

## Common Anti-Patterns

| Pattern | Severity | Grep Pattern |
|---------|----------|-------------|
| `from fastapi import HTTPException` in a service file | Error | `from fastapi import.*HTTPException` |
| `session.commit()` inside a repository | Error | _(check repo files for commit)_ |
| Missing `rollback()` in except blocks for write operations | Error | _(visual: try/except without rollback)_ |
| Business logic in a repository (validation, conditional logic beyond query building) | Warning | _(visual check)_ |
| Service importing and using another service's repository directly | Warning | _(visual: importing a repo not owned by this service)_ |
