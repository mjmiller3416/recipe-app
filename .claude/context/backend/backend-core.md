# Backend Core

**Critical architecture - ALWAYS follow layered pattern.**

## Architecture

```
Routes (app/api/)        → HTTP: validation, error mapping
    ↓
Services (app/services/) → Business logic, transactions (COMMIT here)
    ↓
Repositories (app/repositories/) → Data access (FLUSH only, no commit)
    ↓
Models (app/models/)     → Schema, relationships
```

Every route injects `current_user`. Services/repos receive `(session, user_id)` for tenant isolation.

## Never Violate

| Wrong | Right |
|-------|-------|
| Business logic in route | Move to service |
| `raise HTTPException()` in service | Raise domain exception (e.g., `RecipeNotFoundError`) |
| `self.session.commit()` in repo | Service commits, repo uses `flush()` |
| `return recipe.__dict__` | `return RecipeResponseDTO.from_model(recipe)` |
| Import models in routes | Use DTOs only |

## Pre-Edit Checklist

- [ ] Routes only handle HTTP, no business logic?
- [ ] Services commit, repos flush only?
- [ ] Domain exceptions in services, HTTPException in routes?
- [ ] All request/response use DTOs?
- [ ] Type hints on signatures?

See services.md for transactions. See repositories.md for query patterns. See exceptions.md for error handling.
