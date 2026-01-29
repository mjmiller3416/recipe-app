# Frontend TODO

## 🟠 High Priority

### 1. Re-enable Ingredient Form Validation
- **Location**: `src/app/recipes/add/page.tsx` (lines 174-176)
- **Components affected**: `QuantityInput.tsx`, `IngredientRow.tsx`
- **What was disabled**:
  - Individual ingredient name validation (length checks)
  - Quantity validation (bounds checking)
  - Visual error feedback in QuantityInput (red border on invalid input)
- **Why**: Validation was too strict during recipe entry, making it cumbersome to add recipes quickly
- **To re-enable**:
  1. Restore the ingredient validation loop in `add/page.tsx`
  2. Restore the `isInvalid` styling in `QuantityInput.tsx`
  3. Consider making validation less strict or only on submit

### Fix AI suggestions auth failure on Meal Planner cards
- **Location**: `src/hooks/api/useAI.ts`
- **Issue**: AI suggestions on the selected meal card in the Meal Planner are not loading — likely a token auth issue introduced during the multi-user implementation. The issue predates the `middleware.ts` → `proxy.ts` rename, so the proxy convention is not the root cause (though Clerk compatibility with `proxy.ts` should still be verified separately).
- **Solution**: Debug the `useMealSuggestions` hook — add logging to confirm `getToken()` returns a valid token and inspect the network request/response for the `/api/ai/meal-suggestions` endpoint. Check whether the backend AI route requires auth headers that were added during the multi-user update. Also inspect `AISuggestions.tsx` for any rendering or state issues preventing the mutation from firing.

### Fix Meal Completion Reverting on Meal Planner
- **Location**: `src/hooks/api/usePlanner.ts`
- **Issue**: Marking a meal as complete on the Meal Planner optimistically updates the UI, but the API call fails silently (likely a 401 auth error from the multi-user update), causing the `onError` rollback to revert the completion state — the meal appears to "uncomplete" itself moments after clicking. This issue predates the `middleware.ts` → `proxy.ts` rename, so the proxy convention is not the root cause.
- **Solution**: Debug the `useMarkComplete` hook (line 246) — add logging to confirm `getToken()` returns a valid token and inspect the network request/response for `/api/planner/entries/{id}/complete`. Check whether the backend planner route's auth requirements changed during the multi-user update. Also check `useMarkIncomplete` (line 297) for the same regression.

### Fix AI recipe generation auth on add/edit recipes page
- **Location**: `src/app/recipes/_components/add-edit/ImageUploadCard.tsx`
- **Issue**: AI image generation on the add/edit recipe page fails because `imageGenerationApi.generate()` and `imageGenerationApi.generateBanner()` are called without a Clerk JWT token — all API calls now require authentication after the multi-user auth rollout.
- **Solution**: Use the existing `useGenerateImage()` and `useGenerateBanner()` hooks from `hooks/api/useAI.ts` (which already handle auth correctly), or add `useAuth()` + `getToken()` directly in `ImageUploadCard.tsx`. Also audit `useRecipeForm.ts` for similar unauthenticated recipe CRUD calls.

### Fix Meal Genie Assistant auth failure after multi-user rollout
- **Location**: `src/components/meal-genie/MealGenieChatContent.tsx`
- **Issue**: The Meal Genie chat components (`MealGenieChatContent.tsx` and `MealGenieAssistant.tsx`) call `mealGenieApi.chat()` and `mealGenieApi.ask()` directly without passing a Clerk JWT token — all API calls now require authentication after the multi-user auth rollout, so the backend rejects these unauthenticated requests.
- **Solution**: Refactor both components to use the existing `useMealGenieChat` / `useMealGenieAsk` hooks from `hooks/api/useAI.ts`, which already handle `getToken()` and pass the Clerk JWT to the API. Also check if `MealGenieAssistant.tsx` needs an equivalent `useMealGenieAsk` hook (create one if missing, following the same pattern).

### Fix recipe add/edit CRUD auth after multi-user rollout
- **Location**: `src/app/recipes/_components/add-edit/useRecipeForm.ts`
- **Issue**: Recipe creation, editing, and image uploads all fail with 401 Unauthorized — `useRecipeForm` calls `recipeApi.create()`, `recipeApi.update()`, and `uploadApi.uploadRecipeImage()` without passing a Clerk JWT token. `AddEditRecipeView.tsx` also loads recipes for edit via `recipeApi.get()` without a token.
- **Solution**: Import `useAuth` from `@clerk/nextjs` in `useRecipeForm` (or consume a token from the parent component), call `getToken()` before each API call, and pass the token to `recipeApi.create(payload, token)`, `recipeApi.update(id, data, token)`, `uploadApi.uploadRecipeImage(file, id, type, token)`, and `recipeApi.get(id, token)`. Follow the existing pattern in `useApiClient()` from `api-client.ts`.

## 🟡 Medium Priority

### Fix Recipe Card Size Mismatch in Meal Selection
- **Location**: `src/components/recipe/RecipeSelectCard.tsx`
- **Issue**: Recipe cards in the meal planner's recipe picker are significantly smaller than those on the Recipe Browser page — `RecipeSelectCard` uses a fixed `h-32` image and `p-4` padding, while the browse mode's `RecipeCard` medium uses `aspect-[4/3]` images and `p-6` padding.
- **Solution**: Add selection state support (checkmark overlay, outline, Main/Side badge) directly to `RecipeCard` medium variant instead of using a separate `RecipeSelectCard` component, ensuring identical card dimensions in both browse and select modes.

### Fix Meals Planned Stat to Count Only Active Planner Entries
- **Location**: `backend/app/api/dashboard.py`
- **Issue**: The "Meals Planned" stat card on the Dashboard counts all `PlannerEntry` rows for the user — including cleared (soft-deleted) entries — causing an inflated count that doesn't reflect the active planner.
- **Solution**: Add `.filter(PlannerEntry.is_cleared == False)` to the `meals_planned` query at line 47 so only non-cleared entries are counted. Also consider excluding completed entries (`is_completed == False`) if the stat should reflect only upcoming meals.

## 🔵 Low Priority

### 2. Auto-Scroll to New Ingredient Row
- **Location**: `frontend/src/components/add-recipe/IngredientRow.tsx`
- **Issue**: When adding new ingredients, the window should scroll to the newly added ingredient row to improve user experience.
- **Solution**: Implement a scrollIntoView call after adding a new ingredient row.

### 3. Expose Unit Constants via API Endpoint
- **Location**: `backend/app/api/conversion_rules.py`
- **Issue**: Unit options are hardcoded in `frontend/src/lib/constants.ts` and must be manually synced with `backend/app/utils/unit_conversion.py` — no single source of truth exists.
- **Solution**: Add a `GET /api/units` endpoint that returns available units from the backend. Frontend can then fetch dynamically instead of hardcoding, making the backend the authoritative source for allowed units.

### Combine Manual and Recipe Item Quantities for Same Ingredient
- **Location**: `backend/app/services/shopping_service.py`
- **Issue**: When a user manually adds an ingredient that also exists as a recipe-sourced item (or vice versa), the shopping list shows two separate entries instead of combining quantities — manual items have no `aggregation_key` and `source="manual"`, so the diff-based sync never matches them with `source="recipe"` items.
- **Solution**: In `add_manual_item()`, check if a recipe item with a matching `aggregation_key` already exists (compute the key from the manual item's name + unit dimension). If matched, add the manual quantity to the existing item and track the manual contribution. During `sync_shopping_list()`, also check for manual items that match a desired aggregation key and merge them. Add a **settings toggle** on the shopping list settings page (via `SettingsPage` / `ShoppingListSettings`) to enable/disable this combining behavior. The frontend `ShoppingItem.tsx` may also need to display an "includes manual addition" indicator when items are merged.

### Implement Custom Recipe Groups for Filtering
- **Location**: `src/lib/filterUtils.ts`
- **Issue**: Users have no way to create custom collections or groups of recipes — filtering is limited to predefined categories (Beef, Chicken, etc.), meal types, and dietary preferences. Users want to organize recipes into personal groups (e.g., "Weeknight Favorites", "Holiday Meals") and filter by them.
- **Solution**: Add a new `RecipeGroup` model on the backend (many-to-many with Recipe), a settings UI section for CRUD operations on groups (following the `CategoryOrderSection` drag-and-drop pattern), a recipe-level UI to assign/remove groups, and extend `applyFilters()` in `filterUtils.ts` to support group-based filtering. Also add a group filter option to `FilterSidebar.tsx` and `RecipeBrowserView.tsx`.

### Auto-Populate Meal Name with Recipe Name on Create
- **Location**: `src/app/recipes/[id]/_components/AddToMealPlanDialog.tsx`
- **Issue**: When creating a new meal from a recipe's "Add to Meal Plan" dialog, the meal name input starts blank — users must manually type a name even though the recipe name is a natural default.
- **Solution**: Pre-fill `newMealName` with `recipe.recipe_name` when switching to `"create"` mode (in the `onClick` handler at line 198), so the input is ready with a sensible default while remaining fully editable.

## ✅ Completed

### #42 [Feature Request] Add All Recipe Filters to Meal Planner Dialog
- **Location**: `src/app/meal-planner/_components/MealDialog.tsx`, `FilterBar.tsx`
- **Issue**: From the meal planner when adding a new meal, users need all the filters such as beef, chicken, pork, seafood, etc. — the same filters available in the recipe browser.
- **Solution**: Extend the meal planner's recipe selection dialog to include full filter capabilities matching the recipe browser.

### #38 [Feature Request] Delete All Completed Manual Adds
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: Users want a button at the top to delete all "completed manual adds" — a way to mass delete any manual adds that have been checked off.
- **Solution**: Add a button that filters for manual items that are checked and deletes them in bulk.

### #35 [Feature Request] Drag-and-Drop Meal Reordering
- **Location**: `src/app/meal-planner/_components/MealPlannerView.tsx`
- **Issue**: Users want to reorder meals in the meal planner via drag and drop.
- **Solution**: Implement drag-and-drop reordering using `@dnd-kit` (already in project) for meal entries.

### #47 [Bug Report] Print Layout Separates Image and Recipe
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx` (print styles)
- **Issue**: Printing is separating the picture and the recipe on two different pages.
- **Solution**: Added `page-break-inside: avoid` CSS rule to the print layout container to keep all recipe content together on one page.

### #46 [Bug Report] Print Layout Issue When Deselecting Chef's Notes
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx` (print preview)
- **Issue**: When printing a recipe with chef's notes deselected, it separates the picture and the recipe on two different pages.
- **Solution**: Fixed by the same CSS rule as #47 — the print container now prevents page breaks within the entire recipe layout.

### #47 [Bug Report] Flagged Shopping Items Disappear After Meal Plan Changes
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: User flagged items in the shopping list, then made changes to the meal plan, and the flags disappeared.
- **Solution**: Added `flagged` column to `ShoppingState` model to persist flag status. Updated `toggle_item_flagged` service to save flag state, and modified generation logic to restore flags from saved states during regeneration.

### #49 [Bug Report] Chef's Tips Cycling Through Same Tips
- **Location**: `backend/app/services/cooking_tip_service.py`
- **Issue**: The chef's tips kept cycling through the same 2-3 tips instead of showing variety.
- **Solution**: Added temperature parameter (0.9) to the Gemini API call to increase response diversity.

### #44 [Bug Report] Recipe Not Adding to Meal Planner from Recipe Page
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx` (add to meal action)
- **Issue**: When adding a recipe to the meal plan from the recipe itself, it does not actually add anything to the meal planner. The confirmation appears but the recipe isn't there.
- **Solution**: Investigate the add-to-meal-plan flow from the recipe page and fix the disconnect between UI confirmation and actual data persistence.

### #43 [Bug Report] No Option to Create New Meal When Adding from Recipe
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx` (add to meal dialog)
- **Issue**: When adding a recipe to the meal planner from the recipe itself, there is no option to create a new meal — only existing meals are shown.
- **Solution**: Add a "Create New Meal" option to the meal selection dialog when adding from the recipe page.

### #45 [Bug Report] Shopping List Items Stay Checked Between Weeks
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: Shopping list is continuing to check off items that were checked off from the week before.
- **Solution**: Investigate shopping state persistence logic and ensure items are reset when a new week begins or when the meal plan changes.

### #40 [Feature Request] Exclude Meal from Shopping List
- **Location**: `src/app/meal-planner/_components/` (meal actions)
- **Issue**: Users want the option to exclude an entire meal on the meal planner from the shopping list, removing all its ingredients at once.
- **Solution**: Added an "Exclude from Shopping List" action to meal entries that prevents all ingredients from that meal from appearing in the shopping list.

### #39 [Bug Report] Shopping List Categories Don't Expand
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: When adding a new recipe to the meal planner, the shopping list does not expand the categories that now have unchecked items.
- **Solution**: Auto-expand categories that receive new unchecked items when the shopping list updates.

### #37 [Bug Report] Category Should Auto-Expand When Adding Manual Item
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: When a manual add is added to a completed (collapsed) category, that category should automatically expand to show the new item.
- **Solution**: Detect when a manual item is added to a collapsed category and expand it automatically.

### #36 [Bug Report] Streak Counter Displaying Incorrect Data
- **Location**: `src/app/dashboard/_components/` (streak component)
- **Issue**: Streak counter isn't marking the right days or showing the correct number of days in the streak circles on the dashboard.
- **Solution**: Investigated streak calculation logic and fixed day marking/count display.

### Fix Sidebar Shopping Badge Real-Time Updates
- **Location**: `src/components/layout/Sidebar.tsx`
- **Issue**: The shopping list badge counter doesn't update in real-time — changes to the meal planner aren't reflected until visiting the shopping list page and interacting with items.
- **Solution**: Dispatch a `planner-changed` event from meal planner components when adding/removing meals, and have Sidebar listen for it to trigger a shopping list count refresh.

### Fix Shopping List Lazy Generation
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: Shopping list data is only generated from the meal planner when visiting the shopping list page — planner changes don't update the underlying shopping list data until the user navigates there.
- **Solution**: Either regenerate shopping list whenever planner changes (proactive approach), or update the backend to calculate shopping counts on-demand without requiring page visit (reactive approach).

### Reorder Ingredients on Recipe Page
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx`
- **Issue**: Reorder ingredients on the recipe page so that the "Meat" category always appears first, followed by other categories in a logical order (e.g., Vegetables, Grains, Spices).
- **Solution**: Added `INGREDIENT_CATEGORY_ORDER` constant to `constants.ts` and updated `FullRecipeView.tsx` to sort ingredient categories by priority order before rendering.

### Update "Mac Salad" Category from Bakery to Deli
- **Location**: Database (ingredients table)
- **Issue**: The "Mac Salad" ingredient is incorrectly categorized as "bakery" — it should be in the "deli" category.
- **Solution**: Execute SQL update: `UPDATE ingredients SET ingredient_category = 'deli' WHERE ingredient_name = 'Mac Salad' AND ingredient_category = 'bakery';`

### Add Manual Item Entry to Shopping List
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: Users could not manually add items to the shopping list—all items had to come from meal planner recipes. This prevented adding ad-hoc items like pantry staples or non-recipe items.
- **Solution**: Added an inline form at the top of the shopping list with qty, unit, and name fields. Form is visible in both populated and empty states. Manually added items display "added manually" text to distinguish them from recipe-generated items.

### Fix Quick Filter Pills for Favorites and New in Recipe Browser
- **Location**: `src/app/recipes/_components/RecipeBrowserView.tsx`
- **Issue**: The "Favorites" and "New" quick filter pills in the recipe browser didn't work — "Favorites" got immediately reset by URL sync, and "New" had no implementation.
- **Solution**: For "Favorites", updated `handleQuickFilterToggle` to call `router.replace("/recipes?favoritesOnly=true")` when toggling ON. For "New", added `newDays` to `FilterState`, handler in `handleQuickFilterToggle`, filter logic in `filteredRecipes` using `createdAt`, and display/removal in active filters.

### Add Favorite Button to Meal Planner
- **Location**: `src/app/meal-planner/_components/MealPlannerView.tsx`, `WeeklyMenu.tsx`
- **Issue**: Users cannot favorite a meal directly from the meal planner page — they must navigate elsewhere first.
- **Solution**: Added a "Favorite" action button alongside existing meal actions, with a read-only heart indicator on menu list cards showing favorite status.

### Add Print Preview Page with Element Toggles
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx`
- **Issue**: Long recipes overflow the page in print preview — users have no way to customize what prints to keep content on one page.
- **Solution**: Created a print preview modal with toggle controls (recipe image, chef's notes, servings & cook time) that dynamically adjusts the print layout, allowing users to fit most recipes on a single page.

### AI Image Style Concern
- **Location**: Settings page, AI image generation configuration
- **Issue**: Generated recipe images frequently showed cast iron skillets — user preference issue with AI image generation prompts.
- **Solution**: Moved the AI image generation prompt into user settings, giving users control over the style and content of generated images.

### Add "New Recipes" Filter in Meal Planner
- **Location**: Meal planner recipe selection dialog (`MealDialog.tsx`, `FilterBar.tsx`)
- **Issue**: When adding a new meal to the meal planner, users wanted a filter for "new" recipes to quickly find recently added recipes.
- **Solution**: Added a "New" filter pill that shows recipes created within the last 7 days. Extended `RecipeCardData` type to include `createdAt`, added filter to `QUICK_FILTERS` constant, and implemented the filter logic in the meal dialog.

### Allow Leading Decimals in Ingredient Quantities
- **Location**: `frontend/src/lib/quantityUtils.ts`
- **Issue**: When adding quantities for ingredients, users could not enter .5, .25, etc. They had to enter 0.5, 0.25.
- **Solution**: Updated the regex in `parseQuantity` to allow leading decimals using alternation pattern.

### Shopping List Items Uncheck When Quantity Changes
- **Location**: Shopping list state management
- **Issue**: When adding a new recipe to the meal planner, shopping list items that have been checked off get updated quantities but remain checked — they should be unchecked to indicate the new quantity needs to be collected.
- **Solution**: Items are now automatically unchecked when their quantity increases, so users know to collect the additional amount.

### First Uncompleted Meal Should Be Selected by Default
- **Location**: `src/app/meal-planner/_components/MealPlannerView.tsx`
- **Issue**: When loading the meal planner, no meal is selected by default — the first uncompleted meal should be auto-selected for convenience.
- **Solution**: Changed the auto-selection logic to find the first uncompleted entry using `data.find((e) => !e.is_completed)`, with a fallback to the first entry if all meals are completed.

### Auto-Focus New Ingredient Row
- **Location**: `src/app/recipes/add/page.tsx`, `IngredientRow.tsx`
- **Issue**: When clicking "Add Ingredient", the cursor should automatically move to the first field (ingredient name) of the newly added empty row.
- **Solution**: Added auto-focus to the ingredient name input when a new row is added.

### Remove Duplicate "Pico De Gallo" Ingredient
- **Location**: Database (ingredients table)
- **Issue**: There are two "Pico De Gallo" entries — one incorrectly categorized as "baking". Remove the duplicate.
- **Solution**: Deleted the duplicate entry with incorrect "baking" category, keeping only the correct categorization.

### Fix Active Filters to Display on Single Row
- **Location**: `src/components/common/FilterPillGroup.tsx`
- **Issue**: Active filters wrap to multiple rows when there are many filters selected — should stay on a single row for cleaner UI.
- **Solution**: Replaced `flex-wrap` with `flex-nowrap` and added horizontal scroll (`overflow-x-auto`) to keep all pills on one row with scrolling when needed.

### Fix Unit Capitalization in Recipe Display
- **Location**: `src/app/recipes/[id]/_components/IngredientItem.tsx`
- **Issue**: After saving a recipe, "Tbs" displays as lowercase "tbs" — the component directly renders the stored unit value instead of its display label from `INGREDIENT_UNITS`.
- **Solution**: Look up the unit's `label` from `INGREDIENT_UNITS` constant instead of displaying the raw `value`. Use a helper like `INGREDIENT_UNITS.find(u => u.value === unit)?.label || unit`.

### Reorder Shopping List Stats Layout
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: The stat cards at the top of the shopping list display as Total → Collected → Remaining, but Remaining → Collected → Total provides a more logical left-to-right flow.
- **Solution**: Reordered the `StatCard` components to display Remaining first, Collected second, and Total Items third.

### Display Quantity Before Item Name in Shopping List
- **Location**: `src/app/shopping-list/_components/ShoppingItem.tsx`
- **Issue**: Shopping list items currently display as "Ingredient Name ... Quantity" — users want to see quantities first for easier scanning while shopping.
- **Solution**: Moved the quantity badge to appear between the Checkbox and the item content section for easier scanning while shopping.

### Fix Squared-Off Card Shadows
- **Location**: `src/components/ui/card.tsx`
- **Issue**: Card shadows appear squared off because child content overflows the rounded corners — most noticeable on MealPlanner cards where images or content peek outside the border-radius.
- **Solution**: Added `overflow-hidden` to the base Card component to ensure all child content respects the rounded corners.

### Fix Quick Filter Chips Adding Duplicate Active Filters
- **Location**: `src/app/recipes/_components/RecipeBrowserView.tsx`
- **Issue**: Clicking a quick filter pill (e.g., "Dessert") in the hero section adds the filter twice to the Active Filters display — visible as duplicate chips showing the same filter value.
- **Solution**: Refactor `handleQuickFilterToggle` (line 471) to move the `setFilters` call outside of the `setActiveQuickFilters` callback — nested setState calls inside updater functions can cause React batching issues that lead to duplicate state entries.

### Fix Dropdown Layout Shift
- **Location**: `src/app/globals.css`
- **Issue**: When opening dialogs or dropdowns on scrollable pages (RecipeBrowser, AddEditRecipes), the page content shifted due to double scrollbar compensation — Radix UI added padding for a "removed" scrollbar that never actually disappeared.
- **Solution**: Added `overflow-y: scroll` to html (force scrollbar always visible) and `body[data-scroll-locked]` override to prevent Radix from adding unnecessary padding compensation.

### Convert Shopping List Quantities to Fractions
- **Location**: `src/app/shopping-list/_components/ShoppingItem.tsx`
- **Issue**: Shopping list quantities display as decimals (0.5, 0.25) instead of user-friendly fractions (½, ¼) — making them harder to read while shopping.
- **Solution**: Replace the inline quantity formatting with the existing `formatQuantity` utility from `@/lib/quantityUtils` which already handles decimal-to-fraction conversion.

### Fix Favorites Only Toggle in Recipe Browser
- **Location**: `src/app/recipes/_components/RecipeBrowserView.tsx`
- **Issue**: Clicking the "Favorites Only" checkbox did nothing — a `useEffect` that syncs `filters.favoritesOnly` with URL params was immediately undoing the state change because the URL didn't have the `?favoritesOnly=true` param.
- **Solution**: Updated the checkbox handler to use `router.replace()` to update the URL, letting the existing `useEffect` handle the state sync. Also added `isFavorite: dto.is_favorite ?? false` in `recipeCardMapper.ts` for safety.

### Implement Drag-and-Drop Reordering of Ingredients
- **Location**: `frontend/src/app/recipes/_components/add-edit/IngredientRow.tsx`
- **Issue**: The ingredient row component did not support drag-and-drop reordering of ingredients.
- **Solution**: Integrated `@dnd-kit/sortable` (already installed) to enable reordering of ingredient rows with keyboard and touch accessibility.

### Remove Duplicate "Ranch Seasoning" Ingredient
- **Location**: Database (ingredients table)
- **Issue**: "Ranch Seasoning" appeared in both Pantry and Spices categories — causing duplicate entries in autocomplete and recipe ingredients.
- **Solution**: Deleted the duplicate Pantry entry, keeping only the Spices categorization.

### Fix Ingredient Autocomplete for Multi-Word Ingredients
- **Location**: `frontend/src/components/add-recipe/IngredientAutoComplete.tsx`
- **Issue**: The ingredient autocomplete stops suggesting ingredients once the user types a space. This makes it difficult to enter multi-word ingredients like "olive oil" or "baking soda".
- **Solution**: Update the autocomplete logic to continue suggesting ingredients even after spaces are typed.