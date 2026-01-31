---
name: backend-dev
description: |
  🚨 MANDATORY BEFORE ANY BACKEND EDITS 🚨

  REQUIRED for ANY work involving backend/ files. MUST invoke BEFORE making changes to:
  - Files matching: backend/app/**/*.py
  - API routes, services, repositories, models, DTOs
  - Database migrations, queries, transactions
  - Any bug fixes, features, or refactoring in backend code

  ⚠️ EDITING WITHOUT THIS CONTEXT WILL BREAK ARCHITECTURE PATTERNS ⚠️

  Trigger phrases: "fix backend", "add endpoint", "update service", "database", "API", "repository", "500 error", "backend bug"

  Provides: layered architecture rules, transaction patterns, naming conventions, DTO templates, SQLAlchemy patterns, code review checklist.
---

# Backend Development Skill

**⚠️ THIS SKILL MUST BE INVOKED BEFORE ANY BACKEND CODE CHANGES ⚠️**

Backend architecture rules and patterns for Meal Genie. For code examples, reference existing implementations in the codebase.

## Architecture

```
Routes (app/api/)           → HTTP concerns: validation, error mapping
    ↓
Services (app/services/)    → Business logic: orchestration, transactions
    ↓
Repositories (app/repositories/) → Data access: queries, CRUD
    ↓
Models (app/models/)        → Schema: columns, relationships
```

Every route injects `current_user` via dependency. Services and repos receive `(session, user_id)` for tenant isolation.

## Layer Rules (Never Violate)

| Rule | Wrong | Right |
|------|-------|-------|
| Business logic location | Complex logic in route | Move to service |
| Model imports in routes | `from app.models import Recipe` | Use DTOs for responses |
| HTTP errors in services | `raise HTTPException(404)` | `raise RecipeNotFoundError()` |
| Commits in repositories | `self.session.commit()` | Service commits, repo uses `flush()` |
| Raw SQL in services | `session.execute("SELECT...")` | Call repository method |
| Response types | `return recipe.__dict__` | `return RecipeResponseDTO.from_model(recipe)` |

## Transaction Pattern

```python
# Service handles transactions
class ThingService:
    def __init__(self, session: Session, user_id: int):
        self.session = session
        self.repo = ThingRepo(session, user_id)

    def create(self, dto: ThingCreateDTO) -> Thing:
        try:
            thing = self.repo.create(dto)
            self.session.commit()
            return thing
        except Exception:
            self.session.rollback()
            raise

# Repository does NOT commit
class ThingRepo:
    def create(self, dto: ThingCreateDTO) -> Thing:
        thing = Thing(**dto.model_dump())
        self.session.add(thing)
        self.session.flush()  # Get ID without committing
        return thing
```

## Exception Pattern

Services define domain exceptions. Routes map them to HTTP status codes.

```python
# In service
class RecipeNotFoundError(Exception): pass
class DuplicateRecipeError(Exception): pass

# In route
except RecipeNotFoundError:
    raise HTTPException(status_code=404, detail="Recipe not found")
except DuplicateRecipeError as e:
    raise HTTPException(status_code=409, detail=str(e))
```

## Naming Conventions

| Layer | File | Class |
|-------|------|-------|
| Model | `shopping_item.py` | `ShoppingItem` |
| DTO | `shopping_item_dtos.py` | `ShoppingItemCreateDTO`, `ShoppingItemResponseDTO` |
| Repository | `shopping_item_repo.py` | `ShoppingItemRepo` |
| Service | `shopping_item_service.py` | `ShoppingItemService` |
| Route | `shopping_items.py` (plural) | `router = APIRouter()` |

### DTO Suffixes

| Purpose | Suffix | Notes |
|---------|--------|-------|
| Creation | `CreateDTO` | Required fields |
| Updates | `UpdateDTO` | All Optional fields |
| Responses | `ResponseDTO` | Has `from_model()` classmethod |
| List views | `CardDTO` | Lightweight subset |
| Query params | `FilterDTO` | Includes pagination |

## New Feature Workflow

Create in this order:

1. **Model** (`app/models/`) — SQLAlchemy 2.0 style with `Mapped` annotations
2. **Migration** — `alembic revision --autogenerate -m "description"`
3. **DTOs** (`app/dtos/`) — Create, Update, Response, optionally Card/Filter
4. **Repository** (`app/repositories/`) — Takes `(session, user_id)`
5. **Service** (`app/services/`) — Takes `(session, user_id)`, creates repo internally
6. **Route** (`app/api/`) — Uses `Depends(get_current_user)`
7. **Register** in `main.py`

Always include `user_id` FK with `ondelete="CASCADE"` and `index=True` on domain models.

## Key Patterns (Reference Existing Code)

| Pattern | Reference File |
|---------|----------------|
| Model with relationships | `app/models/recipe.py` |
| Repository with eager loading | `app/repositories/recipe_repo.py` |
| Service with transactions | `app/services/recipe_service.py` |
| Route with error handling | `app/api/recipes.py` |
| Full DTO set | `app/dtos/recipe_dtos.py` |
| AI service | `app/ai/services/meal_genie_service.py` |

## SQLAlchemy 2.0 Style

```python
# Required
from sqlalchemy.orm import Mapped, mapped_column

# Field definitions
id: Mapped[int] = mapped_column(primary_key=True)
name: Mapped[str] = mapped_column(String(255), nullable=False)
description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

# Relationships
recipes: Mapped[List["Recipe"]] = relationship(back_populates="user", cascade="all, delete-orphan")
```

## Query Patterns

```python
# Eager loading (avoid N+1)
stmt = select(Recipe).options(joinedload(Recipe.ingredients)).where(Recipe.id == id)
result = self.session.scalars(stmt).unique().first()

# Always .unique() after joinedload on collections
```

## Domain Constraints

| Feature | Limit | Enforced In |
|---------|-------|-------------|
| Planner entries | 15 max | `planner_service.py` |
| Side recipes per meal | 3 max | `meal_service.py` |
| Meal tags | 20 max, 50 chars each | `meal_dtos.py` |

## AI Module Structure

```
app/ai/
├── config/           # Prompts, model settings
├── dtos/             # AI-specific request/response
└── services/         # AI service implementations
```

AI services return DTOs with `success: bool` and either result or `error: str`.

## Quick Audit Checklist

Before completing backend work:

- [ ] Routes only handle HTTP (no business logic)?
- [ ] Services handle transactions (commit/rollback)?
- [ ] Repos never commit (only flush)?
- [ ] Domain exceptions in services, HTTPException only in routes?
- [ ] All API bodies use DTOs?
- [ ] Type hints on all signatures?
- [ ] Eager loading where needed?
- [ ] Migration created for model changes?
- [ ] user_id FK with CASCADE and index?