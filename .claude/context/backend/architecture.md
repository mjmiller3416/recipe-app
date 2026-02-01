# Backend Architecture

**Layered architecture - strict separation of concerns.**

## Layer Responsibilities

| Layer | Responsibilities | CANNOT Do |
|-------|-----------------|-----------|
| **Routes** (`app/api/`) | HTTP handling, validation, error mapping, DI | Business logic, direct DB queries, import models for responses |
| **Services** (`app/services/`) | Business logic, transactions (COMMIT), multi-repo orchestration | Raise HTTPException, direct session queries |
| **Repositories** (`app/repositories/`) | Data access, queries, FLUSH only | COMMIT, business logic, raise domain exceptions |
| **Models** (`app/models/`) | Schema, relationships, constraints | Business logic, queries, validation |

## Dependency Flow (CRITICAL)

```
Routes → Services → Repositories → Models
   ↓        ↓            ↓
 DTOs     DTOs        Models
```

**Forbidden:**
- ❌ Routes → Repositories (skip service)
- ❌ Routes → Models directly (use DTOs)
- ❌ Services → Raw SQL (use repos)
- ❌ Repositories → commit() (services handle transactions)

## User Isolation (EVERY Model)

```python
# REQUIRED on all domain models
user_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    index=True  # REQUIRED for performance
)

# REQUIRED in all repositories
def __init__(self, session: Session, user_id: int):
    self.user_id = user_id

# REQUIRED in all queries
.where(Entity.user_id == self.user_id)
```

## Transaction Management (Services Only)

```python
# ✅ Service commits
try:
    entity = self.repo.create(dto)
    self.session.commit()
    return entity
except SQLAlchemyError as e:
    self.session.rollback()
    raise SaveError(f"Failed: {e}") from e

# ✅ Repository flushes
def create(self, dto):
    entity = Entity(**dto.model_dump())
    self.session.add(entity)
    self.session.flush()  # NOT commit()
    return entity
```

## Error Handling

| Layer | Exception Type |
|-------|---------------|
| Services | Domain exceptions (RecipeNotFoundError, DuplicateMealError) |
| Routes | HTTPException only (404, 409, 500) |
| Repositories | None (return None or []) |

## New Feature Workflow

1. Model (`app/models/`) + Migration (`alembic revision --autogenerate`)
2. DTOs (`app/dtos/`) - Create, Update, Response, optionally Card
3. Repository (`app/repositories/`) - Takes `(session, user_id)`
4. Service (`app/services/`) - Takes `(session, user_id)`, commits transactions
5. Route (`app/api/`) - Uses `Depends(get_current_user)`, maps errors
6. Register in `main.py`

**See:** [app/services/recipe_service.py](../../backend/app/services/recipe_service.py) for complete reference implementation.
