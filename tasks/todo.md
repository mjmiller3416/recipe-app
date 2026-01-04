# Meal Stats Implementation

## Task
Add computed statistics to meals: total cook time, average servings, times cooked, and last cooked date.

## Todo List
- [x] Add stats fields to MealResponseDTO (backend DTO)
- [x] Add get_completion_stats_for_meal() to PlannerRepo
- [x] Update MealService._meal_to_response_dto() to compute and return stats
- [x] Add stats fields to MealSelectionResponseDTO (frontend types)
- [x] Add CSS variables for transparent teal surface
- [x] Create MealStats.tsx component (not integrated)

## Review

### Changes Made

**Backend (3 files):**
1. `backend/app/dtos/meal_dtos.py` - Added 4 optional stats fields to `MealResponseDTO`:
   - `total_cook_time`: Sum of all recipe times in minutes
   - `avg_servings`: Average servings rounded to nearest int
   - `times_cooked`: Count of completed planner entries
   - `last_cooked`: ISO datetime of most recent completion

2. `backend/app/repositories/planner_repo.py` - Added `get_completion_stats_for_meal()` method that efficiently queries:
   - Count of completed entries for a meal
   - Most recent `completed_at` timestamp

3. `backend/app/services/meal_service.py` - Updated `_meal_to_response_dto()` to:
   - Import and inject `PlannerRepo`
   - Compute total cook time by summing main + side recipe times
   - Calculate average servings (rounded) from all recipes
   - Query completion stats from planner

**Frontend (3 files):**
1. `frontend/src/types/index.ts` - Added 4 stats fields to `MealSelectionResponseDTO`

2. `frontend/src/app/globals.css` - Added CSS variables:
   - `--secondary-surface-alpha`: 8% opacity teal background
   - `--secondary-border-alpha`: 20% opacity teal border
   - Tailwind theme mappings for both

3. `frontend/src/app/meal-planner/_components/MealStats.tsx` - NEW component:
   - Matches "Quick Info" design from test mockup
   - Displays all 5 stats with icons
   - Formats cook time as "Xhr Ym"
   - Formats dates as relative time ("2 weeks ago")
   - Uses CSS variables for theming
   - **NOT integrated** into app per user request

### Design Notes
- Stats are computed on-the-fly, not stored, to avoid stale data
- Follows existing patterns: service layer computation, DTO extension, repo queries
- No new API endpoints - stats returned with existing meal responses
- Component ready for integration when needed
