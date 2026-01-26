# Backend Development Skill

## Purpose

This skill provides comprehensive guidance for creating and modifying backend code in the Meal Genie application following the established layered architecture. It ensures consistency, maintainability, and proper separation of concerns across all Python/FastAPI code.

## When to Use

- Creating new API endpoints or features
- Adding new database models or modifying existing ones
- Implementing business logic in services
- Creating or updating DTOs for request/response validation
- Adding AI-powered features with Gemini integration
- Writing database migrations

## Quick Reference

### Layered Architecture

```
API Routes (app/api/)          ← HTTP layer: validation, routing, error handling
    ↓
Services (app/services/)       ← Business logic: orchestration, transactions
    ↓
Repositories (app/repositories/) ← Data access: queries, CRUD operations
    ↓
Models (app/models/)           ← SQLAlchemy ORM: table definitions
```

### Critical Rules (Never Violate)

| Rule | Bad | Good |
|------|-----|------|
| No raw SQL in services | `session.execute("SELECT...")` | Use repository methods |
| No business logic in routes | Complex calculations in route | Move to service layer |
| No direct model imports in routes | `from app.models import Recipe` | Use DTOs for responses |
| No session management in repos | `session.commit()` in repo | Service handles transactions |
| Always use DTOs for API | `return recipe.__dict__` | `return RecipeResponseDTO(...)` |
| Type hints required | `def get(id):` | `def get(id: int) -> Recipe:` |

### Import Patterns

```python
# API Routes
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.db import get_session
from app.dtos.recipe_dtos import RecipeCreateDTO, RecipeResponseDTO
from app.services.recipe_service import RecipeService

# Services
from sqlalchemy.orm import Session
from app.repositories.recipe_repo import RecipeRepo
from app.dtos.recipe_dtos import RecipeCreateDTO, RecipeUpdateDTO

# Repositories
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from app.models.recipe import Recipe

# Models
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
```

### DTO Naming Conventions

| Purpose | Suffix | Example |
|---------|--------|---------|
| Create requests | `CreateDTO` | `RecipeCreateDTO` |
| Update requests | `UpdateDTO` | `RecipeUpdateDTO` |
| API responses | `ResponseDTO` | `RecipeResponseDTO` |
| Filter/query params | `FilterDTO` | `RecipeFilterDTO` |
| Lightweight cards | `CardDTO` | `RecipeCardDTO` |

### Error Handling Pattern

```python
# In services - define domain exceptions
class RecipeSaveError(Exception):
    pass

class DuplicateRecipeError(Exception):
    pass

# In routes - map to HTTP errors
try:
    recipe = service.create_recipe(data)
    return RecipeResponseDTO.from_model(recipe)
except DuplicateRecipeError as e:
    raise HTTPException(status_code=409, detail=str(e))
except RecipeSaveError as e:
    raise HTTPException(status_code=500, detail=str(e))
```

### Session & Transaction Pattern

```python
# Service handles transactions
class RecipeService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = RecipeRepo(session)

    def create_recipe(self, dto: RecipeCreateDTO) -> Recipe:
        try:
            recipe = self.repo.persist_recipe(dto)
            self.session.commit()  # ✅ Service commits
            return recipe
        except Exception as e:
            self.session.rollback()  # ✅ Service rolls back
            raise

# Repository does NOT commit
class RecipeRepo:
    def persist_recipe(self, dto: RecipeCreateDTO) -> Recipe:
        recipe = Recipe(**dto.model_dump())
        self.session.add(recipe)
        self.session.flush()  # ✅ Flush to get ID, but don't commit
        return recipe
```

## Workflow

### 1. Determine the Scope

Before coding, identify which layers need changes:

- **New endpoint?** → API route + possibly service + DTOs
- **New entity?** → Model + Repository + Service + DTOs + Route + Migration
- **Business logic change?** → Service layer only
- **Query optimization?** → Repository layer only

### 2. Start Bottom-Up

When creating new features:

1. **Model** - Define the SQLAlchemy model
2. **Migration** - Create Alembic migration
3. **DTOs** - Define request/response schemas
4. **Repository** - Implement data access
5. **Service** - Implement business logic
6. **Route** - Expose via API

### 3. Follow Existing Patterns

Check similar existing code for patterns:

```bash
# Find similar services
grep -r "class.*Service" backend/app/services/

# Find similar routes
grep -r "@router\." backend/app/api/

# Find similar DTOs
grep -r "class.*DTO" backend/app/dtos/
```

### 4. Self-Audit Checklist

Before completing any backend code:

- [ ] Using layered architecture (route → service → repo → model)?
- [ ] DTOs for all API request/response bodies?
- [ ] Type hints on all function signatures?
- [ ] Transaction management in service layer?
- [ ] Domain exceptions (not HTTPException) in services?
- [ ] Proper eager loading to avoid N+1 queries?
- [ ] Migration created for model changes?

## AI Module Structure

For AI-powered features, follow this structure:

```
app/ai/
├── config/           # AI configuration (prompts, model settings)
│   └── feature_config.py
├── dtos/             # AI-specific DTOs
│   └── feature_dtos.py
└── services/         # AI service implementations
    └── feature_service.py
```

### AI Service Pattern

```python
# config/cooking_tips_config.py
MODEL_NAME = "gemini-2.0-flash"
TEMPERATURE = 0.9
API_KEY_ENV_VAR = "GEMINI_API_KEY"

# services/cooking_tip_service.py
class CookingTipService:
    def __init__(self):
        self.client = self._init_client()

    def generate_tip(self) -> CookingTipResponseDTO:
        try:
            response = self.client.generate_content(...)
            return CookingTipResponseDTO(success=True, tip=response.text)
        except Exception as e:
            return CookingTipResponseDTO(success=False, error=str(e))
```

## Related Files

- [patterns.md](patterns.md) - Detailed layer-specific patterns and examples
- [checklist.md](checklist.md) - Full compliance checklist for code reviews

## Development Commands

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS

# Run dev server
python -m uvicorn app.main:app --reload --port 8000

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Run tests
pytest
pytest tests/test_file.py -v
```