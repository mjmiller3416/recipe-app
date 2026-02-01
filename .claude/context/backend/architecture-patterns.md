# Backend Architecture Patterns

**CRITICAL: Follow these patterns for ALL backend changes.**

## Layered Architecture (STRICT)

```
API Routes → Services → Repositories → Models
```

**Never skip layers. Never call Repository from Route.**

## When Creating New Features

### 1. New Endpoint Checklist

Before creating a new endpoint, check if similar exists:

```bash
# Search existing routes
grep -r "router.get\|router.post" backend/app/api/
```

**Existing endpoints you MUST reuse/extend:**
- `GET /api/recipes` - List recipes (add filters, don't duplicate)
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/{id}` - Get single recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe

Similar patterns exist for:
- `/api/meals`
- `/api/planner`
- `/api/shopping`
- `/api/meal-genie`

❌ **DON'T create** `/api/recipes/search` when `/api/recipes?search=...` works
❌ **DON'T create** `/api/favorites` when `/api/recipes?favorite=true` works
✅ **DO extend** existing endpoints with query params

### 2. New Service Method Checklist

**Before adding to service:**

1. Does similar logic exist? Search:
   ```bash
   grep -r "def.*recipe" backend/app/services/
   ```

2. Should this be in THIS service or another?
   - Recipe-specific logic → `recipe_service.py`
   - Meal-specific logic → `meal_service.py`
   - Planner-specific logic → `planner_service.py`
   - Cross-domain logic → Create in appropriate service, call from others

3. Does this need a repository method?
   - **YES if** touching database directly
   - **NO if** just orchestrating other services

### 3. Repository Pattern

**NEVER:**
- Put business logic in repositories
- Commit in repositories (services commit)
- Raise HTTPException (use domain exceptions)
- Call other repositories directly

**ALWAYS:**
- Keep it CRUD-focused
- Return models or None
- Let service handle transactions
- Use SQLAlchemy efficiently

### 4. DTO Pattern

**Every endpoint needs:**
- Request DTO (Pydantic model for input)
- Response DTO (Pydantic model for output)

**Check existing DTOs first:**
```bash
grep -r "class.*DTO" backend/app/dtos/
```

**Common mistake:** Creating `RecipeDetailDTO` when `RecipeResponseDTO` exists with all needed fields.

## Common Architectural Violations

### ❌ Wrong Layer
```python
# Route calling repository directly
@router.get("/recipes")
async def get_recipes(db: Session):
    return recipe_repo.get_all(db)  # WRONG - skip service layer
```

✅ **Correct:**
```python
@router.get("/recipes")
async def get_recipes(db: Session):
    return recipe_service.get_all_recipes(db)  # Service handles logic
```

### ❌ Service Committing Too Early
```python
# Service method
def create_recipe(db: Session, data: RecipeCreateDTO):
    recipe = Recipe(**data.dict())
    db.add(recipe)
    db.commit()  # WRONG if caller needs to add related data
    return recipe
```

✅ **Correct:**
```python
def create_recipe(db: Session, data: RecipeCreateDTO):
    recipe = Recipe(**data.dict())
    db.add(recipe)
    db.flush()  # Flush to get ID, but don't commit
    return recipe  # Let caller decide when to commit
```

### ❌ Duplicate Logic
```python
# Creating new service method when similar exists
def get_favorite_recipes(db: Session):
    return db.query(Recipe).filter(Recipe.is_favorite == True).all()

# When this exists:
def get_recipes(db: Session, filters: RecipeFilters):
    query = db.query(Recipe)
    if filters.is_favorite:
        query = query.filter(Recipe.is_favorite == True)
    return query.all()
```

✅ **Extend existing, don't duplicate**

## Decision Tree: Where Does This Logic Go?

```
Is it HTTP-specific (status codes, headers)?
  YES → API Route
  NO ↓

Does it involve business rules or orchestration?
  YES → Service
  NO ↓

Is it database access (CRUD)?
  YES → Repository
  NO ↓

Is it data transformation/validation?
  YES → DTO or Utility
```

## Pre-Flight Questions

Before writing ANY backend code:

1. **Does this endpoint/method already exist?**
   - Search routes, services, repositories

2. **Am I following the layer pattern?**
   - Route → Service → Repository → Model

3. **Do I need a new DTO or does one exist?**
   - Check `/app/dtos/` first

4. **Is this the right service for this logic?**
   - Recipe logic in recipe_service, not meal_service

5. **Am I duplicating existing functionality?**
   - Extend with parameters, don't duplicate

## When In Doubt

**ASK before creating:**
- New services
- New repositories
- New DTOs (if similar exists)
- New endpoints (if existing can be extended)

**DON'T ask before:**
- Adding method to existing service (if it fits domain)
- Adding filter param to existing endpoint
- Creating test for new feature
