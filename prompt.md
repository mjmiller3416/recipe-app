## Context

I'm refactoring the meal planning backend in my Next.js + FastAPI app (MealGenie). The current implementation conflates two distinct concepts and has poor naming that obscures responsibility.

### Current State (Problems)

1. **Naming doesn't reflect responsibility:**
   - `MealSelection` → Actually represents a "Saved Meal" (reusable entity)
   - `SavedMealState` → Actually represents a "Planner Entry" (meal added to planner)
   - `planner_repo.py` / `planner_service.py` → Handle BOTH meal CRUD and planner state

2. **Side recipes use fixed slots with holes:**
   - Current: `side_recipe_1_id`, `side_recipe_2_id`, `side_recipe_3_id` columns
   - Problem: Deleting middle slot leaves holes (slot1=5, slot2=NULL, slot3=8)
   - Desired: Ordered list that stays contiguous

3. **Meals and Planner are coupled:**
   - Removing a meal from planner deletes the meal itself
   - Desired: Meals persist independently; planner just references them

### Target State

**Two distinct entities with clear separation:**

| Entity | Purpose | Persists? |
|--------|---------|-----------|
| `Meal` | Reusable saved meal (1 main + 0-3 side recipes) | Yes, until explicitly deleted |
| `PlannerEntry` | Reference to a meal in the active planner | Removed freely without affecting Meal |

**Workflow:**
1. User creates and saves a Meal
2. User adds that Meal to the Planner (creates PlannerEntry)
3. User can remove from Planner without destroying the Meal
4. User can reuse the same Meal in future planners

---

## Target Schema
```python
# meals table (rename from meal_selections)
class Meal:
    id: int  # PK
    meal_name: str  # Required, non-blank
    main_recipe_id: int  # FK → recipe.id, required, ON DELETE CASCADE
    side_recipe_ids: list[int]  # JSON array, 0-3 items, ordered
    is_favorite: bool = False
    tags: list[str] = []  # JSON array of strings (case-insensitive filtering)
    created_at: datetime

# planner_entries table (rename from saved_meal_states)  
class PlannerEntry:
    id: int  # PK
    meal_id: int  # FK → meals.id, ON DELETE CASCADE
    position: int  # 0-indexed, for drag-drop ordering
    is_completed: bool = False
    completed_at: datetime | None = None
    scheduled_date: date | None = None  # Future calendar feature, nullable for now
```

**Constraints:**
- Planner: 0-15 entries (enforce in service layer, not DB)
- Meal: 1 main (required) + 0-3 sides (JSON array)
- Deleting a Meal → CASCADE deletes its PlannerEntry
- Deleting a Recipe:
  - If recipe is a Meal's main → CASCADE deletes the Meal
  - If recipe is in a Meal's side_recipe_ids → Remove from JSON array

---

## File Operations

### CREATE (new files)
```
backend/app/core/models/meal.py           # Meal SQLAlchemy model
backend/app/core/models/planner_entry.py  # PlannerEntry SQLAlchemy model
backend/app/core/repositories/meal_repo.py
backend/app/core/services/meal_service.py
backend/app/core/dtos/meal_dtos.py
backend/app/api/meals.py                  # New router for Meal CRUD
backend/app/core/database/migrations/versions/xxxx_refactor_meals_and_planner.py
```

### MODIFY (update existing)
```
backend/app/core/repositories/planner_repo.py  # Strip to PlannerEntry ops only
backend/app/core/services/planner_service.py   # Strip to PlannerEntry ops only
backend/app/core/dtos/planner_dtos.py          # PlannerEntry DTOs only
backend/app/api/planner.py                     # Update to use new structure
backend/app/core/models/__init__.py            # Update exports
backend/app/core/repositories/__init__.py      # Update exports
backend/app/core/services/__init__.py          # Update exports
backend/app/core/dtos/__init__.py              # Update exports
backend/app/core/database/migrations/env.py    # Import new models
backend/app/core/services/shopping_service.py  # Update meal access method calls
backend/app/main.py                            # Register new meals router
```

### DELETE (remove after migration)
```
backend/app/core/models/meal_selection.py
backend/app/core/models/saved_meal_state.py
```

---

## Out-of-Scope but Required Fix

**Recipe deletion coordination** - Required for data integrity with new JSON array approach.

**Add to `recipe_service.py`:**
```python
def get_recipe_deletion_impact(recipe_id: int) -> dict:
    """
    Returns meals affected by deleting this recipe.
    
    Returns:
        {
            "meals_to_delete": [...],  # Recipe is main_recipe_id
            "meals_to_update": [...]   # Recipe is in side_recipe_ids
        }
    """
```

**Add to `api/recipes.py`:**
```python
@router.get("/{recipe_id}/deletion-impact")
def get_deletion_impact(recipe_id: int) -> RecipeDeletionImpactDTO
```

**Update `recipe_service.delete_recipe()`:**
- Before deleting, clean up side_recipe_ids arrays in affected meals
- Meals with recipe as main will CASCADE delete automatically

This enables the frontend to show a confirmation dialog before recipe deletion.

---

## Detailed Requirements

### Meal Entity

**Fields:**
- `meal_name`: Required, non-blank, max 255 chars
- `main_recipe_id`: Required FK, CASCADE on recipe delete
- `side_recipe_ids`: JSON array of integers, max 3 items, maintains order
- `is_favorite`: Boolean, default false
- `tags`: JSON array of strings, user-defined, case-insensitive filtering
- `created_at`: Timestamp, auto-set on creation

**Operations:**
- Create meal (main recipe required)
- Update meal name, main recipe, sides, favorite, tags
- Delete meal (cascades to planner entries)
- List meals with filtering (name search, tags, favorites - stackable)
- Get meals by recipe ID (for deletion impact check)

**Side Recipe Behavior:**
- Adding: Append to array (if length < 3)
- Removing: Filter out ID, array stays contiguous
- Reordering: Replace array with new order
- No holes ever

### PlannerEntry Entity

**Fields:**
- `meal_id`: Required FK to Meal, CASCADE on meal delete
- `position`: Integer for ordering (0-indexed)
- `is_completed`: Boolean, default false
- `completed_at`: Nullable datetime, set when is_completed becomes true
- `scheduled_date`: Nullable date, for future calendar feature

**Operations:**
- Add meal to planner (creates entry with next position)
- Remove meal from planner (deletes entry, does NOT delete Meal)
- Reorder entries (update positions)
- Mark entry complete/incomplete
- Get all entries (ordered by position)
- Clear planner (delete all entries)

**Constraints:**
- Max 15 entries (enforce in service, return error if exceeded)
- Positions should stay contiguous (0, 1, 2... not 0, 2, 5)

### Tag Filtering

- Store tags as-entered (preserve case for display)
- Filter case-insensitively (SQLite: use LOWER() or COLLATE NOCASE)
- Support filtering by multiple tags (AND logic: meal must have all specified tags)

---

## Migration Strategy

The migration must safely transform existing data:

1. Create new tables (`meals`, `planner_entries`) 
2. Migrate data from `meal_selections` → `meals`:
   - Copy `id`, `meal_name`, `main_recipe_id`, `created_at` (add if missing)
   - Transform slots to array: `[side_recipe_1_id, side_recipe_2_id, side_recipe_3_id]` filtered for non-null
   - Set `is_favorite = false`, `tags = []` for existing records
3. Migrate data from `saved_meal_states` → `planner_entries`:
   - Copy `meal_id`
   - Set `position` based on insertion order (or id order)
   - Set `is_completed = false`, `completed_at = null`, `scheduled_date = null`
4. Drop old tables

**Important:** Use batch operations in Alembic since SQLite doesn't support all ALTER operations.

---

## Safety Rails

- **DO NOT** edit any files outside the meal/planner/recipe domain unless blocking
- **DO NOT** modify frontend files
- **DO NOT** create backwards-compatible endpoints (breaking changes are acceptable)
- **DO** fix any blocking issues encountered, document in final summary
- **DO** prefer proper solutions over hacks
- **DO** cross-reference existing code patterns (e.g., how Recipe handles similar operations)

---

## Deliverables

### 1. Implementation

- [ ] New SQLAlchemy models (`Meal`, `PlannerEntry`)
- [ ] New repositories with clean separation
- [ ] New services with business logic
- [ ] New/updated DTOs
- [ ] Updated API routes
- [ ] Alembic migration (safe data transformation)
- [ ] Recipe deletion impact check (out-of-scope fix)

### 2. Tests

Create/update tests in `backend/tests/` for:

- [ ] Creating a meal (main required, sides optional)
- [ ] Updating meal (name, recipes, favorite, tags)
- [ ] Deleting a meal (verify planner entry cascades)
- [ ] Side recipe array operations (add, remove, reorder - no holes)
- [ ] Adding/removing meals from planner (meal persists after removal)
- [ ] Planner ordering (position management)
- [ ] Planner entry completion (is_completed, completed_at)
- [ ] Planner limit enforcement (max 15)
- [ ] Tag filtering (case-insensitive, multiple tags)
- [ ] Recipe deletion impact (which meals affected)
- [ ] Recipe deletion cascade (main) and cleanup (side)

### 3. Final Summary

Provide a detailed summary including:

- **Files created** (with brief description)
- **Files modified** (what changed and why)
- **Files deleted**
- **Out-of-scope fixes** (what, why, what changed)
- **Migration instructions** (how to run)
- **Test instructions** (how to run)
- **Breaking API changes** (old endpoint → new endpoint mapping)

---

## Reference: Current File Locations
```
backend/app/core/
├── models/
│   ├── meal_selection.py      # → DELETE, replace with meal.py
│   ├── saved_meal_state.py    # → DELETE, replace with planner_entry.py
│   └── recipe.py              # Reference for patterns
├── repositories/
│   ├── planner_repo.py        # → MODIFY (slim down)
│   └── recipe_repo.py         # Reference for patterns
├── services/
│   ├── planner_service.py     # → MODIFY (slim down)
│   ├── recipe_service.py      # → MODIFY (add deletion impact)
│   └── shopping_service.py    # → MODIFY (update meal access)
├── dtos/
│   ├── planner_dtos.py        # → MODIFY (slim down)
│   └── recipe_dtos.py         # Reference for patterns
└── database/
    └── migrations/
        └── versions/          # Add new migration here

backend/app/api/
├── planner.py                 # → MODIFY
└── recipes.py                 # → MODIFY (add deletion-impact endpoint)
```

---

Proceed methodically. Read existing files to understand patterns before implementing. Ask clarifying questions if any requirement is ambiguous.