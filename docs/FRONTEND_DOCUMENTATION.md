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

- **Recipe Browser** - Search, filter, and manage recipes with advanced filtering
- **Meal Planner** - Plan meals with drag-and-drop reordering and AI suggestions
- **Shopping List** - Auto-generated from meal plans with smart categorization
- **Dashboard** - Overview with widgets for stats, streaks, quick actions, and AI chat
- **Meal Genie AI** - Conversational assistant for cooking help and recipe suggestions
- **Settings** - User preferences, data management, and unit conversions

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework with App Router |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Utility-first styling (PostCSS) |
| shadcn/ui | New York style | UI component library |
| Radix UI | Latest | Accessible primitives |
| React Query | 5.x | Server state management |
| dnd-kit | Latest | Drag and drop functionality |
| Framer Motion | Latest | Animations |
| Lucide React | Latest | Icon library |
| Sonner | Latest | Toast notifications |
| next-themes | Latest | Theme management |
| React Markdown | Latest | Markdown rendering for AI responses |

---

## Directory Structure

```
frontend/
├── public/
│   └── images/                    # Static images (recipes, hero, placeholders)
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── api/upload/            # Image upload API route
│   │   ├── dashboard/             # Dashboard with widgets
│   │   │   └── _components/       # Dashboard-specific components
│   │   ├── meal-planner/          # Meal planner page
│   │   │   ├── create/            # Create new meal plan
│   │   │   └── _components/       # Planner components & dialogs
│   │   ├── recipes/               # Recipe pages
│   │   │   ├── [id]/              # Dynamic recipe detail
│   │   │   │   ├── edit/          # Edit recipe
│   │   │   │   └── _components/   # Detail view components
│   │   │   ├── add/               # Add new recipe
│   │   │   └── _components/       # Browser & form components
│   │   ├── shopping-list/         # Shopping list page
│   │   │   └── _components/       # Shopping list components
│   │   ├── settings/              # Settings page
│   │   │   └── _components/       # Settings sections
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Global styles
│   │   └── page.tsx               # Home (redirects to dashboard)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (22+)
│   │   ├── common/                # Shared components (12+)
│   │   ├── forms/                 # Form components
│   │   ├── recipe/                # Recipe-specific components
│   │   ├── layout/                # Layout components (10+)
│   │   ├── meal-genie/            # AI assistant components
│   │   └── settings/              # Settings components
│   ├── hooks/                     # Custom React hooks (11)
│   ├── lib/                       # Utilities, API client, providers
│   │   └── providers/             # React Query provider
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
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard with widgets |
| `/recipes` | `app/recipes/page.tsx` | Recipe browser with search/filter |
| `/recipes/[id]` | `app/recipes/[id]/page.tsx` | Recipe detail view with print |
| `/recipes/[id]/edit` | `app/recipes/[id]/edit/page.tsx` | Edit existing recipe |
| `/recipes/add` | `app/recipes/add/page.tsx` | Add new recipe form |
| `/meal-planner` | `app/meal-planner/page.tsx` | Meal planning with grid layout |
| `/meal-planner/create` | `app/meal-planner/create/page.tsx` | Create new meal |
| `/shopping-list` | `app/shopping-list/page.tsx` | Shopping list management |
| `/settings` | `app/settings/page.tsx` | User settings |
| `/api/upload` | `app/api/upload/route.ts` | Image upload endpoint |

### Page Features

#### Dashboard (`/dashboard`)
- Stats cards (total recipes, favorites, meals planned, shopping items)
- Cooking streak tracker with weekly activity visualization
- Upcoming meals widget (meal queue preview)
- Quick add widget for fast recipe creation
- Recipe roulette (random recipe suggestion)
- Shopping list summary widget
- Chef tip widget (AI-generated cooking tips)
- Ask Meal Genie chat widget

#### Recipe Browser (`/recipes`)
- Hero section with search bar
- Quick filter pills (breakfast, lunch, dinner, sides, new, under 30m, favorites)
- Advanced filters sidebar (category, meal type, dietary preferences, cook time)
- Sort options (name, date, time, servings)
- Grid view with recipe cards
- Recently viewed recipes chips

#### Recipe Detail (`/recipes/[id]`)
- Hero banner image with gradient overlay
- Recipe metadata (servings, time, tags)
- Ingredient list grouped by category with checkboxes
- Step-by-step directions
- Notes section
- Print preview dialog with optimized layout
- Add to meal plan dialog
- Favorite toggle
- Edit/delete actions

#### Meal Planner (`/meal-planner`)
- Grid layout for meals
- Drag-and-drop reordering
- Shopping mode cycling (all → produce only → none)
- Completion tracking
- Selected meal preview with AI suggestions
- Saved meals dialog
- Recipe picker dialog
- Meal preview on hover

#### Shopping List (`/shopping-list`)
- Items grouped by category
- Checkbox for "have" status
- Flag items for attention
- Recipe source sidebar (shows which recipes need each ingredient)
- Manual item addition
- Clear completed items
- Auto-generation from meal planner

#### Settings (`/settings`)
- Profile section
- Appearance (theme toggle)
- Meal planning preferences
- Recipe preferences
- Shopping list preferences
- Unit conversion rules
- AI features toggles
- Data management (import/export/backup/restore)
- Feedback submission

---

## Components

### UI Components (`/components/ui/`)

Core shadcn/ui components built on Radix UI primitives:

| Component | File | Description |
|-----------|------|-------------|
| `Accordion` | `accordion.tsx` | Collapsible content sections |
| `AlertDialog` | `alert-dialog.tsx` | Confirmation dialogs |
| `Avatar` | `avatar.tsx` | User avatar display |
| `Badge` | `badge.tsx` | Status/category badges |
| `Button` | `button.tsx` | Button with variants |
| `Card` | `card.tsx` | Card container |
| `Checkbox` | `checkbox.tsx` | Checkbox input |
| `Collapsible` | `collapsible.tsx` | Expandable sections |
| `Command` | `command.tsx` | Command palette |
| `Dialog` | `dialog.tsx` | Modal dialogs |
| `DropdownMenu` | `dropdown-menu.tsx` | Dropdown menus |
| `Input` | `input.tsx` | Text input field |
| `Label` | `label.tsx` | Form labels |
| `MultiSelect` | `multi-select.tsx` | Multi-select dropdown |
| `Popover` | `popover.tsx` | Popover containers |
| `ScrollArea` | `scroll-area.tsx` | Scrollable containers |
| `Select` | `select.tsx` | Dropdown select |
| `Separator` | `separator.tsx` | Visual divider |
| `Sheet` | `sheet.tsx` | Side drawer/panel |
| `Skeleton` | `skeleton.tsx` | Loading placeholders |
| `Sonner` | `sonner.tsx` | Toast notifications |
| `Switch` | `switch.tsx` | Toggle switch |
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

#### FilterBar

Horizontal filter controls bar with quick filter pills.

```tsx
import { FilterBar } from "@/components/common/FilterBar";

<FilterBar
  activeFilters={activeQuickFilters}
  onToggleFilter={toggleQuickFilter}
  onClearAll={clearAll}
/>
```

#### FilterSidebar

Sidebar panel for advanced filtering options.

```tsx
import { FilterSidebar } from "@/components/common/FilterSidebar";

<FilterSidebar
  filters={filters}
  onFiltersChange={setFilters}
  categoryOptions={RECIPE_CATEGORIES}
  mealTypeOptions={MEAL_TYPES}
/>
```

#### RecipeIcon

Displays recipe category icon (emoji or Lucide icon).

```tsx
import { RecipeIcon } from "@/components/common/RecipeIcon";

<RecipeIcon
  icon={{ type: "emoji", value: "🍗" }}
  size="md"
/>
```

#### ScrollableCardList

Horizontally scrollable container for cards.

```tsx
import { ScrollableCardList } from "@/components/common/ScrollableCardList";

<ScrollableCardList>
  {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
</ScrollableCardList>
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

#### FeedbackDialog

User feedback submission dialog that creates GitHub issues.

```tsx
import { FeedbackDialog } from "@/components/common/FeedbackDialog";

<FeedbackDialog
  open={feedbackOpen}
  onOpenChange={setFeedbackOpen}
/>
```

#### ChangelogDialog

Displays application changelog/release notes.

```tsx
import { ChangelogDialog } from "@/components/common/ChangelogDialog";

<ChangelogDialog
  open={changelogOpen}
  onOpenChange={setChangelogOpen}
/>
```

### Form Components (`/components/forms/`)

Specialized form inputs and components.

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

### Recipe Components (`/components/recipe/`)

Recipe-specific display components.

#### RecipeCard

Unified recipe card component supporting multiple sizes.

```tsx
import { RecipeCard } from "@/components/recipe/RecipeCard";

// Standard grid card
<RecipeCard recipe={recipe} />

// With click handler
<RecipeCard
  recipe={recipe}
  onClick={() => router.push(`/recipes/${recipe.id}`)}
  onFavoriteToggle={() => handleToggle(recipe.id)}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `recipe` | `RecipeCardData` | required | Recipe data |
| `onClick` | `() => void` | - | Click handler |
| `onFavoriteToggle` | `() => void` | - | Favorite toggle handler |

#### RecipeBadge

Category, meal type, and dietary preference badges.

```tsx
import { RecipeBadge } from "@/components/recipe/RecipeBadge";

<RecipeBadge type="category" value="chicken" />
<RecipeBadge type="mealType" value="dinner" size="sm" />
<RecipeBadge type="dietary" value="vegetarian" />
```

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

#### RecipeBannerImage

Hero banner image for recipe detail pages.

```tsx
import { RecipeBannerImage } from "@/components/recipe/RecipeBannerImage";

<RecipeBannerImage
  src={recipe.bannerImagePath}
  fallbackSrc={recipe.referenceImagePath}
  alt={recipe.name}
/>
```

#### RecipeSelectCard

Selectable recipe card for meal planning dialogs.

```tsx
import { RecipeSelectCard } from "@/components/recipe/RecipeSelectCard";

<RecipeSelectCard
  recipe={recipe}
  isSelected={selectedId === recipe.id}
  onSelect={() => setSelectedId(recipe.id)}
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

#### ConditionalAppLayout

Conditionally applies layout based on route (for isolated pages).

```tsx
import { ConditionalAppLayout } from "@/components/layout/ConditionalAppLayout";

<ConditionalAppLayout>{children}</ConditionalAppLayout>
```

#### Sidebar

Main navigation sidebar with nav items.

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

#### MobileBottomNav

Bottom navigation bar for mobile devices.

```tsx
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

<MobileBottomNav />
```

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

#### PageLayout

Standardized page wrapper providing consistent structure.

```tsx
import { PageLayout } from "@/components/layout/PageLayout";

<PageLayout
  title="Shopping List"
  description="Auto-generated from your meal plan"
  actions={<Button>Add Item</Button>}
>
  {content}
</PageLayout>
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

#### RecentRecipeChip

Chip displaying a recently viewed recipe.

```tsx
import { RecentRecipeChip } from "@/components/layout/RecentRecipeChip";

<RecentRecipeChip
  recipe={recentRecipe}
  onClick={() => router.push(`/recipes/${recentRecipe.id}`)}
/>
```

### Meal Genie Components (`/components/meal-genie/`)

AI assistant chat interface components.

#### AskMealGenieWidget

Main AI chat widget with conversation history.

```tsx
import { AskMealGenieWidget } from "@/components/meal-genie";

<AskMealGenieWidget />
```

**Features:**
- Persistent chat history (localStorage)
- Markdown rendering for AI responses
- Suggested prompts for empty state
- Loading indicators with animations
- Clear history button
- Auto-scroll to latest messages

### Settings Components (`/components/settings/`)

Settings page section components.

#### DataManagementSection

Import/export and backup/restore functionality.

```tsx
import { DataManagementSection } from "@/components/settings/DataManagementSection";

<DataManagementSection />
```

**Features:**
- Export recipes to Excel
- Import recipes from Excel with duplicate handling
- Full backup (JSON with all data + settings)
- Restore from backup with preview
- Clear all data with confirmation

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

// Get all meals
const meals = await plannerApi.getMeals();

// Get saved meals only
const savedMeals = await plannerApi.getMeals({ saved: true });

// Get planner summary
const summary = await plannerApi.getSummary();

// Create a new meal
const meal = await plannerApi.createMeal({
  meal_name: "Taco Tuesday",
  main_recipe_id: 1,
  side_recipe_ids: [2, 3],
});

// Update meal
const updated = await plannerApi.updateMeal(id, data);

// Delete meal
await plannerApi.deleteMeal(id);

// Toggle saved status
await plannerApi.toggleSave(id);

// Add side to meal
await plannerApi.addSideToMeal(mealId, recipeId);

// --- Planner Entry Methods (Weekly Menu) ---

// Get all planner entries with hydrated meal data
const entries = await plannerApi.getEntries();

// Add meal to planner
const entry = await plannerApi.addToPlanner(mealId);

// Remove entry from planner
await plannerApi.removeEntry(entryId);

// Mark entry as complete (records cooking history)
await plannerApi.markComplete(entryId);

// Mark entry as incomplete
await plannerApi.markIncomplete(entryId);

// Cycle shopping mode: all → produce_only → none → all
await plannerApi.cycleShoppingMode(entryId);

// Clear completed entries
await plannerApi.clearCompleted();

// Reorder entries (drag and drop)
await plannerApi.reorderEntries([entryId1, entryId2, entryId3]);

// Get cooking streak
const streak = await plannerApi.getStreak();
```

### Shopping API

```typescript
import { shoppingApi } from "@/lib/api";

// Get shopping list
const list = await shoppingApi.getList();

// Get with auto-generation from planner
const list = await shoppingApi.getList(filters, true);

// Get single item
const item = await shoppingApi.getItem(id);

// Add manual item
const newItem = await shoppingApi.addItem(itemData);

// Update item
const updated = await shoppingApi.updateItem(id, itemData);

// Toggle item "have" status
await shoppingApi.toggleItem(id);

// Toggle item flagged status
await shoppingApi.toggleFlagged(id);

// Delete item
await shoppingApi.deleteItem(id);

// Generate from specific recipes
await shoppingApi.generate({ recipe_ids: [1, 2, 3] });

// Generate from active planner entries
await shoppingApi.generateFromPlanner();

// Clear operations
await shoppingApi.clear();           // Clear all
await shoppingApi.clearManual();     // Clear manual items
await shoppingApi.clearCompleted();  // Clear checked items

// Bulk update
await shoppingApi.bulkUpdate({ 1: true, 2: false });

// Get ingredient breakdown (which recipes use which ingredients)
const breakdown = await shoppingApi.getBreakdown(recipeIds);
```

### Ingredient API

```typescript
import { ingredientApi } from "@/lib/api";

// List/search ingredients
const ingredients = await ingredientApi.list({ search_term: "chicken" });

// Get categories
const categories = await ingredientApi.getCategories();

// Get ingredient names (for autocomplete)
const names = await ingredientApi.getNames();

// Get single ingredient
const ingredient = await ingredientApi.get(id);

// Create ingredient
const newIngredient = await ingredientApi.create(ingredientData);

// Search ingredients
const results = await ingredientApi.search({ search_term: "onion" });
```

### Upload API

```typescript
import { uploadApi } from "@/lib/api";

// Upload recipe image (file)
const result = await uploadApi.uploadRecipeImage(file, recipeId, "reference");

// Upload banner image
const banner = await uploadApi.uploadRecipeImage(file, recipeId, "banner");

// Upload base64 image (for AI-generated images)
const result = await uploadApi.uploadBase64Image(base64Data, recipeId, "reference");
```

### Image Generation API

```typescript
import { imageGenerationApi } from "@/lib/api";

// Generate AI image for recipe
const response = await imageGenerationApi.generate("Chicken Parmesan");

if (response.success && response.reference_image_data) {
  const imageSrc = `data:image/png;base64,${response.reference_image_data}`;
}

// Generate banner from reference image
const banner = await imageGenerationApi.generateBanner(
  "Chicken Parmesan",
  base64ReferenceImage
);
```

### Cooking Tip API

```typescript
import { cookingTipApi } from "@/lib/api";

// Get random AI cooking tip
const tip = await cookingTipApi.getTip();
```

### Meal Suggestions API

```typescript
import { mealSuggestionsApi } from "@/lib/api";

// Get AI side dish suggestions for a meal
const suggestions = await mealSuggestionsApi.getSuggestions({
  main_recipe_name: "Grilled Chicken",
  main_recipe_category: "chicken",
  meal_type: "dinner",
});
```

### Meal Genie API

```typescript
import { mealGenieApi } from "@/lib/api";

// Send chat message (AI determines response type)
const response = await mealGenieApi.chat(
  "What can I make with chicken and rice?",
  conversationHistory
);

if (response.success && response.response) {
  // Text response
  console.log(response.response);

  // Optional: AI may include a generated recipe
  if (response.recipe) {
    console.log("Generated recipe:", response.recipe);
  }
}
```

### Dashboard API

```typescript
import { dashboardApi } from "@/lib/api";

// Get dashboard stats
const stats = await dashboardApi.getStats();
// { total_recipes, favorites, meals_planned, shopping_items }
```

### Data Management API

```typescript
import { dataManagementApi } from "@/lib/api";

// Preview Excel import
const preview = await dataManagementApi.previewImport(file);

// Execute import with duplicate resolutions
const result = await dataManagementApi.executeImport(file, resolutions);

// Export recipes to Excel
const blob = await dataManagementApi.exportRecipes(filters);

// Download import template
const templateBlob = await dataManagementApi.downloadTemplate();

// Full backup (all data)
const backup = await dataManagementApi.exportFullBackup();

// Preview restore
const preview = await dataManagementApi.previewRestore(file);

// Execute restore
const result = await dataManagementApi.executeRestore(file, clearExisting);

// Clear all data
await dataManagementApi.clearAllData();
```

### Unit Conversion API

```typescript
import { unitConversionApi } from "@/lib/api";

// List all rules
const rules = await unitConversionApi.list();

// Get single rule
const rule = await unitConversionApi.get(id);

// Create rule
const newRule = await unitConversionApi.create({
  ingredient_name: "butter",
  from_unit: "cup",
  to_unit: "stick",
  factor: 2,
  round_up: true,
});

// Delete rule
await unitConversionApi.delete(id);
```

### Feedback API

```typescript
import { feedbackApi } from "@/lib/api";

// Submit user feedback (creates GitHub issue)
const response = await feedbackApi.submit({
  category: "Feature Request",
  message: "I would love a dark mode toggle...",
  metadata: { page: "/settings" },
});
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
  is_favorite: boolean;
  reference_image_path: string | null;
  banner_image_path: string | null;
  servings: number | null;
  total_time: number | null;
  recipe_category?: string | null;
  meal_type?: string | null;
  diet_pref?: string | null;
  times_cooked?: number | null;
  last_cooked?: string | null;
  created_at?: string | null;
}

// Full recipe response
interface RecipeResponseDTO extends RecipeBaseDTO {
  id: number;
  is_favorite: boolean;
  created_at: string | null;
  ingredients: RecipeIngredientResponseDTO[];
}

// Frontend-mapped format for components
interface RecipeCardData {
  id: string | number;
  name: string;
  servings: number;
  totalTime: number;
  imageUrl?: string;
  category?: string;
  mealType?: string;
  dietaryPreference?: string;
  isFavorite?: boolean;
  ingredients?: RecipeIngredient[];
  createdAt?: string;
}
```

### Meal Planning Types

```typescript
// Meal with recipes
interface MealSelectionResponseDTO {
  id: number;
  meal_name: string;
  main_recipe_id: number;
  side_recipe_ids: number[];
  is_saved: boolean;
  tags: string[];
  created_at: string | null;
  main_recipe: RecipeCardDTO | null;
  side_recipes: RecipeCardDTO[];
  total_cook_time: number | null;
  avg_servings: number | null;
  times_cooked: number | null;
  last_cooked: string | null;
}

// Planner entry (meal in weekly menu)
interface PlannerEntryResponseDTO {
  id: number;
  meal_id: number;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  scheduled_date: string | null;
  shopping_mode?: ShoppingMode; // "all" | "produce_only" | "none"
  meal_name: string | null;
  meal_is_saved?: boolean;
  main_recipe_id: number | null;
  side_recipe_ids: number[];
  main_recipe: RecipeCardDTO | null;
}

// Cooking streak
interface CookingStreakDTO {
  current_streak: number;
  longest_streak: number;
  week_activity: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  last_cooked_date: string | null;
  today_index: number; // 0=Monday, 6=Sunday
}
```

### Shopping List Types

```typescript
type ShoppingSource = "recipe" | "manual";
type ShoppingMode = "all" | "produce_only" | "none";

interface ShoppingItemResponseDTO {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  source: ShoppingSource;
  have: boolean;
  flagged: boolean;
  state_key: string | null;
  recipe_sources: string[]; // Recipe names using this ingredient
}

interface ShoppingListResponseDTO {
  items: ShoppingItemResponseDTO[];
  total_items: number;
  checked_items: number;
  recipe_items: number;
  manual_items: number;
  categories: string[];
}
```

### Meal Genie Types

```typescript
interface MealGenieMessage {
  role: "user" | "assistant";
  content: string;
}

interface MealGenieResponseDTO {
  success: boolean;
  response?: string;
  error?: string;
  recipe?: GeneratedRecipeDTO;
  reference_image_data?: string;
  banner_image_data?: string;
}

interface GeneratedRecipeDTO {
  recipe_name: string;
  recipe_category: string;
  meal_type: string;
  diet_pref?: string;
  total_time?: number;
  servings?: number;
  directions?: string;
  notes?: string;
  ingredients: GeneratedIngredientDTO[];
}
```

### Dashboard Types

```typescript
interface DashboardStatsDTO {
  total_recipes: number;
  favorites: number;
  meals_planned: number;
  shopping_items: number;
}
```

### Backup/Restore Types

```typescript
interface FullBackup {
  version: string;
  created_at: string;
  app_name: string;
  settings: Record<string, unknown> | null;
  data: BackupData;
}

interface RestorePreview {
  backup_version: string;
  backup_created_at: string;
  counts: Record<string, number>;
  has_settings: boolean;
  warnings: string[];
}

interface RestoreResult {
  success: boolean;
  restored_counts: Record<string, number>;
  errors: string[];
  settings: Record<string, unknown> | null;
}
```

---

## Custom Hooks

### useRecipeFilters

Comprehensive recipe filtering with quick filter synchronization.

```typescript
import { useRecipeFilters } from "@/hooks";

function RecipeBrowser() {
  const {
    filters,
    activeQuickFilters,
    hasActiveFilters,
    activeFiltersList,
    setSearchTerm,
    toggleCategory,
    toggleMealType,
    toggleDietary,
    toggleFavorites,
    setMaxCookTime,
    setNewDays,
    toggleQuickFilter,
    removeActiveFilter,
    clearAll,
    applyTo,
  } = useRecipeFilters({
    onFiltersChange: (filters) => console.log("Filters changed:", filters),
  });

  // Apply filters to recipes
  const filteredRecipes = applyTo(recipes);

  return (
    <>
      <FilterBar
        activeFilters={activeQuickFilters}
        onToggleFilter={toggleQuickFilter}
      />
      {/* ... */}
    </>
  );
}
```

### useChatHistory

Persistent chat history for Meal Genie with localStorage sync.

```typescript
import { useChatHistory } from "@/hooks";

function ChatWidget() {
  const { messages, isLoaded, addMessage, clearHistory } = useChatHistory();

  const handleSend = async (text: string) => {
    addMessage({ role: "user", content: text });
    const response = await mealGenieApi.chat(text, messages);
    addMessage({ role: "assistant", content: response.response });
  };

  return (/* ... */);
}
```

### useRecentRecipes

Track recently viewed recipes with localStorage persistence.

```typescript
import { useRecentRecipes } from "@/hooks";

function RecipeDetail({ recipe }) {
  const { recentRecipes, addToRecent } = useRecentRecipes();

  useEffect(() => {
    addToRecent({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
    });
  }, [recipe.id]);

  return (/* ... */);
}
```

### useSortableDnd

Pre-configured dnd-kit sensors and modifiers for vertical lists.

```typescript
import { useSortableDnd } from "@/hooks";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

function SortableList({ items }) {
  const { sensors, modifiers } = useSortableDnd();

  return (
    <DndContext
      sensors={sensors}
      modifiers={modifiers}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {/* Sortable items */}
      </SortableContext>
    </DndContext>
  );
}
```

### useUnsavedChanges

Prevents navigation when forms have unsaved changes.

```typescript
import { useUnsavedChanges } from "@/hooks";

function RecipeForm() {
  const [isDirty, setIsDirty] = useState(false);

  const {
    showLeaveDialog,
    setShowLeaveDialog,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges("/recipes/add", isDirty);

  return (
    <>
      <form>{/* form fields */}</form>
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        {/* Confirmation dialog */}
      </AlertDialog>
    </>
  );
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
    saveSettings,
    resetSettings,
    hasUnsavedChanges,
    discardChanges,
  } = useSettings();

  if (!isLoaded) return <Loading />;

  return (
    <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
      <Input
        value={settings.profile.userName}
        onChange={(e) => updateSettings("profile", { userName: e.target.value })}
      />
      <Button type="submit" disabled={!hasUnsavedChanges}>
        Save Changes
      </Button>
    </form>
  );
}
```

### useIngredientAutocomplete

Autocomplete suggestions for ingredient inputs.

```typescript
import { useIngredientAutocomplete } from "@/hooks";

function IngredientInput() {
  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    selectedIndex,
    handleKeyDown,
    selectSuggestion,
  } = useIngredientAutocomplete({
    onSelect: (ingredient) => console.log("Selected:", ingredient),
  });

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {suggestions.map((item, i) => (
        <div
          key={item.id}
          className={i === selectedIndex ? "bg-accent" : ""}
          onClick={() => selectSuggestion(item)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### useUnitConversionRules

Manage unit conversion rules from settings.

```typescript
import { useUnitConversionRules } from "@/hooks";

function UnitConversionsSection() {
  const {
    rules,
    isLoading,
    error,
    addRule,
    deleteRule,
    refetch,
  } = useUnitConversionRules();

  return (/* ... */);
}
```

---

## Utility Functions

### Filter Utilities (`lib/filterUtils.ts`)

Recipe filtering logic with support for quick filters.

```typescript
import {
  applyFilters,
  hasActiveFilters,
  getActiveFiltersList,
  removeFilter,
  quickFiltersToRecipeFilters,
  DEFAULT_FILTERS,
} from "@/lib/filterUtils";

// Apply filters to recipe array
const filtered = applyFilters(recipes, filters);

// Check if any filters are active
if (hasActiveFilters(filters)) {
  // Show clear button
}

// Get list of active filters for display
const activeList = getActiveFiltersList(filters, filterOptions);
```

### Image Utilities (`lib/imageUtils.ts`)

```typescript
import {
  getRecipeImageUrl,
  getRecipeImageUrlWithFallback,
  generateRecipeImagePath,
  generateRecipeBannerPath,
} from "@/lib/imageUtils";

// Get URL or undefined for invalid paths
const url = getRecipeImageUrl("/images/recipes/1.jpg");

// Get URL with fallback placeholder
const urlWithFallback = getRecipeImageUrlWithFallback(recipe.imageUrl);
```

### Quantity Utilities (`lib/quantityUtils.ts`)

```typescript
import { parseQuantity, formatQuantity, formatDuration } from "@/lib/quantityUtils";

// Parse various formats to number
parseQuantity("1.5");      // → 1.5
parseQuantity("1/2");      // → 0.5
parseQuantity("1 1/2");    // → 1.5

// Format number as user-friendly string
formatQuantity(1.5);       // → "1 1/2"
formatQuantity(0.333);     // → "1/3"

// Format duration in minutes
formatDuration(30);        // → "30 min"
formatDuration(90);        // → "1h 30m"
```

### Recipe Icon Utilities (`lib/recipeIcon.ts`)

```typescript
import { getRecipeIcon } from "@/lib/recipeIcon";

// Get icon for recipe based on name/category
const icon = getRecipeIcon("Chicken Parmesan", "chicken");
// Returns: { type: "emoji", value: "🍗" } or { type: "lucide", value: "utensils" }
```

### General Utilities (`lib/utils.ts`)

```typescript
import { cn } from "@/lib/utils";

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
  MEAL_TYPE_OPTIONS,
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_OPTIONS,
  DIETARY_PREFERENCES,
  INGREDIENT_UNITS,
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_ORDER,
  QUICK_FILTERS,
  DEFAULT_QUICK_FILTER_IDS,
} from "@/lib/constants";

// Use in select dropdowns
<Select>
  {MEAL_TYPE_OPTIONS.map(type => (
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
| `MEAL_TYPES` | all, appetizer, breakfast, lunch, dinner, dessert, side, snack, sauce, other |
| `RECIPE_CATEGORIES` | all, beef, chicken, pork, seafood, vegetarian, other |
| `DIETARY_PREFERENCES` | none, vegan, gluten-free, dairy-free, keto, paleo, low-carb, diabetic |
| `INGREDIENT_UNITS` | tbs, tsp, cup, oz, lbs, stick, bag, box, can, jar, package, piece, slice, whole, pinch, dash, to-taste |
| `INGREDIENT_CATEGORIES` | produce, dairy, deli, meat, condiments, oils-and-vinegars, seafood, pantry, spices, frozen, bakery, baking, beverages, other |
| `QUICK_FILTERS` | breakfast, lunch, dinner, dessert, sides, sauce, under30, vegetarian, favorites, new |

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
npx shadcn@latest add card dialog
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## State Management

The application uses a hybrid approach to state management:

### Server State (React Query)

Used for all API data fetching and caching.

```typescript
import { QueryProvider } from "@/lib/providers/QueryProvider";

// Wrap app in QueryProvider (in layout.tsx)
<QueryProvider>{children}</QueryProvider>
```

### Local Component State

```typescript
const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

### Persisted State (localStorage)

User preferences and session data stored via custom hooks:

- `useSettings` - Application settings
- `useChatHistory` - Meal Genie chat messages
- `useRecentRecipes` - Recently viewed recipes

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

### Pattern: Field-Level Validation

```typescript
import { validateRecipeName, validateQuantity } from "@/lib/formValidation";

function RecipeForm() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    const result = validateRecipeName(value);
    setNameError(result.isValid ? null : result.error);
  };

  return (
    <Input
      value={name}
      onChange={(e) => handleNameChange(e.target.value)}
      className={nameError ? "border-destructive" : ""}
    />
  );
}
```

---

## Styling & Theming

### CSS Variables

Defined in `globals.css` with light and dark theme support:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
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
3. Add `_components/` directory for page-specific components
4. Export default component

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

1. Determine component category (ui, common, forms, recipe, layout, meal-genie, settings)
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
      body: JSON.stringify(data),
    });
  },
};
```

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
| Add meal genie component | `src/components/meal-genie/` |
| Add settings component | `src/components/settings/` |
| Add API method | `src/lib/api.ts` |
| Add TypeScript type | `src/types/index.ts` |
| Add custom hook | `src/hooks/` |
| Add utility function | `src/lib/` |
| Add constant/dropdown | `src/lib/constants.ts` |
| Add filter logic | `src/lib/filterUtils.ts` |
| Modify global styles | `src/app/globals.css` |
| Configure TypeScript | `tsconfig.json` |
| Configure shadcn/ui | `components.json` |
