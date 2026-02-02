# Services (Business Logic Layer)

**Services handle business logic, transactions, and domain exceptions. They are the ONLY layer that commits.**

## Service Responsibilities

**Services handle:**
- Business logic and validation
- Transaction management (commit/rollback)
- Multi-repository coordination
- Domain exception raising

**Services do NOT:**
- ❌ Raise `HTTPException` (use domain exceptions)
- ❌ Make direct session queries (use repositories)
- ❌ Return models to routes (routes convert to DTOs)

## Required Structure

```python
class EntityService:
    def __init__(self, session: Session, user_id: int):
        self.session = session
        self.user_id = user_id
        self.repo = EntityRepo(session, user_id)  # Create repo internally
```

## Transaction Pattern (CRITICAL)

```python
# ✅ Standard transaction pattern
def create(self, dto: CreateDTO) -> Model:
    try:
        # 1. Business validation
        if self.repo.exists(dto.name):
            raise DuplicateError("Already exists")

        # 2. Database operations
        entity = self.repo.create(dto)

        # 3. COMMIT on success (service commits, not repo)
        self.session.commit()

        return entity
    except SQLAlchemyError as e:
        # 4. ROLLBACK on failure
        self.session.rollback()
        # 5. Re-raise as domain exception
        raise SaveError(f"Failed: {e}") from e
```

**Read-only operations don't need commit/rollback:**

```python
def get(self, entity_id: int) -> Entity:
    entity = self.repo.get_by_id(entity_id)
    if not entity:
        raise EntityNotFoundError(f"Entity {entity_id} not found")
    return entity  # No commit needed
```

## Domain Exceptions (Define at Top of Service)

```python
# Define exceptions at top of service file
class EntityNotFoundError(Exception):
    """Raised when entity is not found."""
    pass

class DuplicateEntityError(Exception):
    """Raised when entity already exists."""
    pass

class EntitySaveError(Exception):
    """Raised when entity cannot be saved."""
    pass

class EntityValidationError(Exception):
    """Raised when entity data is invalid."""
    pass
```

## When to Raise Exceptions

| Scenario | Exception | Example |
|----------|-----------|---------|
| Resource not found | `NotFoundError` | `raise RecipeNotFoundError(f"Recipe {id} not found")` |
| Duplicate/conflict | `DuplicateError` | `raise DuplicateRecipeError(f"Recipe '{name}' exists")` |
| Business rule violation | `ValidationError` | `raise RecipeValidationError("Servings must be >= 1")` |
| Database failure | `SaveError` | `raise RecipeSaveError(f"Failed: {e}") from e` |
| Constraint exceeded | `LimitError` | `raise PlannerLimitError("Max 15 entries allowed")` |

## Multi-Repository Coordination

```python
def create_with_related(self, dto: DTO) -> Entity:
    try:
        # Multiple repos in ONE transaction
        entity = self.entity_repo.create(dto)
        related = self.related_repo.create_for(entity.id, dto.related)

        # Single commit for all operations
        self.session.commit()
        return entity
    except SQLAlchemyError as e:
        # Rollback ALL operations
        self.session.rollback()
        raise SaveError(f"Failed: {e}") from e
```

## Partial Updates

```python
def update(self, entity_id: int, dto: UpdateDTO) -> Entity:
    entity = self.repo.get_by_id(entity_id)
    if not entity:
        raise EntityNotFoundError(f"Entity {entity_id} not found")

    try:
        # Only update provided fields
        update_data = dto.model_dump(exclude_unset=True)
        self.repo.update(entity, **update_data)

        self.session.commit()
        return entity
    except SQLAlchemyError as e:
        self.session.rollback()
        raise EntitySaveError(f"Failed: {e}") from e
```

## Modular Service Packages (Large Services)

Large services are split into Core + Mixins composed in `__init__.py`:

```python
# services/meal/__init__.py
from .core import MealServiceCore
from .side_recipes import SideRecipeMixin
from .query import QueryMixin

class MealService(SideRecipeMixin, QueryMixin, MealServiceCore):
    """Composed service with all meal functionality."""
    pass
```

**Current modular packages:**
- `services/meal/` — MealServiceCore + SideRecipeMixin + QueryMixin
- `services/planner/` — PlannerServiceCore + EntryManagementMixin + StatusManagementMixin + BatchOperationsMixin
- `services/shopping/` — ShoppingServiceCore + SyncMixin + ItemManagementMixin + AggregationMixin
- `services/data_management/` — backup.py, export_ops.py, import_ops.py, restore.py

**Simple services remain as flat files:** `recipe_service.py`, `ingredient_service.py`, `feedback_service.py`, `recipe_group_service.py`, `unit_conversion_service.py`, `usage_service.py`, `user_service.py`

**See:** [app/services/recipe_service.py](../../backend/app/services/recipe_service.py) for flat service reference, and [app/services/meal/](../../backend/app/services/meal/) for modular package reference.
