# Meal Planner Documentation

Complete technical documentation for the Meal Planner feature in Meal Genie.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Type System](#type-system)
4. [State Management (useMealPlanner)](#state-management-usemealplanner)
5. [Components](#components)
6. [API Integration](#api-integration)
7. [User Flows](#user-flows)
8. [Design Patterns](#design-patterns)

---

## Overview

The Meal Planner is a core feature allowing users to plan their weekly meals by composing dishes from their recipe collection. It provides a modern, intuitive interface with drag-and-drop reordering, meal composition, and completion tracking.

### Key Features

| Feature | Description |
|---------|-------------|
| **Meal Composition** | Create meals with 1 main dish + up to 3 side dishes |
| **Weekly Queue** | Add meals to a reorderable weekly menu |
| **Completion Tracking** | Mark meals as complete, move to "completed" section |
| **Drag-and-Drop** | Reorder meals in the queue via drag handles |
| **Saved Meals** | Reuse previously created meal compositions |
| **Recipe Integration** | Browse and select from your recipe collection |

### Route

| Path | Component | Description |
|------|-----------|-------------|
| `/meal-planner` | `MealPlannerPage` | Main meal planning interface |

---

## Architecture

### File Structure

```
frontend/src/
├── app/meal-planner/
│   └── page.tsx                    # Route entry point
├── components/meal-planner/
│   ├── index.ts                    # Central exports
│   ├── types.ts                    # Type definitions
│   ├── MealPlannerPage.tsx         # Main page component
│   ├── SelectedMealView.tsx        # Left column - meal execution view
│   ├── WeeklyMenuSidebar.tsx       # Right column - meal queue
│   ├── CreateMealDialog.tsx        # Create/edit meal modal
│   ├── MainDishCard.tsx            # Hero card for main dish
│   ├── SideDishCard.tsx            # Side dish cards + grid
│   ├── MealSidebarCard.tsx         # Sidebar meal cards (sortable)
│   ├── RecipeDetailPopup.tsx       # Quick recipe preview
│   └── EmptyPlannerState.tsx       # Empty state components
└── hooks/
    └── useMealPlanner.ts           # State management hook
```

### Component Hierarchy

```
MealPlannerPage
├── SelectedMealView
│   ├── MainDishCard
│   ├── SideDishGrid
│   │   └── SideDishCard (×3 max)
│   ├── RecipeDetailPopup
│   └── EmptyPlannerState
├── WeeklyMenuSidebar
│   ├── DndContext (drag-drop)
│   │   └── SortableMealSidebarCard (×N)
│   │       └── MealSidebarCard
│   ├── MealSidebarCard (completed, ×M)
│   └── EmptySidebarState
└── CreateMealDialog
    ├── CreateMealTabContent
    │   ├── RecipeSlot (main)
    │   ├── RecipeSlot (sides ×3)
    │   └── RecipeListItem (filtered list)
    └── SavedMealsTabContent
```

### Layout Design

The Meal Planner uses a **fixed viewport two-column layout**:

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: "Meal Planner"                           [Clear Plan]   │
├────────────────────────────────────────┬─────────────────────────┤
│                                        │  This Week's Menu       │
│    SelectedMealView                    │  3 meals · 1 completed  │
│    ┌─────────────────────────┐         ├─────────────────────────┤
│    │                         │         │ ┌─────────────────────┐ │
│    │     MainDishCard        │         │ │ MealSidebarCard     │ │
│    │     (16:9 hero)         │         │ └─────────────────────┘ │
│    │                         │         │ ┌─────────────────────┐ │
│    └─────────────────────────┘         │ │ MealSidebarCard     │ │
│                                        │ └─────────────────────┘ │
│    Side Dishes                         │ ─ Completed ─────────── │
│    ┌───────┐ ┌───────┐ ┌───────┐       │ ┌─────────────────────┐ │
│    │ Side  │ │ Side  │ │ Side  │       │ │ Completed meal      │ │
│    └───────┘ └───────┘ └───────┘       │ └─────────────────────┘ │
│                                        ├─────────────────────────┤
│    [Mark Complete] [Edit] [Remove]     │      [+ Add Meal]       │
└────────────────────────────────────────┴─────────────────────────┘
         flex-1 (scrollable)                  w-80 (scrollable)
```

---

## Type System

All types are defined in `components/meal-planner/types.ts`.

### Recipe Types

```typescript
/**
 * Recipe data for selection in CreateMealDialog
 * Simplified subset of full recipe for the picker UI
 */
interface SelectableRecipe {
  id: number;
  name: string;
  imageUrl?: string;
  category?: string;
  mealType?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
}

/**
 * Side recipe in a meal (minimal data)
 */
interface MealSideRecipe {
  id: number;
  name: string;
  imageUrl?: string;
}

/**
 * Main recipe in a meal (extended data for display)
 */
interface MealMainRecipe {
  id: number;
  name: string;
  imageUrl?: string;
  servings: number;
  prepTime: number;    // in minutes
  cookTime: number;    // in minutes
  tags: string[];
}
```

### Meal & Planner Entry Types

```typescript
/**
 * A meal entry in the weekly menu queue
 *
 * IMPORTANT: `id` is the PlannerEntry ID, not the Meal ID.
 * The `mealId` field contains the underlying Meal ID.
 */
interface MealQueueEntry {
  id: number;              // PlannerEntry ID (for reordering, removal)
  mealId: number;          // Underlying Meal ID (for editing)
  name: string;            // Display name
  mainRecipe: MealMainRecipe;
  sideRecipes: MealSideRecipe[];  // max 3
  completed: boolean;
  completedAt?: string;    // ISO string
  position: number;        // For ordering in the queue
}

/**
 * A saved meal (for the "Saved Meals" tab)
 */
interface SavedMeal {
  id: number;
  name: string;
  mainRecipeImageUrl?: string;
  sideCount: number;
  tags?: string[];
  isFavorite?: boolean;
}
```

### Hook Return Type

```typescript
interface UseMealPlannerReturn {
  // Data
  entries: MealQueueEntry[];
  savedMeals: SavedMeal[];
  recipes: SelectableRecipe[];

  // Selection state
  selectedId: number | null;
  selectedEntry: MealQueueEntry | undefined;

  // Derived data (memoized)
  activeMeals: MealQueueEntry[];
  completedMeals: MealQueueEntry[];

  // Loading/error state
  isLoading: boolean;
  error: string | null;

  // Actions
  actions: {
    setSelectedId: (id: number) => void;
    addMealToQueue: (mealId: number) => Promise<void>;
    createAndAddMeal: (name: string, mainRecipeId: number, sideRecipeIds: number[]) => Promise<void>;
    updateMeal: (mealId: number, name: string, mainRecipeId: number, sideRecipeIds: number[]) => Promise<void>;
    toggleCompletion: (entryId: number) => Promise<void>;
    removeFromMenu: (entryId: number) => Promise<void>;
    reorderEntries: (entryIds: number[]) => Promise<void>;
    clearPlanner: () => Promise<void>;
    clearCompleted: () => Promise<void>;
    refetch: () => Promise<void>;
  };
}
```

### API Response Types

These types match the backend DTOs:

```typescript
// Backend: PlannerEntryResponseDTO
interface PlannerEntryResponse {
  id: number;
  meal_id: number;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  scheduled_date: string | null;
  meal_name: string | null;
  main_recipe_id: number | null;
  side_recipe_ids: number[];
  main_recipe: RecipeCardResponse | null;
}

// Backend: RecipeCardDTO
interface RecipeCardResponse {
  id: number;
  recipe_name: string;
  recipe_category: string | null;
  meal_type: string | null;
  servings: number | null;
  total_time: number | null;
  reference_image_path: string | null;
  is_favorite: boolean;
}

// Backend: MealSelectionResponseDTO
interface MealSelectionResponse {
  id: number;
  meal_name: string;
  main_recipe_id: number;
  side_recipe_ids: number[];
  tags: string[];
  is_favorite: boolean;
  main_recipe: RecipeCardResponse | null;
}
```

### Mapping Utilities

```typescript
// Convert backend response to frontend model
function mapEntryToQueueEntry(
  entry: PlannerEntryResponse,
  allRecipes: SelectableRecipe[]
): MealQueueEntry;

function mapMealToSavedMeal(meal: MealSelectionResponse): SavedMeal;

function mapRecipeToSelectable(recipe: RecipeCardResponse): SelectableRecipe;
```

---

## State Management (useMealPlanner)

The `useMealPlanner` hook (`hooks/useMealPlanner.ts`) centralizes all meal planner state and operations.

### State Structure

```typescript
// Data state
const [entries, setEntries] = useState<MealQueueEntry[]>([]);
const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
const [recipes, setRecipes] = useState<SelectableRecipe[]>([]);

// Selection state
const [selectedId, setSelectedId] = useState<number | null>(null);

// Loading/error state
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Derived state (memoized)
const activeMeals = useMemo(() =>
  entries.filter(e => !e.completed).sort((a, b) => a.position - b.position),
  [entries]
);

const completedMeals = useMemo(() =>
  entries.filter(e => e.completed),
  [entries]
);

const selectedEntry = useMemo(() =>
  entries.find(e => e.id === selectedId),
  [entries, selectedId]
);
```

### Actions

| Action | Description | Optimistic? |
|--------|-------------|-------------|
| `setSelectedId(id)` | Select a meal for viewing | N/A |
| `addMealToQueue(mealId)` | Add existing saved meal to queue | No |
| `createAndAddMeal(name, mainId, sideIds)` | Create new meal + add to queue | No |
| `updateMeal(mealId, name, mainId, sideIds)` | Update existing meal | No |
| `toggleCompletion(entryId)` | Toggle complete/incomplete | **Yes** |
| `removeFromMenu(entryId)` | Remove meal from queue | **Yes** |
| `reorderEntries(entryIds)` | Reorder meals in queue | **Yes** |
| `clearPlanner()` | Remove all meals | No |
| `clearCompleted()` | Remove completed meals | No |
| `refetch()` | Re-fetch all data | No |

### Optimistic Updates

The hook uses optimistic updates for a responsive UI:

```typescript
const toggleCompletion = useCallback(async (entryId: number) => {
  // 1. Save previous state
  const prevEntries = entries;

  // 2. Optimistically update
  setEntries(prev =>
    prev.map(e =>
      e.id === entryId
        ? { ...e, completed: !e.completed, completedAt: !e.completed ? new Date().toISOString() : undefined }
        : e
    )
  );

  try {
    // 3. Make API call
    await plannerEntryApi.toggleCompletion(entryId);
    toast.success(entry?.completed ? "Meal restored" : "Meal completed!");
  } catch (err) {
    // 4. Rollback on error
    setEntries(prevEntries);
    toast.error("Failed to update meal");
  }
}, [entries]);
```

### Initial Data Fetching

On mount, the hook fetches three data sources in parallel:

```typescript
const [entriesRes, mealsRes, recipesRes] = await Promise.all([
  plannerEntryApi.getEntries(),     // Planner entries
  plannerApi.getMeals(),            // Saved meals
  recipeApi.listCards(),            // All recipes (for picker)
]);
```

After fetching, it auto-selects the first active meal (or first completed if all are done).

---

## Components

### MealPlannerPage

**File:** `MealPlannerPage.tsx`

The main orchestrating component. Manages:
- Dialog state (create, edit, clear confirmation)
- Passes data from `useMealPlanner` to child components

```typescript
interface MealPlannerPageState {
  isCreateDialogOpen: boolean;
  editingEntryId: number | null;  // null = create mode, number = edit mode
  isClearDialogOpen: boolean;
}
```

**Key Handlers:**
- `handleAddMeal()` - Opens create dialog in create mode
- `handleEditMeal(entryId)` - Opens create dialog in edit mode
- `handleCreateMeal(name, mainId, sideIds)` - Creates meal and adds to queue
- `handleUpdateMeal(mealId, name, mainId, sideIds)` - Updates existing meal
- `handleAddSavedMeal(mealId)` - Adds saved meal to queue
- `handleClearPlan()` - Clears all meals with confirmation

---

### SelectedMealView

**File:** `SelectedMealView.tsx`

The left column showing the currently selected meal's details.

```typescript
interface SelectedMealViewProps {
  selectedMeal: MealQueueEntry | undefined;
  onMarkComplete: (id: number) => void;
  onEditMeal: (id: number) => void;
  onRemoveFromMenu: (id: number) => void;
  onAddMeal: () => void;
  className?: string;
}
```

**Structure:**
1. **Header:** "Selected Meal"
2. **Completion Banner:** Shows if meal is completed (green banner)
3. **MainDishCard:** Large hero card for main recipe
4. **SideDishGrid:** 3-column grid of side dishes
5. **Action Bar:** Mark Complete | Edit Meal | Remove from Menu

**States:**
- **Empty:** Shows `EmptyPlannerState` with CTA
- **Completed:** Grayed out with restore option
- **Active:** Full color with all actions enabled

---

### WeeklyMenuSidebar

**File:** `WeeklyMenuSidebar.tsx`

The right column showing the weekly meal queue.

```typescript
interface WeeklyMenuSidebarProps {
  entries: MealQueueEntry[];
  selectedId: number | null;
  isLoading?: boolean;
  onSelectMeal: (id: number) => void;
  onRemoveMeal: (id: number) => void;
  onRestoreMeal: (id: number) => void;
  onAddMeal: () => void;
  onReorder?: (entryIds: number[]) => void;
  className?: string;
}
```

**Structure:**
1. **Header:** "This Week's Menu" with statistics
2. **Active Meals:** Draggable list with `@dnd-kit`
3. **Completed Meals:** Separate section (non-draggable)
4. **Footer:** Sticky "Add Meal" button

**Drag-and-Drop Implementation:**

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // 8px before drag starts
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

// On drag end, compute new order and call parent
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    // Compute new order...
    onReorder?.(newOrder.map(m => m.id));
  }
};
```

---

### CreateMealDialog

**File:** `CreateMealDialog.tsx`

Large modal for creating/editing meals or adding saved meals.

```typescript
interface CreateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: SelectableRecipe[];
  savedMeals: SavedMeal[];
  editingMeal?: MealQueueEntry;  // If provided = edit mode
  onCreateMeal: (name: string, mainRecipeId: number, sideRecipeIds: number[]) => void;
  onUpdateMeal?: (mealId: number, name: string, mainRecipeId: number, sideRecipeIds: number[]) => void;
  onAddSavedMealToQueue: (mealId: number) => void;
}
```

**Two Tabs:**

| Tab | Description |
|-----|-------------|
| **Create Meal** | Compose new meal from recipes |
| **Saved Meals** | Add existing saved meal to queue |

**Create Meal Tab - Split Layout:**

```
┌──────────────────────────┬──────────────────────────┐
│   Composition Editor     │     Recipe Picker        │
│                          │                          │
│   [Meal Name Input]      │   [Search Bar]           │
│                          │   [Filter Chips]         │
│   ┌─────────────────┐    │                          │
│   │  Main Dish      │    │   ┌─────────────────┐    │
│   │  (large slot)   │    │   │ Recipe Item     │    │
│   └─────────────────┘    │   ├─────────────────┤    │
│                          │   │ Recipe Item     │    │
│   ┌─────┐ ┌─────┐ ┌─────┐│   ├─────────────────┤    │
│   │Side1│ │Side2│ │Side3││   │ Recipe Item     │    │
│   └─────┘ └─────┘ └─────┘│   └─────────────────┘    │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
         50%                         50%
```

**Quick Filters:**
- Dinner, Lunch, Vegetarian, Quick (≤30 min), Gluten-Free

**Smart Behaviors:**
- Auto-fills meal name from main recipe
- Prevents duplicate recipe selection
- Auto-advances to next empty slot after selection
- Resets state when dialog closes

---

### MainDishCard

**File:** `MainDishCard.tsx`

Large hero card for displaying the main dish.

```typescript
interface MainDishCardProps {
  recipe: MealMainRecipe;
  onViewRecipe?: (recipeId: number) => void;
  className?: string;
}
```

**Features:**
- 16:9 aspect ratio image
- Gradient overlay for text readability
- "View Recipe" button on hover
- Stats row: servings, prep time, cook time, total time
- Tags display

---

### SideDishCard & SideDishGrid

**File:** `SideDishCard.tsx`

Compact cards for side dishes.

```typescript
// Individual side dish card
interface SideDishCardProps {
  side: MealSideRecipe;
  onClick?: () => void;
  className?: string;
}

// Grid container
interface SideDishGridProps {
  sides: MealSideRecipe[];
  onSideClick?: (side: MealSideRecipe) => void;
  className?: string;
}

// Empty slot (for CreateMealDialog)
interface EmptySideDishSlotProps {
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}
```

**SideDishGrid** arranges up to 3 sides in a responsive column layout.

---

### MealSidebarCard

**File:** `MealSidebarCard.tsx`

Card for meals in the weekly queue sidebar.

```typescript
interface MealSidebarCardProps {
  meal: MealQueueEntry;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onRestore?: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
}
```

**Visual States:**

| State | Appearance |
|-------|------------|
| **Default** | White background, subtle border |
| **Selected** | Purple border with ring |
| **Completed** | Grayed out, restore button |
| **Dragging** | Elevated shadow, slight scale |
| **Hovered** | Shows drag handle + X button |

**SortableMealSidebarCard** - Wrapper using `@dnd-kit/sortable`:

```typescript
function SortableMealSidebarCard({ meal, isSelected, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: meal.id });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <MealSidebarCard
        meal={meal}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        // ...
      />
    </div>
  );
}
```

---

### RecipeDetailPopup

**File:** `RecipeDetailPopup.tsx`

Quick preview popup when clicking a side dish.

```typescript
interface RecipeDetailPopupProps {
  recipe: MealSideRecipe | SelectableRecipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Features:**
- Recipe image (h-48)
- Name and stats (if available)
- "View Full Recipe" navigation button

---

### Empty State Components

**File:** `EmptyPlannerState.tsx`

Two empty state variants:

```typescript
// Large empty state for main area
interface EmptyPlannerStateProps {
  onAddMeal: () => void;
}

// Compact empty state for sidebar
interface EmptySidebarStateProps {
  onAddMeal: () => void;
}
```

---

## API Integration

### Planner Entry API

Internal API client in the hook:

```typescript
const plannerEntryApi = {
  getEntries: (params?) => GET `/api/planner/entries${query}`,
  addEntry: (mealId) => POST `/api/planner/entries/${mealId}`,
  toggleCompletion: (entryId) => POST `/api/planner/entries/${entryId}/toggle`,
  markComplete: (entryId) => POST `/api/planner/entries/${entryId}/complete`,
  markIncomplete: (entryId) => POST `/api/planner/entries/${entryId}/incomplete`,
  removeEntry: (entryId) => DELETE `/api/planner/entries/${entryId}`,
  reorderEntries: (entryIds) => PUT `/api/planner/entries/reorder`,
  clearPlanner: () => DELETE `/api/planner/clear`,
  clearCompleted: () => DELETE `/api/planner/clear-completed`,
};
```

### External API Clients (from `lib/api.ts`)

```typescript
// Meal operations
plannerApi.getMeals()        // GET /api/meals
plannerApi.createMeal(data)  // POST /api/meals
plannerApi.updateMeal(id, data) // PUT /api/meals/{id}

// Recipe listing
recipeApi.listCards()        // GET /api/recipes/cards
```

---

## User Flows

### Flow 1: Create a New Meal

```
1. User clicks "Add Meal" button
   └─> Opens CreateMealDialog

2. User types meal name (optional, auto-fills from main)

3. User clicks main dish slot
   └─> Slot becomes active (purple border)

4. User selects recipe from picker
   └─> Recipe fills main slot
   └─> Auto-advances to first side slot

5. User optionally adds side dishes (0-3)

6. User clicks "Create Meal"
   └─> actions.createAndAddMeal() called
   └─> Meal created in backend
   └─> Added to planner queue
   └─> Dialog closes
   └─> New meal auto-selected
```

### Flow 2: Complete a Meal

```
1. User selects meal from sidebar
   └─> SelectedMealView updates

2. User clicks "Mark Complete"
   └─> Optimistic update (immediate UI change)
   └─> API call to toggle completion
   └─> Meal moves to "Completed" section
   └─> Next active meal auto-selected
```

### Flow 3: Reorder Meals

```
1. User hovers over meal card in sidebar
   └─> Drag handle appears (grip icon)

2. User drags meal card
   └─> Card elevates with shadow
   └─> Other cards shift to show drop position

3. User releases
   └─> Optimistic update (immediate reorder)
   └─> API call to persist new order
```

### Flow 4: Add Saved Meal

```
1. User clicks "Add Meal" button
   └─> Opens CreateMealDialog

2. User clicks "Saved Meals" tab
   └─> Shows 3-column grid of saved meals

3. User clicks a saved meal
   └─> Selection indicator appears

4. User clicks "Add to Menu"
   └─> actions.addMealToQueue() called
   └─> Meal added to queue
   └─> Dialog closes
```

---

## Design Patterns

### 1. Container/Presentation Split

- **Container:** `MealPlannerPage` - manages state, handlers
- **Presentation:** Child components - receive props, render UI

### 2. Custom Hook for State

All business logic centralized in `useMealPlanner`:
- Data fetching
- State management
- API calls
- Optimistic updates
- Error handling

### 3. Optimistic Updates with Rollback

```typescript
// Pattern used for toggleCompletion, removeFromMenu, reorderEntries
const prevState = currentState;
setCurrentState(optimisticUpdate);
try {
  await apiCall();
} catch {
  setCurrentState(prevState); // Rollback
}
```

### 4. Composition over Inheritance

Meals are composed of recipes rather than extending them:
- `MealQueueEntry` contains `MealMainRecipe` + `MealSideRecipe[]`
- Easy to add/remove recipes from meals

### 5. Slot-Based UI Pattern

The CreateMealDialog uses a "slot" metaphor:
- Main dish slot (large, single)
- Side dish slots (small, ×3)
- Active slot receives recipe selections
- Auto-advancement to next empty slot

### 6. Controlled Components

All dialogs use controlled open state:
```typescript
<CreateMealDialog
  open={isCreateDialogOpen}
  onOpenChange={setIsCreateDialogOpen}
  // ...
/>
```

### 7. Type Guards for Polymorphic Props

```typescript
// RecipeDetailPopup accepts both MealSideRecipe and SelectableRecipe
interface Props {
  recipe: MealSideRecipe | SelectableRecipe | null;
}

// Check for extended properties
if ('servings' in recipe && recipe.servings) {
  // Handle SelectableRecipe
}
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` | Drag-and-drop framework |
| `@dnd-kit/sortable` | Sortable list utilities |
| `@dnd-kit/utilities` | CSS transform helpers |
| `sonner` | Toast notifications |
| `lucide-react` | Icons |
| `@radix-ui/react-dialog` | Dialog primitive (via shadcn) |
| `@radix-ui/react-tabs` | Tabs primitive (via shadcn) |
| `@radix-ui/react-alert-dialog` | Alert dialog primitive (via shadcn) |

---

## Future Considerations

Potential enhancements based on the current architecture:

1. **Calendar View** - `scheduled_date` field exists but unused
2. **Meal Templates** - Save favorite meal configurations
3. **Nutritional Tracking** - Sum nutrition from component recipes
4. **Sharing** - Share meal plans with family members
5. **AI Suggestions** - Recommend meals based on history/preferences
