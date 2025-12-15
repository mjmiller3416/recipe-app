# RecipeCard Component

The complete recipe card system with **three distinct sizes** perfectly tailored for different use cases.

---

## 📐 Size Overview

| Size | Layout | Best For | Key Features |
|------|--------|----------|--------------|
| **Small** | Horizontal | Meal Planner, Lists | Thumbnail, Basic info, Compact |
| **Medium** | Vertical | Recipe Browser | 4:3 image, Badges, Standard grid |
| **Large** | Split | Featured/Detail | Side-by-side, Full ingredients, Traditional card |

---

## 🎯 Size Details

### Small Card
**Use Case:** Meal planner, selection lists, sidebars

**Layout:**
- Horizontal (row)
- 64x64px thumbnail on left
- Name + metadata in middle
- Favorite button on right

**Features:**
- ✅ Compact single-row design
- ✅ Quick-scan friendly
- ✅ Minimal vertical space
- ✅ Perfect for mobile

**Grid:** Always single column

---

### Medium Card
**Use Case:** Recipe browser main grid

**Layout:**
- Vertical (column)
- 4:3 aspect ratio image on top
- Category + meal type badges
- Name below
- Servings + time at bottom

**Features:**
- ✅ Category badge (top left)
- ✅ Meal type badge (below category)
- ✅ Dietary preference support
- ✅ Favorite button (top right)
- ✅ Strong hover effects (lifts 8px)

**Grid:** 
- 1 column (mobile)
- 2 columns (md: 768px+)
- 3 columns (xl: 1280px+)

---

### Large Card 🆕
**Use Case:** Featured recipes, recipe detail view, traditional recipe card display

**Layout:**
- Side-by-side split
- **Left:** Square image (2/5 width on desktop)
- **Right:** All recipe details (3/5 width)
  - Name + all badges at top
  - Ingredients list (2 columns)
  - Servings + time at bottom

**Features:**
- ✅ **Full ingredients list** with quantity, unit, name
- ✅ **Two-column ingredient layout** for better readability
- ✅ **Overflow handling** - "... and X more ingredients"
- ✅ All three badge types (category, meal type, dietary)
- ✅ Traditional recipe card aesthetic
- ✅ Responsive: stacks vertically on mobile

**Grid:** Always single column (full width)

**Ingredients Display:**
- Default: Shows first 8 ingredients
- Configurable via `maxIngredientsDisplay` prop
- Remaining count shown if overflow
- Two-column grid on large screens

---

## 📋 Component API

### RecipeCard Props

```typescript
interface RecipeCardBaseProps {
  recipe: RecipeCardData;
  onClick?: (recipe: RecipeCardData) => void;
  onFavoriteToggle?: (recipe: RecipeCardData) => void;
  className?: string;
  size?: "small" | "medium" | "large";
  showCategory?: boolean;
  maxIngredientsDisplay?: number; // Large cards only, default: 8
}
```

### RecipeCardData Interface

```typescript
interface RecipeCardData {
  id: string | number;
  name: string;
  servings: number;
  totalTime: number; // in minutes
  imageUrl?: string;
  category?: string;
  mealType?: string;
  dietaryPreference?: string; // NEW - shown on large cards
  isFavorite?: boolean;
  ingredients?: RecipeIngredient[]; // NEW - for large cards
}

interface RecipeIngredient {
  id?: string | number;
  name: string;
  quantity: number;
  unit: string | null;
  category?: string;
}
```

---

## 🚀 Usage Examples

### Small Card (Meal Planner)
```tsx
// Compact list for recipe selection
<RecipeCardGrid size="small">
  {recipes.map((recipe) => (
    <RecipeCard
      key={recipe.id}
      recipe={recipe}
      size="small"
      onClick={handleSelectRecipe}
      onFavoriteToggle={handleFavorite}
    />
  ))}
</RecipeCardGrid>
```

### Medium Card (Recipe Browser)
```tsx
// Main grid for browsing
<RecipeCardGrid size="medium">
  {recipes.map((recipe) => (
    <RecipeCard
      key={recipe.id}
      recipe={recipe}
      size="medium"
      onClick={(r) => router.push(`/recipes/${r.id}`)}
      onFavoriteToggle={handleFavorite}
    />
  ))}
</RecipeCardGrid>
```

### Large Card (Featured/Detail)
```tsx
// Full recipe card with ingredients
<RecipeCardGrid size="large">
  {featuredRecipes.map((recipe) => (
    <RecipeCard
      key={recipe.id}
      recipe={recipe}
      size="large"
      onClick={handleRecipeClick}
      onFavoriteToggle={handleFavorite}
      maxIngredientsDisplay={10} // Show up to 10 ingredients
    />
  ))}
</RecipeCardGrid>
```

### Custom Ingredient Display Limit
```tsx
// Show only 6 ingredients, indicate if more
<RecipeCard
  recipe={recipe}
  size="large"
  maxIngredientsDisplay={6}
/>
```

---

## 🔄 Backend Integration

### Mapping Your DTOs

Your backend already has all the data needed!

```typescript
// utils/recipeMapper.ts
import { RecipeCardData, RecipeIngredient } from "@/components/RecipeCard";
import { RecipeResponseDTO, RecipeIngredientDTO } from "@/types";

export function mapRecipeToCardData(dto: RecipeResponseDTO): RecipeCardData {
  return {
    id: dto.id,
    name: dto.recipe_name,
    servings: dto.servings,
    totalTime: dto.total_time,
    imageUrl: dto.reference_image_path,
    category: dto.recipe_category,
    mealType: dto.meal_type,
    dietaryPreference: dto.diet_pref,
    isFavorite: dto.is_favorite,
    ingredients: dto.ingredients?.map(mapIngredient),
  };
}

function mapIngredient(dto: RecipeIngredientDTO): RecipeIngredient {
  return {
    id: dto.id,
    name: dto.ingredient_name,
    quantity: dto.quantity,
    unit: dto.unit,
    category: dto.ingredient_category,
  };
}
```

### API Integration Example

```tsx
// pages/recipes/index.tsx - Recipe Browser
"use client";

import { useState, useEffect } from "react";
import { RecipeCard, RecipeCardGrid } from "@/components/RecipeCard";

export default function RecipeBrowserPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const response = await fetch('/api/recipes');
    const data = await response.json();
    setRecipes(data.map(mapRecipeToCardData));
  };

  const handleFavoriteToggle = async (recipe: RecipeCardData) => {
    await fetch(`/api/recipes/${recipe.id}/favorite`, { method: 'POST' });
    
    // Optimistic update
    setRecipes(prev =>
      prev.map(r =>
        r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  };

  return (
    <div className="p-6">
      <h1>Browse Recipes</h1>
      <RecipeCardGrid size="medium">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            size="medium"
            onClick={(r) => router.push(`/recipes/${r.id}`)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ))}
      </RecipeCardGrid>
    </div>
  );
}
```

---

## 🎨 Visual Design Details

### Badges

**Category Badge:**
- Background: Primary color (#14b8a6)
- Position: Top left
- Shown on: Medium & Large cards

**Meal Type Badge:**
- Background: Secondary color (#8b5cf6)
- Position: Below category (Medium), Next to category (Large)
- Shown on: Medium & Large cards

**Dietary Preference Badge:**
- Background: Accent color (#3d3d3d)
- Position: After meal type
- Shown on: Large cards only

### Ingredient Display (Large Cards)

**Layout:**
- Two-column grid on large screens
- Single column on mobile
- Bullet points with primary color
- Quantity in bold, ingredient name in muted text

**Overflow Indicator:**
```
... and 4 more ingredients
```
- Italicized text
- Muted color
- Top border separator
- Shown when ingredients exceed `maxIngredientsDisplay`

### Hover Effects

**Small:**
- Subtle shadow
- Background lightens

**Medium:**
- Lifts 8px
- Strong shadow with primary tint
- Image scales 105%
- Gradient overlay

**Large:**
- Lifts 4px
- Enhanced shadow
- Image scales 105%
- Smooth transitions

---

## 📱 Responsive Behavior

### Small Cards
```css
Always single column on all screens
```

### Medium Cards
```css
Mobile (< 768px):   1 column
Tablet (768px+):    2 columns
Desktop (1280px+):  3 columns
```

### Large Cards
```css
Mobile (< 768px):   Stacked (image on top, details below)
Desktop (768px+):   Side-by-side (40% image, 60% details)
```

---

## ⚙️ Advanced Configuration

### Hide Category Badges
```tsx
<RecipeCard
  recipe={recipe}
  showCategory={false}
/>
```

### Custom Ingredient Limit
```tsx
// Show only first 5 ingredients
<RecipeCard
  recipe={recipe}
  size="large"
  maxIngredientsDisplay={5}
/>
```

### No Ingredients
Large cards gracefully handle recipes without ingredients:
```tsx
recipe.ingredients = undefined // or []
// Shows: "No ingredients listed"
```

---

## 🚀 Quick Start

### 1. Replace Component
```bash
cp RecipeCardFinal.tsx frontend/src/components/RecipeCard.tsx
```

### 2. Run Demo
```bash
mkdir -p frontend/src/app/recipe-demo
cp RecipeCardFinalDemo.tsx frontend/src/app/recipe-demo/page.tsx
cd frontend && npm run dev
```

### 3. Visit
```
http://localhost:3000/recipe-demo
```

---

## 📦 What Changed from Previous Version

### Removed
- ❌ Old "Medium" card (1:1 aspect ratio)

### Updated
- ✅ Old "Large" → Now "Medium" (for Recipe Browser)
- ✅ Renamed and optimized for main grid use

### Added
- ✅ **New Large card** - Traditional recipe card layout
- ✅ Ingredients display with overflow handling
- ✅ Dietary preference badge
- ✅ Side-by-side layout
- ✅ Two-column ingredient grid
- ✅ `maxIngredientsDisplay` prop

---

## 🎯 Perfect Use Cases

### Small Cards
- ✅ Meal planner recipe selection
- ✅ "Add to meal plan" modal
- ✅ Quick selection dropdowns
- ✅ Mobile-first compact lists
- ✅ Sidebar recent recipes

### Medium Cards
- ✅ **Recipe Browser main page** ← Primary use
- ✅ Search results
- ✅ Category filtered views
- ✅ Favorites page
- ✅ "Recommended for you" sections

### Large Cards
- ✅ Featured recipe showcase
- ✅ "Recipe of the week"
- ✅ Recipe detail preview
- ✅ Print-ready view
- ✅ Email newsletter format
- ✅ Social media sharing preview

---

## 💡 Pro Tips

1. **For Recipe Browser**: Always use `size="medium"` - it's optimized for grid layouts

2. **For Meal Planner**: Use `size="small"` for selection lists, shows more recipes in less space

3. **For Featured Content**: Use `size="large"` sparingly - it's visually heavy

4. **Ingredient Limits**: 
   - Default (8) works for most recipes
   - Use 6 for very dense layouts
   - Use 10-12 for featured/detail views

5. **Loading States**: Show skeleton/placeholder cards while fetching

6. **Error Handling**: Provide fallback if image fails to load (already handled)

---

## ✅ Migration Checklist

- [ ] Replace RecipeCard.tsx with RecipeCardFinal.tsx
- [ ] Update Recipe Browser to use `size="medium"`
- [ ] Update Meal Planner to use `size="small"`
- [ ] Add ingredients to your RecipeCardData type
- [ ] Map backend DTO ingredients to RecipeIngredient[]
- [ ] Test favorite toggle on all sizes
- [ ] Test responsive behavior on mobile
- [ ] Test ingredient overflow on large cards

---

## 🎉 You're All Set!

This final version gives you:
1. ✅ **Small** - Perfect for meal planning
2. ✅ **Medium** - Perfect for recipe browsing (your main use case)
3. ✅ **Large** - Traditional recipe card with full ingredients

All three sizes are production-ready, fully responsive, and match your dark theme perfectly. The large card even looks like a real recipe card! 🍳