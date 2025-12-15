# Recipe Image Handling Guide

This document explains how recipe images are stored and served in Meal Genie.

## Overview

Recipe images are stored in the `frontend/public/images/recipes/` directory and served 
statically by Next.js. The database stores relative paths (e.g., `/images/recipes/1.jpg`),
which the browser loads directly from the public folder.

## Directory Structure

```
frontend/
├── public/
│   └── images/
│       └── recipes/
│           ├── placeholder.svg    # Default placeholder for missing images
│           ├── 1.jpg              # Recipe ID 1 image
│           ├── 1-banner.jpg       # Recipe ID 1 banner (optional)
│           ├── 2.jpg              # Recipe ID 2 image
│           └── ...
```

## Image Path Format

### Reference Images (Card/Thumbnail)
- **Path format:** `/images/recipes/{id}.{ext}`
- **Example:** `/images/recipes/42.jpg`
- **Usage:** Recipe cards, lists, search results

### Banner Images (Detail Page Hero)
- **Path format:** `/images/recipes/{id}-banner.{ext}`
- **Example:** `/images/recipes/42-banner.jpg`
- **Usage:** Recipe detail page hero section (larger format)

## Database Storage

When saving recipes, store the relative path in the database:

```python
# Backend (Python)
recipe.reference_image_path = "/images/recipes/42.jpg"
recipe.banner_image_path = "/images/recipes/42-banner.jpg"
```

## Frontend Utilities

### imageUtils.ts

The `lib/imageUtils.ts` module provides functions for working with image paths:

```typescript
import { 
  getRecipeImageUrl, 
  getRecipeImageUrlWithFallback,
  generateRecipeImagePath 
} from "@/lib/imageUtils";

// Transform database path to valid URL (or undefined for invalid paths)
const imageUrl = getRecipeImageUrl(recipe.reference_image_path);
// Returns: "/images/recipes/42.jpg" or undefined

// Always get a URL (falls back to placeholder)
const imageUrl = getRecipeImageUrlWithFallback(recipe.reference_image_path);
// Returns: "/images/recipes/42.jpg" or "/images/recipes/placeholder.svg"

// Generate path for new recipe
const newPath = generateRecipeImagePath(42, "jpg");
// Returns: "/images/recipes/42.jpg"
```

### recipeCardMapper.ts

The recipe card mapper automatically handles image path transformation:

```typescript
import { mapRecipeForCard } from "@/lib/recipeCardMapper";

// Automatically transforms image paths
const cardData = mapRecipeForCard(recipeDTO);
// cardData.imageUrl will be valid or undefined
```

## Handling Legacy Paths

The old Python desktop app stored local filesystem paths like:
- `C:\Users\...\user_data\images\recipe.jpg`
- `/Users/.../meal-genie/images/recipe.jpg`

These paths are automatically detected and filtered out by `imageUtils.ts`, 
causing the RecipeCard to show the placeholder instead.

## Adding Images to Recipes

### Option 1: Manual (Development/Testing)

1. Add the image file to `frontend/public/images/recipes/`
2. Name it `{recipe_id}.jpg` (e.g., `1.jpg`)
3. Update the recipe's `reference_image_path` in the database

### Option 2: Upload Flow (Production)

When implementing image uploads:

1. Accept image upload in the Add/Edit Recipe form
2. Save the file to `frontend/public/images/recipes/`
3. Store the path in the database
4. Consider using the recipe ID as the filename for consistency

```typescript
// Example upload handler
async function handleImageUpload(file: File, recipeId: number) {
  const extension = file.name.split('.').pop() || 'jpg';
  const imagePath = generateRecipeImagePath(recipeId, extension);
  
  // Upload logic here...
  
  return imagePath; // Store this in the database
}
```

## Placeholder Image

A default placeholder (`placeholder.svg`) is provided for recipes without images.
The RecipeCard component automatically shows a chef hat icon when:

1. `imageUrl` is `undefined` or empty
2. The image fails to load (network error, missing file)

## Future: Cloud Storage Migration

When ready to deploy to a hosted domain, you can:

1. Move images to cloud storage (S3, Cloudinary, etc.)
2. Update paths to use full URLs: `https://cdn.example.com/recipes/42.jpg`
3. The `imageUtils.ts` module already handles full URLs correctly

No changes needed to the frontend components - just update the paths stored in the database.

## Recommended Image Sizes

| Type | Dimensions | Aspect Ratio | Format |
|------|------------|--------------|--------|
| Reference (Card) | 800x600 | 4:3 | jpg, webp |
| Banner (Hero) | 1600x900 | 16:9 | jpg, webp |

## Troubleshooting

### Image Not Showing

1. Check the browser console for 404 errors
2. Verify the file exists in `public/images/recipes/`
3. Check the path in the database matches the filename
4. Ensure the path starts with `/images/recipes/`

### Seeing Placeholder Instead of Image

1. The database path might be a local filesystem path (from old app)
2. Check the console for `[imageUtils] Skipping local filesystem path` messages
3. Update the recipe with a valid relative path

### Image Shows as Broken

1. The `imageUrl` is set but file doesn't exist
2. Consider adding `onError` handling to fall back to placeholder
