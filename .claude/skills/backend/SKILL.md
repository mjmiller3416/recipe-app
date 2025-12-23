---
name: meal-genie-backend
description: Backend architecture guidance for the Meal Genie recipe app. Use when working on FastAPI routes, SQLAlchemy models, repository/service patterns, Pydantic DTOs, database migrations, or API endpoint design. Provides project-specific conventions for the layered architecture (Routes → Services → Repositories → Models).
---

# Meal Genie Backend Skill

Architecture guidance for the Meal Genie FastAPI backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0+ |
| Validation | Pydantic 2.0+ |
| Migrations | Alembic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Server | Uvicorn |

## Architecture Overview

```
Request → Route (api/) → Service (services/) → Repository (repositories/) → Model (models/)
                ↓              ↓                      ↓                          ↓
              DTO in      Business logic        Data access              SQLAlchemy ORM
              DTO out     Orchestration         Query building           Database tables
```

### Layer Responsibilities

| Layer | Location | Responsibility | Returns |
|-------|----------|----------------|---------|
| Routes | `app/api/` | HTTP handling, validation, DI | DTOs |
| Services | `app/core/services/` | Business logic, orchestration | DTOs |
| Repositories | `app/core/repositories/` | Data access, queries | Models |
| Models | `app/core/models/` | ORM mapping, constraints | - |
| DTOs | `app/core/dtos/` | Request/response schemas | - |

## Domain Model

### Core Entities

```
Recipe ←──────── RecipeIngredient ────────→ Ingredient
   ↑
   │ main_recipe_id
   │
  Meal ─────────→ PlannerEntry
   │                   │
   │ side_recipe_ids   │ position, is_completed
   │ (JSON array)      │
   ↓                   ↓
[Recipe, Recipe]   [ordered list]
```

### Key Relationships

**Recipe → Meal → PlannerEntry** (the refactored model):
- `Meal` = saved combination (main recipe + up to 3 sides + tags)
- `PlannerEntry` = instance of a meal in the planner (position, completion state)
- Deleting a Meal cascades to its PlannerEntries
- Deleting a Recipe cascades to Meals where it's the main

**Recipe ↔ Ingredient** (many-to-many):
- `RecipeIngredient` junction table with quantity/unit
- Ingredients are get-or-create (deduped by name+category)

## Common Patterns

### Dependency Injection

```python
@router.get("/{id}", response_model=RecipeResponseDTO)
def get_recipe(
    id: int,
    session: Session = Depends(get_session)
):
    service = RecipeService(session)
    return service.get_recipe(id)
```

### Service → Repository Pattern

```python
class MealService:
    def __init__(self, session: Session):
        self.repo = MealRepo(session)
        self.recipe_repo = RecipeRepo(session)

    def create_meal(self, dto: MealCreateDTO) -> MealResponseDTO:
        # Validate business rules
        if not self.recipe_repo.get_by_id(dto.main_recipe_id):
            raise InvalidRecipeError(f"Recipe {dto.main_recipe_id} not found")

        # Create via repository
        meal = self.repo.create_meal(Meal(
            meal_name=dto.meal_name,
            main_recipe_id=dto.main_recipe_id,
            side_recipe_ids=dto.side_recipe_ids,
            tags=dto.tags
        ))

        # Return DTO
        return MealResponseDTO.model_validate(meal)
```

### Filtering Pattern

```python
def filter_recipes(self, filter_dto: RecipeFilterDTO) -> List[Recipe]:
    query = self.session.query(Recipe)

    if filter_dto.category:
        query = query.filter(Recipe.recipe_category == filter_dto.category)

    if filter_dto.search_term:
        query = query.filter(Recipe.recipe_name.ilike(f"%{filter_dto.search_term}%"))

    if filter_dto.is_favorite is not None:
        query = query.filter(Recipe.is_favorite == filter_dto.is_favorite)

    # Sorting
    sort_col = getattr(Recipe, filter_dto.sort_by, Recipe.created_at)
    query = query.order_by(
        sort_col.desc() if filter_dto.sort_direction == "desc" else sort_col.asc()
    )

    return query.offset(filter_dto.offset).limit(filter_dto.limit).all()
```

### Transaction with Rollback

```python
def create_with_ingredients(self, dto: RecipeCreateDTO) -> Recipe:
    try:
        recipe = Recipe(**dto.model_dump(exclude={"ingredients"}))
        self.session.add(recipe)
        self.session.flush()  # Get ID before commit

        for ing_dto in dto.ingredients:
            ingredient = self.ingredient_repo.get_or_create(ing_dto)
            self.session.add(RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ingredient.id,
                quantity=ing_dto.quantity,
                unit=ing_dto.unit
            ))

        self.session.commit()
        return recipe
    except Exception:
        self.session.rollback()
        raise
```

## DTO Patterns

### Pydantic v2 Configuration

```python
from pydantic import BaseModel, ConfigDict

class RecipeResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipe_name: str
    # ... fields match model attributes
```

### Create vs Update DTOs

```python
# Create: required fields explicit
class MealCreateDTO(BaseModel):
    meal_name: str                    # Required
    main_recipe_id: int               # Required
    side_recipe_ids: List[int] = []   # Optional with default
    tags: List[str] = []

# Update: all fields optional
class MealUpdateDTO(BaseModel):
    meal_name: Optional[str] = None
    main_recipe_id: Optional[int] = None
    side_recipe_ids: Optional[List[int]] = None
    tags: Optional[List[str]] = None
```

### Lightweight Card DTOs

For list views, use card DTOs that exclude heavy fields:

```python
class RecipeCardDTO(BaseModel):  # For grids/lists
    id: int
    recipe_name: str
    recipe_category: str
    total_time: Optional[int]
    reference_image_path: Optional[str]
    is_favorite: bool

class RecipeResponseDTO(RecipeCardDTO):  # Full detail
    directions: Optional[str]
    notes: Optional[str]
    ingredients: List[RecipeIngredientResponseDTO]
```

## Error Handling

### Custom Exceptions

```python
# Define in services
class RecipeSaveError(Exception): pass
class DuplicateRecipeError(Exception): pass
class InvalidRecipeError(Exception): pass
class MealNotFoundError(Exception): pass
class PlannerFullError(Exception): pass
```

### Route Error Handling

```python
@router.post("/", response_model=MealResponseDTO)
def create_meal(dto: MealCreateDTO, session: Session = Depends(get_session)):
    try:
        service = MealService(session)
        return service.create_meal(dto)
    except InvalidRecipeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MealSaveError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Constraints Reference

| Entity | Constraint | Limit |
|--------|------------|-------|
| PlannerEntry | Max entries | 15 |
| Meal | Max side recipes | 3 |
| Meal | Max tags | 20 |
| Meal | Tag length | 50 chars |
| Recipe | Name length | 255 chars |
| Pagination | Default limit | 100 |

## Reference Files

- **[domain-model.md](references/domain-model.md)** - Complete entity relationships, field definitions, cascade behaviors
- **[api-patterns.md](references/api-patterns.md)** - Endpoint conventions, request/response examples, error codes
- **[adding-features.md](references/adding-features.md)** - Step-by-step guide for adding new entities/endpoints

## File Locations

| Need to... | Path |
|------------|------|
| Add route | `app/api/` |
| Add model | `app/core/models/` |
| Add repository | `app/core/repositories/` |
| Add service | `app/core/services/` |
| Add DTOs | `app/core/dtos/` |
| Create migration | `alembic revision --autogenerate -m "description"` |
| Run migrations | `alembic upgrade head` |
