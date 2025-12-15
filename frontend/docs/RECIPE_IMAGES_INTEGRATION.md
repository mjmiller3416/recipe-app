# Recipe Image Handling - Integration Guide

## Files to Add

Copy these files to your project:

### 1. `frontend/src/lib/imageUtils.ts` (NEW)
Image path utilities for validation and transformation.

### 2. `frontend/src/components/RecipeImage.tsx` (NEW)
Image component with error handling and placeholder fallback.

### 3. `frontend/public/images/recipes/placeholder.svg` (NEW)
Default placeholder image.

### 4. `frontend/docs/RECIPE_IMAGES.md` (NEW - optional)
Documentation for future reference.

---

## Files to Update

### `frontend/src/lib/recipeCardMapper.ts`

Update the existing mapper to use the new image utilities:

```typescript
// Add this import at the top
import { getRecipeImageUrl } from "./imageUtils";

// Update mapRecipeForCard function - change this line:
imageUrl: dto.reference_image_path ?? undefined,

// To this:
imageUrl: getRecipeImageUrl(dto.reference_image_path),
```

---

### `frontend/src/components/RecipeCard.tsx`

The RecipeCard currently has three places where images are rendered (Small, Medium, Large variants).
For each, you have two options:

#### Option A: Use the new RecipeCardImage component (Recommended)

Replace the image rendering logic with the new component:

```tsx
// Add import at top
import { RecipeCardImage } from "./RecipeImage";

// Replace this pattern (appears 3 times for small/medium/large):
{recipe.imageUrl ? (
  <img
    src={recipe.imageUrl}
    alt={recipe.name}
    className="..."
  />
) : (
  <div className="...">
    <ChefHat className="..." />
  </div>
)}

// With this:
<RecipeCardImage
  src={recipe.imageUrl}
  alt={recipe.name}
  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
  iconSize="lg" // Use "sm" for small cards, "lg" for medium, "xl" for large
/>
```

#### Option B: Add onError inline (Minimal change)

If you prefer not to add a new component, add state and onError handling:

```tsx
// In each card variant function, add state:
const [imageError, setImageError] = useState(false);

// Then update the conditional:
{recipe.imageUrl && !imageError ? (
  <img
    src={recipe.imageUrl}
    alt={recipe.name}
    className="..."
    onError={() => setImageError(true)}
  />
) : (
  <div className="...">
    <ChefHat className="..." />
  </div>
)}
```

---

### `frontend/src/app/recipes/[id]/page.tsx`

Update the recipe detail page to handle banner image errors:

```tsx
// Add state near other useState calls
const [bannerError, setBannerError] = useState(false);

// Update the hero image section:
{recipe.banner_image_path && !bannerError ? (
  <img
    src={recipe.banner_image_path}
    alt={recipe.recipe_name}
    className="..."
    onError={() => setBannerError(true)}
  />
) : (
  // Existing placeholder/gradient fallback
)}
```

---

## Quick Test

After integrating:

1. Start the dev server: `npm run dev`
2. Go to Recipe Browser (`/recipes`)
3. All recipes with local filesystem paths should show the chef hat placeholder
4. Add a test image:
   - Save any image as `frontend/public/images/recipes/1.jpg`
   - Update recipe ID 1 in the database: `reference_image_path = '/images/recipes/1.jpg'`
   - Refresh - the image should appear

---

## Database Migration Notes

To fix existing recipes with local paths, you can either:

### Option 1: Clear image paths (Quick)
```sql
-- Set all image paths to null (will show placeholder)
UPDATE recipes SET reference_image_path = NULL, banner_image_path = NULL;
```

### Option 2: Migrate images (Thorough)
1. Copy images from old location to `frontend/public/images/recipes/`
2. Rename to match recipe IDs
3. Update database paths to new format

---

## Summary

| Before | After |
|--------|-------|
| Local paths (`C:\...`) passed to `<img>` | Filtered out, shows placeholder |
| No onError handling | Falls back to placeholder on load failure |
| No path validation | `imageUtils.ts` validates all paths |
| Inconsistent placeholder | Unified `RecipeImage` component |
