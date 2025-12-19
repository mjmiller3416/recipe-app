# Meal Genie - Project Index

Quick reference for discovering existing functionality. Use Ctrl+F to find what you need.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| UI | shadcn/ui (new-york style), Radix UI, Lucide icons |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL (prod), Alembic migrations |
| Images | Cloudinary |

---

## Directory Map

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, route mounting
│   ├── api/                    # Route handlers
│   └── core/
│       ├── models/             # SQLAlchemy ORM models
│       ├── repositories/       # Database queries
│       ├── services/           # Business logic
│       ├── dtos/               # Pydantic request/response schemas
│       └── database/           # DB connection, Alembic migrations

frontend/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── layout/             # App shell, nav, headers
│   │   ├── recipe/             # Recipe display components
│   │   ├── add-recipe/         # Recipe form components
│   │   ├── forms/              # Reusable form inputs
│   │   ├── common/             # Shared utilities
│   │   └── settings/           # Settings page components
│   ├── lib/                    # Utilities, API client, constants
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript definitions
```

---

## API Endpoints

### Recipes (`/api/recipes`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/recipes` | List recipes with filters |
| GET | `/api/recipes/cards` | Lightweight recipe cards for listings |
| GET | `/api/recipes/{id}` | Get full recipe details |
| POST | `/api/recipes` | Create new recipe |
| PUT | `/api/recipes/{id}` | Update recipe |
| DELETE | `/api/recipes/{id}` | Delete recipe |
| POST | `/api/recipes/{id}/favorite` | Toggle favorite status |
| GET | `/api/recipes/categories` | Get distinct categories |
| GET | `/api/recipes/meal-types` | Get distinct meal types |

### Meals (`/api/meals`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/meals` | List all saved meals |
| GET | `/api/meals/{id}` | Get meal details |
| POST | `/api/meals` | Create meal (main + sides) |
| PUT | `/api/meals/{id}` | Update meal |
| DELETE | `/api/meals/{id}` | Delete meal |
| POST | `/api/meals/{id}/favorite` | Toggle favorite status |

### Planner (`/api/planner`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/planner/summary` | Get meal plan summary |
| DELETE | `/api/planner/clear` | Clear all planner entries |

### Shopping (`/api/shopping`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/shopping` | Get shopping list with filters |
| GET | `/api/shopping/items/{id}` | Get single item |
| POST | `/api/shopping/items` | Add manual item |
| PATCH | `/api/shopping/items/{id}` | Update item |
| PATCH | `/api/shopping/items/{id}/toggle` | Toggle "have" status |
| DELETE | `/api/shopping/items/{id}` | Delete item |
| POST | `/api/shopping/generate` | Generate list from recipe IDs |
| DELETE | `/api/shopping/clear` | Clear entire list |
| DELETE | `/api/shopping/clear-manual` | Clear manual items only |
| DELETE | `/api/shopping/clear-completed` | Clear checked-off items |
| PATCH | `/api/shopping/bulk-update` | Bulk toggle have status |
| GET | `/api/shopping/breakdown` | Ingredient breakdown by recipe |

### Ingredients (`/api/ingredients`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ingredients` | List/search ingredients |
| GET | `/api/ingredients/{id}` | Get ingredient details |
| POST | `/api/ingredients` | Create ingredient |
| POST | `/api/ingredients/search` | Search with filters |
| GET | `/api/ingredients/categories` | Get distinct categories |
| GET | `/api/ingredients/names` | Get names for autocomplete |

### Data Management (`/api/data-management`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/data-management/import/preview` | Preview Excel import |
| POST | `/api/data-management/import/execute` | Execute import with resolutions |
| GET | `/api/data-management/export` | Export recipes to Excel |
| GET | `/api/data-management/template` | Download import template |
| DELETE | `/api/data-management/clear-all` | Delete all data |

### Upload (`/api/upload`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Upload image to Cloudinary |

---

## Database Models

| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| `Recipe` | `recipe` | id, recipe_name, recipe_category, meal_type, diet_pref, total_time, servings, directions, notes, reference_image_path, banner_image_path, is_favorite | → RecipeIngredient, → Meal |
| `Ingredient` | `ingredients` | id, ingredient_name, ingredient_category | → RecipeIngredient |
| `RecipeIngredient` | `recipe_ingredient` | id, recipe_id, ingredient_id, quantity, unit | ← Recipe, ← Ingredient |
| `Meal` | `meals` | id, meal_name, main_recipe_id, side_recipe_ids (JSON), is_favorite, tags (JSON) | ← Recipe, → PlannerEntry |
| `PlannerEntry` | `planner_entries` | id, meal_id, planner_date | ← Meal |
| `ShoppingItem` | `shopping_items` | id, ingredient_name, quantity, unit, category, source, have | standalone |
| `ShoppingState` | `shopping_state` | id, item_state_json | legacy |
| `RecipeHistory` | `recipe_history` | id, recipe_id, action, old_data, new_data | ← Recipe |

---

## Frontend Components

### UI Primitives (`components/ui/`)
shadcn/ui components - use `npx shadcn@latest add <name>` to add more

| Component | Use for |
|-----------|---------|
| `accordion` | Expandable content sections |
| `alert-dialog` | Confirmation dialogs (delete, leave unsaved) |
| `avatar` | User/recipe avatars |
| `button` | All clickable actions |
| `card` | Content containers |
| `checkbox` | Toggle options, shopping item checkoffs |
| `collapsible` | Expandable/collapsible sections |
| `command` | Command palette, searchable lists |
| `dialog` | Modal dialogs |
| `input` | Text inputs |
| `label` | Form labels |
| `popover` | Floating content (dropdowns, pickers) |
| `select` | Dropdown selects |
| `separator` | Visual dividers |
| `sonner` | Toast notifications |
| `tabs` | Tabbed interfaces |
| `textarea` | Multi-line text input |
| `tooltip` | Hover hints |

### Layout (`components/layout/`)
| Component | Purpose |
|-----------|---------|
| `AppLayout` | Main wrapper with sidebar, theme provider |
| `Sidebar` | Navigation sidebar |
| `PageHeader` | Page title + action buttons |
| `NavButton` | Sidebar navigation link |
| `Logo` | App branding |

### Recipe (`components/recipe/`)
| Component | Purpose |
|-----------|---------|
| `RecipeCard` | Recipe card for listings (thumbnail, title, badges) |
| `RecipeImage` | Image display with Cloudinary + fallback handling |
| `RecipeBadge` | Category/meal type badges |

### Add/Edit Recipe (`components/add-recipe/`)
| Component | Purpose |
|-----------|---------|
| `RecipeInfoCard` | Name, category, type, time, servings form |
| `IngredientsCard` | Ingredient list with add/remove |
| `IngredientRow` | Single ingredient input row |
| `IngredientAutoComplete` | Autocomplete for ingredient search |
| `DirectionsNotesCard` | Directions + notes textarea |
| `ImageUploadCard` | Image upload interface |
| `useRecipeForm` | **Hook**: Form state management for recipe create/edit |

### Forms (`components/forms/`)
| Component | Purpose |mer
|-----------|---------|
| `AddItemForm` | Generic add-item form pattern |
| `IngredientRow` | Ingredient with quantity/unit inputs |
| `QuantityInput` | Quantity input with validation |
| `ValidatedInput` | Input with validation state/feedback |

### Common (`components/common/`)
| Component | Purpose |
|-----------|---------|
| `FavoriteButton` | Heart toggle for favorites |
| `ThemeToggle` | Light/dark mode toggle |
| `StatsCard` | Dashboard statistics card |
| `SafeLink` | Navigation link with safety checks |

### Settings (`components/settings/`)
| Component | Purpose |
|-----------|---------|
| `DataManagementSection` | Import/export controls |

---

## Utilities (`lib/`)

| File | What it provides |
|------|------------------|
| `api.ts` | **API client** - `recipeApi`, `plannerApi`, `shoppingApi`, `ingredientApi`, `uploadApi`, `dataManagementApi` |
| `constants.ts` | Dropdown options: `MEAL_TYPES`, `RECIPE_CATEGORIES`, `DIETARY_PREFERENCES`, `INGREDIENT_UNITS`, `INGREDIENT_CATEGORIES`, `QUICK_FILTERS` |
| `formValidation.ts` | Validators: `validateString`, `validateNumber`, `validateRecipeName`, `validateQuantity`, `validateServings`, `validateForm` |
| `imageUtils.ts` | Image URL handling, Cloudinary helpers, fallback logic |
| `quantityUtils.ts` | Unit conversion, quantity scaling |
| `recipeCardMapper.ts` | Transform `RecipeResponseDTO` → `RecipeCardData` for UI |
| `utils.ts` | General utilities, `cn()` class merger |
| `config.ts` | App configuration |
| `mockData.ts` | Mock data for testing/demos |

---

## Custom Hooks (`hooks/`)

| Hook | Purpose |
|------|---------|
| `useSettings` | Theme management, settings persistence |
| `useUnsavedChanges` | **Warn on navigation** - tracks dirty state, shows confirmation dialog, handles browser back/refresh |

---

## Types (`types/index.ts`)

All TypeScript interfaces matching backend DTOs. Key types:

- **Recipe**: `RecipeResponseDTO`, `RecipeCardDTO`, `RecipeCreateDTO`, `RecipeUpdateDTO`, `RecipeFilterDTO`
- **Meal**: `MealSelectionResponseDTO`, `MealSelectionCreateDTO`, `MealPlanSummaryDTO`
- **Shopping**: `ShoppingItemResponseDTO`, `ShoppingListResponseDTO`, `ShoppingListFilterDTO`
- **Ingredient**: `IngredientResponseDTO`, `IngredientDetailDTO`, `IngredientSearchDTO`
- **Data**: `ImportPreviewDTO`, `ImportResultDTO`, `ExportFilterDTO`

---

## Quick Patterns

### Adding a new API call
1. Add endpoint method to appropriate namespace in `lib/api.ts`
2. Add corresponding DTO types to `types/index.ts`

### Adding a new shadcn component
```bash
npx shadcn@latest add <component-name>
```

### Form with validation
Use `formValidation.ts` validators + `ValidatedInput` component

### Navigation with unsaved changes warning
Use `useUnsavedChanges` hook from `hooks/`

### Displaying a recipe card
Use `RecipeCard` + `recipeCardMapper.ts` to transform data
