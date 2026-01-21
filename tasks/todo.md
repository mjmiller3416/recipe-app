# Build MealDialog Components

## Overview
Implement the three placeholder components based on the test page design. These will be used later when converting MealDialog to a full page layout.

## Tasks

- [x] **RecipeSelectCard** - Recipe card with selection state, checkmark overlay, favorite indicator, Main/Side badge
- [x] **MealPreviewPanel** - Right sidebar with main dish slot, side slots, stats summary, add button
- [x] **SavedMealCard** - Horizontal card with main dish image, meal name, sides preview, stats

## Notes
- Not integrating into MealDialog yet - user plans to convert to full page layout
- Follow existing design tokens from globals.css
- Reuse existing components (Card, Button, CircularImage, RecipeImage, etc.)
- Keep implementations simple and focused

## Review

### Changes Made

**1. RecipeSelectCard** (`frontend/src/components/recipe/RecipeSelectCard.tsx`)
- Vertical card with recipe image section (h-32) and content section
- Selection checkmark overlay (top-right, animated with `animate-scale-in`)
- Favorite heart indicator (top-left, red filled heart)
- Main/Side badge (bottom-left, uses Badge component with variant)
- Selected state: `ring-2 ring-primary shadow-glow-primary` + `animate-bounce-subtle`
- Hover zoom on image with gradient overlay
- Uses: Card, Badge, RecipeImage, Lucide icons

**2. MealPreviewPanel** (`frontend/src/app/meal-planner/_components/meal-dialog/components/MealPreviewPanel.tsx`)
- Full vertical sidebar layout with flex-col h-full
- Header with UtensilsCrossed icon and title/subtitle
- Main dish section:
  - Empty: dashed border with ChefHat and `animate-pulse-soft`
  - Filled: Card with `bg-primary-surface`, CircularImage, remove button
- Sides section:
  - Filled slots: Card with `bg-secondary-surface`, compact layout
  - Empty slots: dashed border with Plus icon placeholder
  - Counter showing (X/3)
- Stats summary: 2-column grid with Total Time and Avg Servings
- Action button: "Add to Meal Queue" with `animate-glow` when ready
- Uses: Card, Button, CircularImage, Lucide icons

**3. SavedMealCard** (`frontend/src/app/meal-planner/_components/meal-dialog/components/SavedMealCard.tsx`)
- Horizontal card layout (image left, content right)
- Main dish image (w-28 h-28) with hover zoom
- Content section with:
  - Meal name (truncate, hover color change)
  - Main recipe name (muted text)
  - Side dish emoji row using `getRecipeEmoji`
  - Stats row: times cooked, last cooked (relative time)
- Added local `formatRelativeTime` helper function
- Uses: Card, RecipeImage, getRecipeEmoji, Lucide icons

### Design Tokens Used
- Colors: `bg-primary-surface`, `bg-secondary-surface`, `border-primary-muted`, `border-secondary-muted`
- Animations: `animate-scale-in`, `animate-slide-up`, `animate-bounce-subtle`, `animate-pulse-soft`, `animate-glow`
- Shadows: `shadow-glow-primary`
- Typography: foreground, muted-foreground, muted-foreground/60

### Components Reused
- Card (with interactive prop)
- Button (with variants)
- Badge (default/secondary variants)
- CircularImage
- RecipeImage
- getRecipeEmoji utility
