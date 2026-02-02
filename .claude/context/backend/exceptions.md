# Exception Handling

**Services raise domain exceptions, routes map them to HTTPException. NEVER mix the two.**

## Critical Rule: Exception Separation

```python
# ✅ Service raises domain exception
class RecipeService:
    def get(self, recipe_id: int) -> Recipe:
        recipe = self.repo.get_by_id(recipe_id)
        if not recipe:
            raise RecipeNotFoundError(f"Recipe {recipe_id} not found")
        return recipe

# ✅ Route maps to HTTPException
@router.get("/{recipe_id}")
def get_recipe(recipe_id: int, session: Session = Depends(get_session)):
    service = RecipeService(session)
    try:
        recipe = service.get(recipe_id)
        return RecipeResponseDTO.from_model(recipe)
    except RecipeNotFoundError:
        raise HTTPException(status_code=404, detail="Recipe not found")

# ❌ NEVER - Service raises HTTPException
class RecipeService:
    def get(self, recipe_id: int) -> Recipe:
        if not recipe:
            raise HTTPException(status_code=404, ...)  # WRONG!
```

## Domain Exception Naming

Define exceptions at the **top of each service file:**

```python
# app/services/recipe_service.py

# ── Domain Exceptions ────────────────────────────────────────────────────
class RecipeNotFoundError(Exception):
    """Raised when recipe is not found."""
    pass

class DuplicateRecipeError(Exception):
    """Raised when recipe with same name already exists."""
    pass

class RecipeSaveError(Exception):
    """Raised when recipe cannot be saved."""
    pass

class RecipeValidationError(Exception):
    """Raised when recipe data is invalid."""
    pass
```

**Naming patterns:**
- `EntityNotFoundError` - resource doesn't exist
- `DuplicateEntityError` - resource already exists
- `EntitySaveError` - database operation failed
- `EntityValidationError` - business rule violation
- `EntityLimitError` - constraint exceeded

## Exception Mapping by Layer

| Layer | Exception Type | Examples |
|-------|---------------|----------|
| Services | Domain exceptions | `RecipeNotFoundError`, `DuplicateMealError` |
| Routes | `HTTPException` only | 404, 409, 400, 500 |
| Repositories | None (return `None` or `[]`) | Don't raise exceptions |

## HTTP Status Code Mapping

| Domain Exception | HTTP Status | When |
|-----------------|-------------|------|
| `NotFoundError` | 404 | Resource doesn't exist |
| `DuplicateError` | 409 | Resource already exists |
| `LimitError` | 409 | Constraint exceeded |
| `ValidationError` | 400 | Invalid input data |
| `SaveError` / `DeleteError` | 500 | Database failure |

## Error Messages (User-Friendly)

```python
# ✅ Good - clear and helpful
raise RecipeNotFoundError(f"Recipe {recipe_id} not found")
raise DuplicateRecipeError(f"Recipe '{dto.name}' already exists")
raise PlannerLimitError("Maximum 15 planner entries allowed")

# ❌ Bad - vague or technical
raise RecipeNotFoundError("Not found")
raise DuplicateRecipeError("Integrity constraint violation")
```

**See:** [app/services/recipe_service.py](../../backend/app/services/recipe_service.py) and [app/api/recipes.py](../../backend/app/api/recipes.py) for complete reference implementations.
