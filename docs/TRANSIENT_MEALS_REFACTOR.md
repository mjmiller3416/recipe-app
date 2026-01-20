# Transient Meals Refactor

## Context

Meal Genie has a two-tier meal planning architecture:
- **Meals**: Persistent compositions (main recipe + 0-3 side recipes)
- **PlannerEntries**: References to meals in the weekly queue with position/completion tracking

Currently, every meal created is automatically saved permanently. This creates clutter since most meal compositions are one-time contextual decisions, not reusable templates.

## Goal

Make meals **transient by default**. Meals should be automatically deleted when they leave the planner (completed or removed) unless explicitly saved by the user.

**New mental model:**
- Creating a meal = "I want to cook this combination this week"
- Saving a meal = "This combination is worth remembering for future weeks"

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Database Migration

Add `is_saved` boolean to the `meals` table:

```python
# New migration: add_is_saved_to_meals.py
# Add column: is_saved BOOLEAN NOT NULL DEFAULT FALSE
# For existing data: SET is_saved = is_favorite (preserve only favorited meals)
```

#### 1.2 Model Update (`backend/app/models/meal.py`)

Add the new field:
```python
is_saved: Mapped[bool] = mapped_column(Boolean, default=False)
```

#### 1.3 DTO Updates (`backend/app/dtos/meal_dtos.py`)

- Add `is_saved: bool` to `MealResponseDTO`
- Add `is_saved: bool = False` to `MealCreateDTO` (optional, defaults to False)
- Create `MealSaveDTO` if needed for the save action

#### 1.4 Meal Repository (`backend/app/repositories/meal_repo.py`)

Add methods:
```python
def get_saved_meals(self) -> List[Meal]:
    """Get only meals where is_saved=True"""
    
def count_planner_references(self, meal_id: int) -> int:
    """Count how many non-cleared planner entries reference this meal"""
```

#### 1.5 Planner Service (`backend/app/services/planner_service.py`)

**Critical change**: Add cleanup logic when entries are removed or completed:

```python
def _cleanup_transient_meal(self, meal_id: int) -> None:
    """Delete meal if it's transient and has no remaining planner references."""
    meal = self.meal_repo.get_by_id(meal_id)
    if meal and not meal.is_saved:
        remaining = self.repo.count_active_entries_for_meal(meal_id)
        if remaining == 0:
            self.meal_repo.delete(meal_id)
```

Call this cleanup in:
- `remove_entry()` - after removing an entry
- `mark_entry_complete()` - after marking complete (if you want immediate cleanup)
- `clear_planner()` - after clearing all entries
- `clear_completed()` - after clearing completed entries

**Decision point**: Should completed meals be deleted immediately, or only when explicitly cleared? I recommend deleting when the entry is removed/cleared, but keeping completed entries (and their meals) visible until the user clears them.

#### 1.6 Meal Service (`backend/app/services/meal_service.py`)

Add save/unsave methods:
```python
def save_meal(self, meal_id: int) -> Optional[MealResponseDTO]:
    """Mark a meal as saved (persistent)."""
    
def unsave_meal(self, meal_id: int) -> Optional[MealResponseDTO]:
    """Mark a meal as transient. Will be deleted when it leaves the planner."""
```

#### 1.7 API Endpoints (`backend/app/api/meals.py`)

Add new endpoint:
```python
@router.post("/{meal_id}/save", response_model=MealResponseDTO)
def toggle_save_meal(meal_id: int, session: Session = Depends(get_session)):
    """Toggle the saved status of a meal."""
```

Or separate endpoints:
```python
@router.post("/{meal_id}/save")
@router.delete("/{meal_id}/save")  # unsave
```

#### 1.8 Filtering Updates

Update `GET /api/meals` to support filtering:
- `?saved=true` - Only saved meals (for "Saved Meals" tab)
- `?saved=false` - Only transient meals
- No filter - All meals

### Phase 2: Frontend Changes

#### 2.1 Type Updates (`frontend/src/types/index.ts`)

Add `is_saved` to meal-related types:
```typescript
interface MealResponseDTO {
  // ... existing fields
  is_saved: boolean;
}

interface SavedMeal {
  // ... existing fields
  is_saved: boolean;
}
```

#### 2.2 API Client (`frontend/src/lib/api.ts`)

Add save meal function:
```typescript
saveMeal: (mealId: number) => 
  fetch(`/api/meals/${mealId}/save`, { method: 'POST' }),
```

#### 2.3 useMealPlanner Hook (`frontend/src/hooks/useMealPlanner.ts`)

- Update `savedMeals` fetch to filter `?saved=true`
- Add `saveMeal` action:
```typescript
saveMeal: async (mealId: number) => {
  await plannerApi.saveMeal(mealId);
  // Refetch or optimistically update
}
```

#### 2.4 Saved Meals Tab (in MealDialog)

The "Saved Meals" tab should now only show meals with `is_saved=true`. This may already work if the API filters correctly.

If the saved meals list is empty, show appropriate empty state: "No saved meals yet. Save a meal from your planner to reuse it later."

#### 2.5 SelectedMealView Component

Add a "Save Meal" button/action for meals that aren't yet saved:

```tsx
{!selectedEntry.isSaved && (
  <Button variant="outline" onClick={() => actions.saveMeal(selectedEntry.mealId)}>
    <Bookmark className="h-4 w-4 mr-2" />
    Save Meal
  </Button>
)}
```

Or make it a toggle (bookmark icon that fills when saved).

#### 2.6 MealSidebarCard / MealQueueItem

Consider adding a visual indicator for saved vs transient meals (subtle bookmark icon, etc.). This is optional but helps users understand the new system.

#### 2.7 Completion Flow (Optional Enhancement)

When marking a meal complete, optionally prompt: "Save this meal for next time?"

This could be a toast with action button rather than a modal to keep the flow smooth.

#### 2.8 Stats Components

Review any components that display meal-level stats:
- Dashboard widgets showing "times cooked" at meal level need adjustment
- Consider moving these stats to recipe level instead (more meaningful)
- Or only show stats for saved meals

### Phase 3: Migration & Testing

#### 3.1 Data Migration Strategy

```sql
-- Option A: Preserve all existing meals as saved
ALTER TABLE meals ADD COLUMN is_saved BOOLEAN NOT NULL DEFAULT TRUE;

-- Option B: Only preserve favorited meals (recommended)
ALTER TABLE meals ADD COLUMN is_saved BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE meals SET is_saved = is_favorite;
```

#### 3.2 Testing Checklist

Backend:
- [ ] Create meal → verify `is_saved=False` by default
- [ ] Add meal to planner → meal exists
- [ ] Remove entry → transient meal deleted, saved meal persists
- [ ] Complete entry → behavior matches design decision
- [ ] Clear completed → transient meals cleaned up
- [ ] Save meal → `is_saved=True`, persists after removal
- [ ] Unsave meal → becomes transient
- [ ] GET /api/meals?saved=true → only saved meals

Frontend:
- [ ] Create meal → appears in planner
- [ ] "Saved Meals" tab → shows only saved meals
- [ ] Save button → meal persists after completion
- [ ] Visual indicator for saved status
- [ ] Empty state for no saved meals

## Files to Modify

### Backend
- `backend/app/models/meal.py` - Add `is_saved` field
- `backend/app/dtos/meal_dtos.py` - Add to DTOs
- `backend/app/repositories/meal_repo.py` - Add helper methods
- `backend/app/repositories/planner_repo.py` - Add count method
- `backend/app/services/meal_service.py` - Add save/unsave
- `backend/app/services/planner_service.py` - Add cleanup logic
- `backend/app/api/meals.py` - Add save endpoint
- `backend/app/api/planner.py` - Ensure cleanup is called
- New migration file

### Frontend
- `frontend/src/types/index.ts` - Add `is_saved` to types
- `frontend/src/lib/api.ts` - Add saveMeal API call
- `frontend/src/hooks/useMealPlanner.ts` - Add save action, update fetch
- `frontend/src/app/meal-planner/_components/SelectedMealView.tsx` - Add save button
- `frontend/src/app/meal-planner/_components/sidebar/MealSidebarCard.tsx` - Optional indicator
- `frontend/src/app/meal-planner/_components/meal-dialog/MealDialog.tsx` - Empty state for saved tab

## Important Considerations

1. **Cascade behavior**: When a meal is deleted, its planner entries cascade delete. But we're doing the reverse - deleting meals when entries are removed. Make sure to delete the entry first, THEN check if meal should be cleaned up.

2. **Race conditions**: If the same meal is added to planner twice (allowed currently), removing one entry shouldn't delete the meal if another entry still references it.

3. **Favorite vs Saved**: Keep both fields. `is_favorite` is for prioritizing within saved meals. A meal must be `is_saved=True` to have `is_favorite=True` matter.

4. **Stats preservation**: If you want to track "times cooked" historically, consider:
   - Moving this stat to Recipe level (aggregate all meals using that recipe)
   - Or keeping a separate `cooking_history` table that doesn't depend on meal persistence

## Start Here

1. Create and run the database migration
2. Update the Meal model and DTOs
3. Implement the cleanup logic in PlannerService
4. Add the save endpoint
5. Update frontend types and API client
6. Add the save button to SelectedMealView
7. Test the full flow