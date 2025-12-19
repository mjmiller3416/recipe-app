# Meal Genie Frontend Documentation

Complete technical documentation for the Meal Genie frontend application.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Pages](#pages)
5. [Components](#components)
6. [API Client](#api-client)
7. [TypeScript Types](#typescript-types)
8. [Custom Hooks](#custom-hooks)
9. [Utility Functions](#utility-functions)
10. [Configuration](#configuration)
11. [State Management](#state-management)
12. [Form Validation](#form-validation)
13. [Styling & Theming](#styling--theming)
14. [Development Guide](#development-guide)

---

## Overview

Meal Genie is a recipe management and meal planning application built with Next.js 16 and React 19. The frontend provides:

- **Recipe Browser** - Search, filter, and manage recipes
- **Meal Planner** - Plan meals for the week/month
- **Shopping List** - Generate and manage shopping lists from recipes
- **Dashboard** - Overview of meal planning stats
- **Settings** - User preferences and configuration

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework with App Router |
| React | 19 | UI library |
| TypeScript | Latest | Type safety |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui | New York style | UI component library |
| Radix UI | Latest | Accessible primitives |
| Lucide React | Latest | Icon library |
| Sonner | Latest | Toast notifications |
| next-themes | Latest | Theme management |

---

## Directory Structure

```
frontend/
├── public/
│   └── images/                    # Static images (recipes, hero, placeholders)
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── api/upload/            # Image upload API route
│   │   ├── dashboard/             # Dashboard page
│   │   ├── meal-planner/          # Meal planner page
│   │   ├── recipes/               # Recipe pages
│   │   │   ├── [id]/              # Dynamic recipe detail
│   │   │   │   ├── edit/          # Edit recipe
│   │   │   │   └── page.tsx       # View recipe
│   │   │   ├── add/               # Add new recipe
│   │   │   ├── new/               # Alternative add form
│   │   │   └── page.tsx           # Recipe browser
│   │   ├── shopping-list/         # Shopping list page
│   │   ├── settings/              # Settings page
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Global styles
│   │   └── page.tsx               # Home (redirects to dashboard)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── common/                # Shared components
│   │   ├── forms/                 # Form components
│   │   ├── recipe/                # Recipe-specific components
│   │   └── layout/                # Layout components
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utilities and API client
│   └── types/                     # TypeScript type definitions
├── components.json                # shadcn/ui configuration
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

---

## Pages

### Page Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard with stats |
| `/recipes` | `app/recipes/page.tsx` | Recipe browser with search/filter |
| `/recipes/[id]` | `app/recipes/[id]/page.tsx` | Recipe detail view |
| `/recipes/[id]/edit` | `app/recipes/[id]/edit/page.tsx` | Edit existing recipe |
| `/recipes/add` | `app/recipes/add/page.tsx` | Add new recipe form |
| `/recipes/new` | `app/recipes/new/page.tsx` | Alternative add form |
| `/meal-planner` | `app/meal-planner/page.tsx` | Meal planning calendar |
| `/shopping-list` | `app/shopping-list/page.tsx` | Shopping list management |
| `/settings` | `app/settings/page.tsx` | User settings |
| `/api/upload` | `app/api/upload/route.ts` | Image upload endpoint |

### Page Features

#### Recipe Browser (`/recipes`)
- Hero section with search bar
- Quick filter pills (breakfast, under 30min, dinner, vegetarian, favorites)
- Advanced filters (category, meal type, dietary preferences, cook time)
- Sort options (name, date, time, rating)
- Grid/list view toggle
- Pagination

#### Recipe Detail (`/recipes/[id]`)
- Full recipe information
- Ingredient list with quantities
- Step-by-step instructions
- Nutritional information (if available)
- Favorite toggle
- Edit/delete actions

#### Meal Planner (`/meal-planner`)
- Calendar view (week/month)
- Drag-and-drop meal assignment
- Main dish and side dish slots
- Generate shopping list from planned meals

#### Shopping List (`/shopping-list`)
- Grouped by category
- Checkbox for purchased items
- Manual item addition
- Clear completed items
- Recipe source tracking

---

## Components

### UI Components (`/components/ui/`)

Core shadcn/ui components built on Radix UI primitives:

| Component | File | Description |
|-----------|------|-------------|
| `Accordion` | `accordion.tsx` | Collapsible content sections |
| `AlertDialog` | `alert-dialog.tsx` | Confirmation dialogs |
| `Avatar` | `avatar.tsx` | User avatar display |
| `Button` | `button.tsx` | Button with variants (default, destructive, outline, secondary, ghost, link) |
| `Card` | `card.tsx` | Card container with header, content, footer |
| `Checkbox` | `checkbox.tsx` | Checkbox input |
| `Collapsible` | `collapsible.tsx` | Expandable sections |
| `Dialog` | `dialog.tsx` | Modal dialogs |
| `Input` | `input.tsx` | Text input field |
| `Label` | `label.tsx` | Form labels |
| `Select` | `select.tsx` | Dropdown select |
| `Separator` | `separator.tsx` | Visual divider |
| `Sonner` | `sonner.tsx` | Toast notifications |
| `Tabs` | `tabs.tsx` | Tabbed content |
| `Textarea` | `textarea.tsx` | Multi-line text input |
| `Tooltip` | `tooltip.tsx` | Tooltip popover |

#### Button Variants

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### Common Components (`/components/common/`)

Reusable components used across the application.

#### FavoriteButton

Heart icon button for marking recipes as favorites.

```tsx
import { FavoriteButton } from "@/components/common/FavoriteButton";

<FavoriteButton
  isFavorite={recipe.isFavorite}
  onToggle={() => handleToggleFavorite(recipe.id)}
  variant="overlay"  // "overlay" | "inline"
  size="md"          // "sm" | "md" | "lg"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isFavorite` | `boolean` | required | Current favorite state |
| `onToggle` | `() => void` | required | Toggle callback |
| `variant` | `"overlay" \| "inline"` | `"inline"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |

#### SafeLink

Navigation wrapper that prevents data loss with unsaved changes.

```tsx
import { SafeLink } from "@/components/common/SafeLink";

<SafeLink href="/recipes">
  View Recipes
</SafeLink>
```

#### StatsCard

Statistics display card for dashboards.

```tsx
import { StatsCard } from "@/components/common/StatsCard";

<StatsCard
  title="Total Recipes"
  value={42}
  icon={<BookOpen />}
/>
```

#### ThemeToggle

Light/dark theme switcher.

```tsx
import { ThemeToggle } from "@/components/common/ThemeToggle";

<ThemeToggle />
```

### Form Components (`/components/forms/`)

Specialized form inputs and components.

#### ValidatedInput

Text input with inline validation feedback.

```tsx
import { ValidatedInput } from "@/components/forms/ValidatedInput";

<ValidatedInput
  value={name}
  onChange={setName}
  error={errors.name}
  placeholder="Recipe name"
/>
```

#### QuantityInput

Specialized input for recipe quantities supporting fractions.

```tsx
import { QuantityInput } from "@/components/forms/QuantityInput";

<QuantityInput
  value={quantity}
  onChange={setQuantity}
  placeholder="1 1/2"
/>
```

Accepts formats: `1.5`, `1/2`, `1 1/2`, `1-1/2`

#### IngredientRow

Single ingredient input row for recipe forms.

```tsx
import { IngredientRow } from "@/components/forms/IngredientRow";

<IngredientRow
  ingredient={ingredient}
  onChange={handleChange}
  onRemove={handleRemove}
/>
```

#### AddItemForm

Form for adding items to shopping list.

```tsx
import { AddItemForm } from "@/components/forms/AddItemForm";

<AddItemForm onAdd={handleAddItem} />
```

### Recipe Components (`/components/recipe/`)

Recipe-specific display components.

#### RecipeCard

Unified recipe card component supporting three sizes.

```tsx
import { RecipeCard, RecipeCardGrid } from "@/components/recipe/RecipeCard";

// Small - Horizontal compact layout
<RecipeCard recipe={recipe} size="small" />

// Medium - Standard grid card (default)
<RecipeCard recipe={recipe} size="medium" />

// Large - Side-by-side with full details
<RecipeCard recipe={recipe} size="large" />

// Grid layout helper
<RecipeCardGrid>
  {recipes.map(recipe => (
    <RecipeCard key={recipe.id} recipe={recipe} />
  ))}
</RecipeCardGrid>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `recipe` | `RecipeCardData` | required | Recipe data |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` | Card size variant |
| `onClick` | `() => void` | - | Click handler |
| `onFavoriteToggle` | `() => void` | - | Favorite toggle handler |
| `showCategory` | `boolean` | `true` | Show category badge |
| `maxIngredientsDisplay` | `number` | `5` | Max ingredients to show (large) |

#### RecipeBadge

Category, meal type, and dietary preference badges.

```tsx
import { RecipeBadge } from "@/components/recipe/RecipeBadge";

<RecipeBadge type="category" value="chicken" />
<RecipeBadge type="mealType" value="dinner" size="sm" />
<RecipeBadge type="dietary" value="vegetarian" variant="overlay" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"category" \| "mealType" \| "dietary"` | required | Badge type |
| `value` | `string` | required | Badge value |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Badge size |
| `variant` | `"default" \| "overlay"` | `"default"` | Visual variant |

#### RecipeImage

Image display with fallback placeholder.

```tsx
import { RecipeImage } from "@/components/recipe/RecipeImage";

<RecipeImage
  src={recipe.imageUrl}
  alt={recipe.name}
  className="w-full h-48 object-cover"
/>
```

### Layout Components (`/components/layout/`)

Application structure components.

#### AppLayout

Root layout wrapper with sidebar.

```tsx
import { AppLayout } from "@/components/layout/AppLayout";

<AppLayout>
  <main>{children}</main>
</AppLayout>
```

#### Sidebar

Main navigation sidebar.

```tsx
import { Sidebar } from "@/components/layout/Sidebar";

<Sidebar />
```

**Navigation Items:**
- Dashboard
- Meal Planner
- Recipe Browser
- Shopping List
- Add Recipe
- Settings

#### PageHeader

Sticky page header with title and actions.

```tsx
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions
} from "@/components/layout/PageHeader";

<PageHeader>
  <PageHeaderContent>
    <PageHeaderTitle>Recipe Browser</PageHeaderTitle>
    <p className="text-muted-foreground">Browse and manage your recipes</p>
  </PageHeaderContent>
  <PageHeaderActions>
    <Button>Add Recipe</Button>
  </PageHeaderActions>
</PageHeader>
```

#### NavButton

Navigation button with active state indicator.

```tsx
import { NavButton } from "@/components/layout/NavButton";

<NavButton
  href="/recipes"
  icon={<BookOpen />}
  label="Recipes"
  isActive={pathname === "/recipes"}
/>
```

#### Logo

Application logo component.

```tsx
import { Logo } from "@/components/layout/Logo";

<Logo className="h-8 w-8" />
```

---

## API Client

The API client (`src/lib/api.ts`) provides typed methods for all backend endpoints.

### Configuration

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

### Error Handling

```typescript
import { ApiError } from "@/lib/api";

try {
  const recipe = await recipeApi.get(id);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    console.error("Details:", error.details);
  }
}
```

### Recipe API

```typescript
import { recipeApi } from "@/lib/api";

// List all recipes
const recipes = await recipeApi.list();

// List recipe cards (lightweight)
const cards = await recipeApi.listCards(filters);

// Get single recipe
const recipe = await recipeApi.get(id);

// Create recipe
const newRecipe = await recipeApi.create(recipeData);

// Update recipe
const updated = await recipeApi.update(id, recipeData);

// Delete recipe
await recipeApi.delete(id);

// Toggle favorite
await recipeApi.toggleFavorite(id);

// Get categories
const categories = await recipeApi.getCategories();

// Get meal types
const mealTypes = await recipeApi.getMealTypes();
```

### Planner API

```typescript
import { plannerApi } from "@/lib/api";

// Get meals for date range
const meals = await plannerApi.getMeals({ startDate, endDate });

// Get summary stats
const summary = await plannerApi.getSummary();

// Get single meal
const meal = await plannerApi.getMeal(id);

// Create meal selection
const newMeal = await plannerApi.createMeal(mealData);

// Update meal selection
const updated = await plannerApi.updateMeal(id, mealData);

// Delete meal selection
await plannerApi.deleteMeal(id);

// Clear meal plan
await plannerApi.clearPlan({ startDate, endDate });
```

### Shopping API

```typescript
import { shoppingApi } from "@/lib/api";

// Get shopping list
const list = await shoppingApi.getList(filters);

// Get single item
const item = await shoppingApi.getItem(id);

// Add manual item
const newItem = await shoppingApi.addItem(itemData);

// Update item
const updated = await shoppingApi.updateItem(id, itemData);

// Toggle item checked
await shoppingApi.toggleItem(id);

// Delete item
await shoppingApi.deleteItem(id);

// Generate from recipes
await shoppingApi.generate({ recipeIds, servings });

// Clear operations
await shoppingApi.clear();           // Clear all
await shoppingApi.clearManual();     // Clear manual items
await shoppingApi.clearCompleted();  // Clear checked items

// Bulk update
await shoppingApi.bulkUpdate(items);

// Get category breakdown
const breakdown = await shoppingApi.getBreakdown();
```

### Ingredient API

```typescript
import { ingredientApi } from "@/lib/api";

// List ingredients
const ingredients = await ingredientApi.list();

// Get categories
const categories = await ingredientApi.getCategories();

// Get ingredient names
const names = await ingredientApi.getNames();

// Get single ingredient
const ingredient = await ingredientApi.get(id);

// Create ingredient
const newIngredient = await ingredientApi.create(ingredientData);

// Search ingredients
const results = await ingredientApi.search(query);
```

### Upload API

```typescript
import { uploadApi } from "@/lib/api";

// Upload recipe image
const imagePath = await uploadApi.uploadRecipeImage(file, recipeId);
```

---

## TypeScript Types

All types are defined in `src/types/index.ts` and mirror backend DTOs.

### Recipe Types

```typescript
// Recipe card for list views
interface RecipeCardDTO {
  id: number;
  recipe_name: string;
  description: string | null;
  servings: number;
  total_time: number | null;
  category: string | null;
  meal_type: string[] | null;
  dietary_preferences: string[] | null;
  image_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// Full recipe response
interface RecipeResponseDTO extends RecipeCardDTO {
  instructions: string | null;
  ingredients: RecipeIngredientResponseDTO[];
}

// Create/update payload
interface RecipeCreateDTO {
  recipe_name: string;
  description?: string;
  instructions?: string;
  servings: number;
  total_time?: number;
  category?: string;
  meal_type?: string[];
  dietary_preferences?: string[];
  image_url?: string;
  is_favorite?: boolean;
  ingredients?: RecipeIngredientDTO[];
}

// Frontend-mapped format
interface RecipeCardData {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  totalTime: number | null;
  category: string | null;
  mealType: string[] | null;
  dietaryPreferences: string[] | null;
  imageUrl: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  ingredients?: RecipeIngredient[];
}
```

### Ingredient Types

```typescript
interface IngredientResponseDTO {
  id: number;
  ingredient_name: string;
  category: string | null;
}

interface IngredientDetailDTO {
  id: number;
  ingredient_name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
}

// Frontend format
interface RecipeIngredient {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
}
```

### Meal Planning Types

```typescript
interface MealSelectionResponseDTO {
  id: number;
  date: string;
  meal_type: string;
  main_recipe_id: number | null;
  main_recipe?: RecipeCardDTO;
  side_recipe_id: number | null;
  side_recipe?: RecipeCardDTO;
  notes: string | null;
  is_favorite: boolean;
}

interface MealSelectionCreateDTO {
  date: string;
  meal_type: string;
  main_recipe_id?: number;
  side_recipe_id?: number;
  notes?: string;
}

interface MealPlanSummaryDTO {
  total_meals: number;
  meals_this_week: number;
  favorite_meals: number;
}
```

### Shopping List Types

```typescript
interface ShoppingItemResponseDTO {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  is_checked: boolean;
  is_manual: boolean;
  source_recipe_ids: number[];
  created_at: string;
}

interface ShoppingListResponseDTO {
  items: ShoppingItemResponseDTO[];
  total_items: number;
  checked_items: number;
  categories: string[];
}

interface ManualItemCreateDTO {
  ingredient_name: string;
  quantity: number;
  unit?: string;
  category?: string;
}

interface ShoppingListGenerationDTO {
  recipe_ids: number[];
  servings?: number;
}
```

### Filter Types

```typescript
interface RecipeFilterDTO {
  search?: string;
  category?: string;
  meal_type?: string[];
  dietary_preferences?: string[];
  max_time?: number;
  is_favorite?: boolean;
  sort_by?: "name" | "created_at" | "total_time" | "rating";
  sort_direction?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

interface ShoppingListFilterDTO {
  category?: string;
  is_checked?: boolean;
  is_manual?: boolean;
}
```

---

## Custom Hooks

### useUnsavedChanges

Prevents navigation when forms have unsaved changes.

```typescript
import { useUnsavedChanges } from "@/hooks";

function RecipeForm() {
  const [isDirty, setIsDirty] = useState(false);

  const {
    showLeaveDialog,
    setShowLeaveDialog,
    pendingNavigation,
    handleNavigation,
    confirmLeave,
    cancelLeave
  } = useUnsavedChanges("/recipes/add", isDirty);

  return (
    <>
      <form>
        {/* form fields */}
      </form>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Helper Functions:**

```typescript
import {
  setNavigationBypass,
  hasAnyUnsavedChanges,
  getUnsavedChangesCheck
} from "@/hooks";

// Temporarily disable checks (for confirmed navigation)
setNavigationBypass(true);
router.push("/recipes");
setNavigationBypass(false);

// Check if any page has unsaved changes
if (hasAnyUnsavedChanges()) {
  // Show warning
}

// Get check function for specific page
const check = getUnsavedChangesCheck("/recipes/add");
if (check && check()) {
  // Page has unsaved changes
}
```

### useSettings

Application settings management with localStorage persistence.

```typescript
import { useSettings } from "@/hooks";

function SettingsPage() {
  const {
    settings,
    isLoaded,
    updateSettings,
    updateMultipleSections,
    saveSettings,
    resetSettings,
    resetSection,
    hasUnsavedChanges,
    discardChanges
  } = useSettings();

  if (!isLoaded) return <Loading />;

  return (
    <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
      <Input
        value={settings.profile.displayName}
        onChange={(e) => updateSettings("profile", { displayName: e.target.value })}
      />

      <Select
        value={settings.appearance.theme}
        onValueChange={(value) => updateSettings("appearance", { theme: value })}
      >
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </Select>

      <Button type="submit" disabled={!hasUnsavedChanges}>
        Save Changes
      </Button>
      <Button variant="outline" onClick={discardChanges}>
        Discard
      </Button>
    </form>
  );
}
```

**Settings Structure:**

```typescript
interface AppSettings {
  profile: {
    displayName: string;
    email: string;
    avatar: string;
  };
  appearance: {
    theme: "light" | "dark" | "system";
  };
  mealPlanning: {
    defaultServings: number;
    weekStartDay: "sunday" | "monday";
    defaultMealTypes: string[];
  };
  recipePreferences: {
    measurementUnit: "imperial" | "metric";
    dietaryRestrictions: string[];
    allergenAlerts: string[];
    defaultBrowserView: "grid" | "list";
    defaultSortOrder: string;
  };
  shoppingList: {
    categorySortOrder: string[];
    autoClearChecked: boolean;
    combineDuplicates: boolean;
  };
  dataManagement: {
    autoBackup: boolean;
    backupFrequency: "daily" | "weekly" | "monthly";
  };
}
```

---

## Utility Functions

### Form Validation (`lib/formValidation.ts`)

Pydantic-like validation system that normalizes input and returns errors.

#### Basic Validators

```typescript
import {
  validateString,
  validateNumber,
  validateInteger,
  validateRecipeName,
  validateIngredientName,
  validateQuantity,
  validateServings,
  validateTotalTime
} from "@/lib/formValidation";

// String validation
const result = validateString(input, {
  min: 1,
  max: 255,
  required: true,
  pattern: /^[a-zA-Z\s]+$/,
  message: "Custom error message",
  label: "Field Name"
});

if (!result.isValid) {
  console.error(result.error);
}

// Pre-built validators
const nameResult = validateRecipeName("Pasta Carbonara");
const quantityResult = validateQuantity("1.5");
const servingsResult = validateServings("4");
```

#### Form-Level Validation

```typescript
import { validateForm, ValidationSchema } from "@/lib/formValidation";

interface RecipeFormData {
  name: string;
  servings: string;
  totalTime: string;
}

const schema: ValidationSchema<RecipeFormData> = {
  name: validateRecipeName,
  servings: validateServings,
  totalTime: validateTotalTime
};

const { values, isValid, errors } = validateForm(formData, schema);

if (!isValid) {
  // errors = { name?: string, servings?: string, totalTime?: string }
  Object.entries(errors).forEach(([field, error]) => {
    console.error(`${field}: ${error}`);
  });
}
```

#### Advanced Validators

```typescript
import { chain, optional, createAsyncValidator, collectErrors } from "@/lib/formValidation";

// Chain validators
const validator = chain(
  validateString({ min: 1 }),
  (value) => value.includes("@") ? valid(value) : invalid(value, "Must contain @")
);

// Optional fields
const optionalNumber = optional(validateNumber({ min: 0 }));

// Async validation with debounce
const checkUniqueName = createAsyncValidator(
  async (name) => {
    const exists = await api.checkExists(name);
    return exists ? "Name already exists" : null;
  },
  300 // debounce ms
);

// Collect errors from array
const ingredientErrors = collectErrors(ingredients, validateIngredient);
```

### Image Utilities (`lib/imageUtils.ts`)

```typescript
import {
  getRecipeImageUrl,
  getRecipeImageUrlWithFallback,
  generateRecipeImagePath,
  generateRecipeBannerPath
} from "@/lib/imageUtils";

// Get URL or undefined for invalid paths
const url = getRecipeImageUrl("/images/recipes/1.jpg");

// Get URL with fallback placeholder
const urlWithFallback = getRecipeImageUrlWithFallback(recipe.imageUrl);

// Generate paths for new images
const imagePath = generateRecipeImagePath(recipeId, "jpg");
// → "/images/recipes/123.jpg"

const bannerPath = generateRecipeBannerPath(recipeId, "jpg");
// → "/images/recipes/123-banner.jpg"
```

### Quantity Utilities (`lib/quantityUtils.ts`)

```typescript
import { parseQuantity, formatQuantity } from "@/lib/quantityUtils";

// Parse various formats to number
parseQuantity("1.5");      // → 1.5
parseQuantity("1/2");      // → 0.5
parseQuantity("1 1/2");    // → 1.5
parseQuantity("1-1/2");    // → 1.5

// Format number as user-friendly string
formatQuantity(1.5);       // → "1 1/2"
formatQuantity(0.333);     // → "1/3"
formatQuantity(0.25);      // → "1/4"
formatQuantity(2);         // → "2"
```

### Recipe Card Mapper (`lib/recipeCardMapper.ts`)

```typescript
import { mapRecipeForCard, mapRecipesForCards, mapIngredientForCard } from "@/lib/recipeCardMapper";

// Map single recipe
const cardData = mapRecipeForCard(recipeDTO);

// Map array of recipes
const cards = mapRecipesForCards(recipeDTOs);

// Map ingredient
const ingredient = mapIngredientForCard(ingredientDTO);
```

### General Utilities (`lib/utils.ts`)

```typescript
import { cn, formatQuantity } from "@/lib/utils";

// Merge Tailwind classes
const className = cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" ? "primary-class" : "secondary-class"
);
```

### Constants (`lib/constants.ts`)

```typescript
import {
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  DIETARY_PREFERENCES,
  INGREDIENT_UNITS,
  INGREDIENT_CATEGORIES,
  QUICK_FILTERS
} from "@/lib/constants";

// Use in select dropdowns
<Select>
  {MEAL_TYPES.map(type => (
    <SelectItem key={type.value} value={type.value}>
      {type.label}
    </SelectItem>
  ))}
</Select>

// Quick filters for recipe browser
QUICK_FILTERS.forEach(filter => {
  console.log(filter.id, filter.label, filter.type, filter.value);
});
```

**Available Constants:**

| Constant | Values |
|----------|--------|
| `MEAL_TYPES` | breakfast, lunch, dinner, dessert, snack |
| `RECIPE_CATEGORIES` | ground-beef, chicken, seafood, veggie, other |
| `DIETARY_PREFERENCES` | vegetarian, vegan, gluten-free, dairy-free, keto, paleo, low-carb |
| `INGREDIENT_UNITS` | tbs, tsp, cup, oz, lbs, g, kg, ml, L, bag, box, can, jar, package, piece, whole, pinch, dash, to-taste |
| `INGREDIENT_CATEGORIES` | produce, dairy, meat, seafood, pantry, spices, frozen, bakery, beverages, other |

---

## Configuration

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Path Alias Usage:**

```typescript
// Instead of relative imports
import { Button } from "../../../components/ui/button";

// Use path alias
import { Button } from "@/components/ui/button";
```

### Next.js (`next.config.ts`)

Minimal configuration - uses Next.js defaults.

### shadcn/ui (`components.json`)

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Adding Components:**

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## State Management

The application uses minimal state management with React's built-in features:

### Local Component State

```typescript
const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Settings Persistence

User preferences are stored in `localStorage` via the `useSettings` hook:

```typescript
const { settings, updateSettings } = useSettings();
```

### Global State Registry

Cross-page state for unsaved changes tracking:

```typescript
// Global Map registry (internal to useUnsavedChanges)
const unsavedChangesRegistry = new Map<string, () => boolean>();
```

### Theme Management

Uses `next-themes` for theme persistence:

```typescript
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

---

## Form Validation

### Pattern 1: Field-Level Validation

```typescript
function RecipeForm() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    const result = validateRecipeName(value);
    setNameError(result.isValid ? null : result.error);
  };

  return (
    <ValidatedInput
      value={name}
      onChange={handleNameChange}
      error={nameError}
      placeholder="Recipe name"
    />
  );
}
```

### Pattern 2: Form Submission Validation

```typescript
function RecipeForm() {
  const [formData, setFormData] = useState({
    name: "",
    servings: "",
    totalTime: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const schema = {
      name: validateRecipeName,
      servings: validateServings,
      totalTime: optional(validateTotalTime)
    };

    const { values, isValid, errors } = validateForm(formData, schema);

    if (!isValid) {
      setErrors(errors);
      return;
    }

    // Submit with validated values
    api.createRecipe(values);
  };
}
```

### Pattern 3: Real-Time Validation

```typescript
function RecipeForm() {
  const [name, setName] = useState("");

  const nameResult = useMemo(
    () => validateRecipeName(name),
    [name]
  );

  return (
    <div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={!nameResult.isValid ? "border-red-500" : ""}
      />
      {!nameResult.isValid && (
        <p className="text-sm text-red-500">{nameResult.error}</p>
      )}
    </div>
  );
}
```

---

## Styling & Theming

### CSS Variables

Defined in `globals.css` and used throughout the application:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark theme overrides */
}
```

### Tailwind Usage

```tsx
// Basic styling
<div className="p-4 bg-background text-foreground border border-border rounded-lg">

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Dark mode aware
<div className="bg-white dark:bg-gray-900">

// Using CSS variables
<div className="bg-sidebar text-sidebar-foreground">
```

### Class Merging

Use the `cn()` utility for conditional classes:

```typescript
import { cn } from "@/lib/utils";

<Button
  className={cn(
    "base-styles",
    isActive && "active-styles",
    disabled && "opacity-50 cursor-not-allowed"
  )}
/>
```

---

## Development Guide

### Getting Started

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (0.0.0.0:3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc` | TypeScript type checking |

### Adding shadcn/ui Components

```bash
# Add single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add card dialog alert-dialog

# List available components
npx shadcn@latest add
```

### Creating New Pages

1. Create directory in `src/app/`
2. Add `page.tsx` file
3. Export default component

```typescript
// src/app/my-page/page.tsx
export default function MyPage() {
  return (
    <div className="p-6">
      <h1>My Page</h1>
    </div>
  );
}
```

### Creating New Components

1. Determine component category (ui, common, forms, recipe, layout)
2. Create file in appropriate directory
3. Export component

```typescript
// src/components/common/MyComponent.tsx
interface MyComponentProps {
  title: string;
  children: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Adding API Endpoints

1. Add types to `src/types/index.ts`
2. Add API methods to `src/lib/api.ts`

```typescript
// types/index.ts
export interface NewFeatureDTO {
  id: number;
  name: string;
}

// lib/api.ts
export const newFeatureApi = {
  async list(): Promise<NewFeatureDTO[]> {
    return fetchApi("/api/new-feature");
  },

  async create(data: Partial<NewFeatureDTO>): Promise<NewFeatureDTO> {
    return fetchApi("/api/new-feature", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
};
```

### Best Practices

1. **Type Safety** - Always define TypeScript interfaces for props and API responses
2. **Component Organization** - Keep components small and focused
3. **Error Handling** - Use try/catch with ApiError for API calls
4. **Form Validation** - Use the validation utilities for consistent UX
5. **Accessibility** - Leverage Radix UI primitives for ARIA support
6. **Performance** - Use `useMemo` and `useCallback` for expensive operations
7. **Code Style** - Run `npm run lint` before committing

---

## File Reference

Quick reference for common file locations:

| Need to... | Look in... |
|------------|------------|
| Add a page | `src/app/` |
| Add UI component | `src/components/ui/` |
| Add shared component | `src/components/common/` |
| Add form component | `src/components/forms/` |
| Add recipe component | `src/components/recipe/` |
| Add layout component | `src/components/layout/` |
| Add API method | `src/lib/api.ts` |
| Add TypeScript type | `src/types/index.ts` |
| Add custom hook | `src/hooks/` |
| Add utility function | `src/lib/` |
| Add constant/dropdown | `src/lib/constants.ts` |
| Modify global styles | `src/app/globals.css` |
| Configure TypeScript | `tsconfig.json` |
| Configure shadcn/ui | `components.json` |
