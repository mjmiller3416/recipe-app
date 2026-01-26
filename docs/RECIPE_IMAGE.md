# Recipe Image System - Complete Documentation

This document provides a comprehensive overview of recipe image functionality in the application, covering AI generation, cloud storage, API endpoints, and frontend display.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Backend API](#backend-api)
   - [Image Generation](#image-generation-api)
   - [Image Upload](#image-upload-api)
4. [Cloud Storage (Cloudinary)](#cloud-storage-cloudinary)
   - [Caching Behavior](#caching-behavior)
5. [Type Definitions](#type-definitions)
6. [Frontend Display](#frontend-display)
   - [Component Overview](#component-overview)
   - [RecipeImage Component](#recipeimage-component)
   - [Loading State Behavior](#loading-state-behavior)
   - [Display Locations](#display-locations)
7. [Image Transformations](#image-transformations)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Configuration](#configuration)
10. [Known Issues](#known-issues)
11. [Implementation Notes](#implementation-notes)

---

## Overview

The recipe app uses a dual-image strategy for each recipe:

| Image Type | Aspect Ratio | Purpose |
|------------|--------------|---------|
| **Reference Image** | 1:1 (square) | Recipe cards, thumbnails, circular avatars |
| **Banner Image** | 21:9 (ultrawide) | Hero sections on detail pages |

Images can be:
- **AI-generated** using Google Gemini's image generation model
- **User-uploaded** via file picker

All images are stored on **Cloudinary CDN** with automatic optimization.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RECIPE IMAGE SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │   Gemini    │     │  Cloudinary │     │  PostgreSQL │           │
│  │   AI API    │     │     CDN     │     │   Database  │           │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘           │
│         │                   │                   │                   │
│         │ Generate          │ Store/Transform   │ URL Paths         │
│         ▼                   ▼                   ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    BACKEND (FastAPI)                         │   │
│  │  • /api/ai/image-generation  - Generate with Gemini         │   │
│  │  • /api/upload               - Upload to Cloudinary          │   │
│  │  • /api/upload/base64        - Upload base64 images          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              │ REST API                             │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (Next.js)                        │   │
│  │  • ImageUploadCard      - Upload/generate UI                 │   │
│  │  • RecipeImage          - Unified display component          │   │
│  │  • imageUtils.ts        - URL transformations                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| Backend | `app/ai/services/image_generation_service.py` | Core Gemini AI integration |
| Backend | `app/ai/config/image_generation_config.py` | Prompt templates & settings |
| Backend | `app/api/ai/image_generation.py` | REST endpoint for generation |
| Backend | `app/api/upload.py` | Cloudinary upload endpoints |
| Backend | `app/api/ai/meal_genie.py` | Recipe generation endpoint with image integration |
| Backend | `app/ai/services/meal_genie_service.py` | Orchestrates recipe + image generation |
| Backend | `app/services/recipe_service.py` | Database methods for updating image paths |
| Backend | `app/services/data_management_service.py` | Cloudinary cleanup on recipe deletion |
| Frontend | `ImageUploadCard.tsx` | UI for generation/upload |
| Frontend | `RecipeImage.tsx` | Unified display component |
| Frontend | `useRecipeForm.ts` | Form state management |
| Frontend | `imageUtils.ts` | URL processing & transformations |
| Frontend | `api.ts` | API client functions |
| Frontend | `recipeCardMapper.ts` | Maps DTO image paths to UI-ready URLs |

---

## Backend API

### Image Generation API

**Endpoint:** `POST /api/ai/image-generation`

Generates professional food photography using Google Gemini AI (`gemini-2.5-flash-image`).

#### Request
```json
{
  "recipe_name": "Spaghetti Carbonara",
  "custom_prompt": "Optional custom styling instructions"
}
```

#### Response
```json
{
  "success": true,
  "reference_image_data": "base64-encoded PNG (1:1 square)",
  "banner_image_data": "base64-encoded PNG (21:9 ultrawide)",
  "error": null
}
```

#### Service Methods

```python
# app/ai/services/image_generation_service.py

# Generate a single image with specific aspect ratio
generate_recipe_image(recipe_name, prompt_template, aspect_ratio)

# Generate both reference and banner images together
generate_dual_recipe_images(recipe_name, custom_prompt)
```

#### Default Prompt Template (Reference Images - 1:1)

> "A professional food photograph of {recipe_name} captured at a 45-degree angle. The dish is placed on a rustic wooden table with cutting board, shallow depth of field, steam rising, scattered herbs and seasonings, complementary ingredients as props in soft-focus background, cozy home kitchen atmosphere, appetizing, high detail, no people, no hands, square format"

#### Banner Prompt Template (21:9)

> "A professional food photograph of {recipe_name} in wide panoramic format. The dish is placed on a rustic wooden table with cutting board, shallow depth of field, steam rising, scattered herbs and seasonings, complementary ingredients arranged horizontally as props in soft-focus background, cozy home kitchen atmosphere, appetizing, high detail, no people, no hands, ultrawide cinematic composition"

---

### Image Upload API

#### File Upload
**Endpoint:** `POST /api/upload`

```python
@router.post("")
async def upload_recipe_image(
    file: UploadFile = File(...),
    recipeId: str = Form(...),
    imageType: str = Form(default="reference")  # "reference" or "banner"
)
```

#### Base64 Upload (for AI-generated images)
**Endpoint:** `POST /api/upload/base64`

```python
@router.post("/base64")
async def upload_base64_image(
    image_data: str = Form(...),
    recipeId: str = Form(...),
    imageType: str = Form(default="reference")
)
```

#### Delete Image
**Endpoint:** `DELETE /api/upload/{public_id}`

```python
@router.delete("/{public_id:path}")
async def delete_recipe_image(public_id: str)
```

---

### Recipe Generation with Images API

**Endpoint:** `POST /api/ai/meal-genie/generate-recipe`

Generates a complete recipe with optional AI images via the Meal Genie conversational interface.

#### Request
```json
{
  "message": "Create a pasta recipe with sun-dried tomatoes",
  "conversation_history": [],
  "generate_image": true
}
```

#### Response
```json
{
  "success": true,
  "recipe": {
    "recipe_name": "Sun-Dried Tomato Pasta",
    "recipe_category": "Pasta",
    "meal_type": "Dinner",
    "ingredients": [...]
  },
  "reference_image_data": "base64-encoded PNG (1:1 square)",
  "banner_image_data": "base64-encoded PNG (21:9 ultrawide)",
  "ai_message": "Here's a delicious pasta recipe...",
  "needs_more_info": false,
  "error": null
}
```

#### Service Integration
The endpoint orchestrates both recipe and image generation:
1. `MealGenieService` generates the recipe JSON
2. If `generate_image: true`, calls `ImageGenerationService.generate_dual_recipe_images()`
3. Image generation failures are graceful—recipe still returns with logged warning

---

## Cloud Storage (Cloudinary)

### Configuration

```python
# Backend: app/api/upload.py
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)
```

### Folder Structure

```
meal-genie/
└── recipes/
    └── {recipeId}/
        ├── reference_{recipeId}.jpg   # 1:1 square thumbnail
        └── banner_{recipeId}.jpg      # 21:9 ultrawide hero
```

### URL Format

```
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
```

Example:
```
https://res.cloudinary.com/dfbeydsmt/image/upload/v1234567890/meal-genie/recipes/123/reference_123.jpg
```

### Upload-Time Transformations

Applied automatically during upload:

```python
transformation=[
    {"quality": "auto:good"},    # Automatic quality optimization
    {"fetch_format": "auto"}     # Auto WebP/JPEG based on browser
]
```

### Database Schema

```python
# models/recipe.py
class Recipe(Base):
    reference_image_path: Mapped[Optional[str]]  # Cloudinary URL
    banner_image_path: Mapped[Optional[str]]     # Cloudinary URL
```

### Caching Behavior

Cloudinary uses a two-tier caching strategy:

| Cache Type | Location | TTL | Notes |
|------------|----------|-----|-------|
| **Origin Cache** | Cloudinary servers | Indefinite | Original uploads cached permanently |
| **CDN Edge Cache** | Global edge nodes | ~30 days | Transformed images cached after first request |

**First-Request Transformation Generation:**

When a transformed URL is requested for the first time (e.g., with `w_400,h_300,c_fill,g_auto`):

1. CDN edge receives request
2. Edge checks cache → miss
3. Request forwarded to Cloudinary origin
4. Origin generates transformation on-the-fly (~100-500ms)
5. Transformed image cached at edge
6. Subsequent requests served from edge cache (~20-50ms)

**Implications:**
- First user to view a newly uploaded recipe image experiences slight delay
- All subsequent users get cached response
- Different transformation parameters = different cached variants
- Cache invalidation available via Cloudinary dashboard or API

---

## Type Definitions

The following TypeScript interfaces are used for image-related API communication.

**Location:** `frontend/src/types/index.ts`

### Image Generation Types

```typescript
interface ImageGenerationRequestDTO {
  recipe_name: string;
}

interface ImageGenerationResponseDTO {
  success: boolean;
  reference_image_data?: string;  // Base64 encoded (1:1 square)
  banner_image_data?: string;     // Base64 encoded (21:9 ultrawide)
  error?: string;
}
```

### Recipe Generation Types (Meal Genie)

```typescript
interface RecipeGenerationRequestDTO {
  message: string;
  conversation_history?: MealGenieMessage[];
  generate_image?: boolean;
}

interface RecipeGenerationResponseDTO {
  success: boolean;
  recipe?: GeneratedRecipeDTO;
  reference_image_data?: string;  // Base64 encoded (1:1 square)
  banner_image_data?: string;     // Base64 encoded (21:9 ultrawide)
  ai_message?: string;
  needs_more_info: boolean;
  error?: string;
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

interface GeneratedIngredientDTO {
  ingredient_name: string;
  ingredient_category: string;
  quantity?: number;
  unit?: string;
}
```

### Recipe Base Types (Image Fields)

```typescript
interface RecipeBaseDTO {
  recipe_name: string;
  recipe_category: string;
  meal_type: string;
  diet_pref: string | null;
  total_time: number | null;
  servings: number | null;
  directions: string | null;
  notes: string | null;
  reference_image_path: string | null;  // Cloudinary URL
  banner_image_path: string | null;     // Cloudinary URL
}
```

---

## Frontend Display

### Component Overview

The app uses **RecipeImage.tsx** as the unified image component providing:

- **Error handling** - Shows ChefHat placeholder when images fail to load (404, network errors)
- **Empty state** - Graceful fallback when `src` is null/undefined
- **Loading animation** - Optional fade-in transition with animated placeholder
- **Single component** - `RecipeImage` handles all recipe image display with configurable options

### RecipeImage Component

**Location:** `frontend/src/components/recipe/RecipeImage.tsx`

```tsx
interface RecipeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconClassName?: string;  // Custom icon class to override default sizing
  fill?: boolean;
  showLoadingState?: boolean;  // default: true
}
```

#### Icon Sizes
| Size | CSS Classes |
|------|-------------|
| sm | `h-6 w-6` |
| md | `h-12 w-12` |
| lg | `h-24 w-24` |
| xl | `h-32 w-32` |

#### CircularImage Sizes

`CircularImage` wraps `RecipeImage` and uses smaller icon sizes for its compact circular containers:

| Size | Container | Icon (placeholder) |
|------|-----------|-------------------|
| sm | `w-10 h-10` | `h-4 w-4` |
| md | `w-14 h-14` | `h-6 w-6` |
| lg | `w-16 h-16` | `h-8 w-8` |
| xl | `w-20 h-20` | `h-10 w-10` |

The smaller icons are passed via the `iconClassName` prop to override RecipeImage's default sizing.

#### Loading State Behavior

The `showLoadingState` prop controls animated loading transitions:

| Value | Behavior | Use Case |
|-------|----------|----------|
| `true` (default) | Shows animated ChefHat placeholder while loading, then fades in image over 300ms | Single images, hero banners, detail pages |
| `false` | No animation, instant render | Lists/grids with many images (reduced render overhead) |

**Implementation Details:**
- When `showLoadingState=true`:
  1. `ImagePlaceholder` renders with `animate-pulse` on the ChefHat icon
  2. Image loads in background with `opacity-0`
  3. On `onLoad`, image transitions to `opacity-100` over 300ms
  4. Placeholder unmounts when `isLoaded` becomes true
- When `showLoadingState=false`:
  - Image renders immediately without wrapper
  - `onError` still triggers placeholder fallback

**Note:** `RecipeHeroImage` is a component in `frontend/src/app/recipes/[id]/_components/detail/` that wraps `RecipeImage` with hero-specific styling (fixed height, gradient overlay, Cloudinary smart cropping). `FullRecipeView` (located at `frontend/src/app/recipes/[id]/_components/FullRecipeView.tsx`) is its only consumer.

### Display Locations

| Component | File Location | Aspect Ratio | CSS/Tailwind |
|-----------|---------------|--------------|--------------|
| RecipeCard (Small) | `RecipeCard` with `size="small"` | 1:1 (square) | `w-16 h-16` |
| RecipeCard (Medium) | `RecipeCard` with `size="medium"` | 4:3 | `aspect-[4/3]` |
| RecipeCard (Large) | `RecipeCard` with `size="large"` | 1:1 mobile / auto desktop | `aspect-square md:aspect-auto` |
| ImageUploadCard | `ImageUploadCard` component | 1:1 (square) | `aspect-square` |
| CircularImage | `CircularImage` component | 1:1 (circle) | `rounded-full` + fixed sizes (wraps RecipeImage) |
| MealSlot | `MealSlot` component | 1:1 (circular) | Uses CircularImage xl |
| MealQueueItem | `MealQueueItem` component | 1:1 (square) | `w-12 h-12` (uses RecipeImage fill) |
| MealGridCard | `MealGridCard` component | ~16:9 | `w-full h-28` |
| RecipeRouletteWidget | `RecipeRouletteWidget` component | ~16:9 | `flex-1 min-h-24` |
| RecipeHeroImage | `RecipeHeroImage` component | Fixed height | `h-[300px] md:h-[400px]` |
| FullRecipeView | `FullRecipeView` → uses `RecipeHeroImage` | Uses RecipeHeroImage | (inherits hero sizing) |
| SelectedMealCard | `SelectedMealCard` component | Responsive | `w-full lg:w-64 h-48` |
| RecipePrintLayout | `RecipePrintLayout` component | Flexible | `max-h-48` |
| SavedView | `SavedView` component | 1:1 (circular) | Uses CircularImage lg |
| CompletedDropdown | `CompletedDropdown` component | 1:1 (square) | `w-10 h-10` grayscale opacity-60 |

**File Locations Reference:**
- `RecipeCard`: `components/recipe/RecipeCard.tsx`
- `ImageUploadCard`: `app/recipes/_components/add-edit/ImageUploadCard.tsx`
- `CircularImage`: `components/common/CircularImage.tsx`
- `MealSlot`: `app/meal-planner/_components/meal-dialog/components/MealSlot.tsx`
- `MealQueueItem`: `app/dashboard/_components/MealQueueItem.tsx`
- `MealGridCard`: `app/meal-planner/_components/MealGridCard.tsx`
- `RecipeRouletteWidget`: `app/dashboard/_components/RecipeRouletteWidget.tsx`
- `RecipeHeroImage`: `app/recipes/[id]/_components/detail/RecipeHeroImage.tsx`
- `FullRecipeView`: `app/recipes/[id]/_components/FullRecipeView.tsx`
- `SelectedMealCard`: `app/meal-planner/_components/meal-display/SelectedMealCard.tsx`
- `RecipePrintLayout`: `app/recipes/[id]/_components/print/RecipePrintLayout.tsx`
- `SavedView`: `app/meal-planner/_components/meal-dialog/views/SavedView.tsx`
- `CompletedDropdown`: `app/meal-planner/_components/CompletedDropdown.tsx`

### Component RecipeImage Usage

| Usage | Components | Count |
|-------|-----------|-------|
| Uses RecipeImage | RecipeCard, MealGridCard, SelectedMealCard, FullRecipeView, CompletedDropdown, MealQueueItem, CircularImage | 7 |
| Uses native `<img>` | RecipeRouletteWidget | 1 |
| Not applicable | ImageUploadCard (upload UI), RecipePrintLayout (print-only) | 2 |

---

## Image Transformations

### URL Utility Functions

**Location:** `frontend/src/lib/imageUtils.ts`

#### URL Validation

```typescript
// Detect Cloudinary URLs
function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

// Validate web-accessible paths
function isValidWebPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.startsWith("/") ||
         path.startsWith("http://") ||
         path.startsWith("https://");
}

// Reject local filesystem paths
function isLocalFilesystemPath(path: string): boolean {
  if (/^[A-Za-z]:\\/.test(path)) return true;  // Windows: C:\
  if (path.includes("\\")) return true;
  if (path.startsWith("/Users/")) return true;  // macOS
  if (path.startsWith("/home/")) return true;   // Linux
  return false;
}

// Main processing function
export function getRecipeImageUrl(path: string | null | undefined): string | undefined
```

#### Display-Time Transformations

**Hero Banner (21:9 ultrawide)**

```typescript
export function getHeroBannerUrl(url: string | null | undefined): string | undefined {
  if (isCloudinaryUrl(url)) {
    return applyCloudinaryTransformation(url, "w_1200,h_400,c_fill,g_auto/q_auto");
  }
  return url;
}
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `w_1200` | Width 1200px | Responsive for most screens |
| `h_400` | Height 400px | Matches hero container |
| `c_fill` | Crop mode | Fill dimensions, crop excess |
| `g_auto` | Gravity | AI-powered subject detection |
| `q_auto` | Quality | Automatic optimization |

**Recipe Card (customizable dimensions)**

```typescript
export function getRecipeCardUrl(
  url: string | null | undefined,
  width = 400,
  height = 300
): string | undefined {
  if (isCloudinaryUrl(url)) {
    return applyCloudinaryTransformation(url, `w_${width},h_${height},c_fill,g_auto`);
  }
  return url;
}
```

#### URL Transformation Insertion

```typescript
function applyCloudinaryTransformation(url: string, transformations: string): string {
  const uploadSegment = "/upload/";
  const uploadIndex = url.indexOf(uploadSegment);
  const insertPosition = uploadIndex + uploadSegment.length;

  return url.slice(0, insertPosition) + transformations + "/" + url.slice(insertPosition);
}
```

**Before:**
```
https://res.cloudinary.com/.../upload/v123/meal-genie/recipes/1/reference_1.jpg
```

**After:**
```
https://res.cloudinary.com/.../upload/w_1200,h_400,c_fill,g_auto/q_auto/v123/meal-genie/recipes/1/reference_1.jpg
```

---

## Data Flow Diagrams

### Direct Generation Flow (Recipe Add/Edit Page)

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. User enters recipe name & clicks "Generate Image"               │
│                              ↓                                      │
│  2. ImageUploadCard calls imageGenerationApi.generate()             │
│                              ↓                                      │
│  3. POST /api/ai/image-generation → Backend                         │
│                              ↓                                      │
│  4. ImageGenerationService.generate_dual_recipe_images()            │
│     → Gemini AI generates 1:1 + 21:9 images                         │
│                              ↓                                      │
│  5. Returns base64-encoded PNG data for both images                 │
│                              ↓                                      │
│  6. Frontend displays preview with "AI Generated" badge             │
│                              ↓                                      │
│  7. User accepts → handleGeneratedImageAccept() stores as Files     │
│                              ↓                                      │
│  8. On form submit → Uploads both to Cloudinary                     │
│                              ↓                                      │
│  9. Recipe saved with reference_image_path & banner_image_path      │
└─────────────────────────────────────────────────────────────────────┘
```

### Meal Genie Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. User requests recipe in Meal Genie chat                         │
│                              ↓                                      │
│  2. POST /api/ai/meal-genie/generate-recipe (generateImage=true)    │
│                              ↓                                      │
│  3. Backend generates recipe JSON + images simultaneously           │
│                              ↓                                      │
│  4. Response stored in sessionStorage                               │
│                              ↓                                      │
│  5. Navigate to /recipes/add?from=ai                                │
│                              ↓                                      │
│  6. useRecipeForm loads from sessionStorage, pre-fills form         │
└─────────────────────────────────────────────────────────────────────┘
```

### Complete Upload Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           IMAGE UPLOAD FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Action                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐                     │
│  │ Upload File         │    │ AI Generate Image   │                     │
│  │ (ImageUploadCard)   │    │ (Gemini API)        │                     │
│  └─────────┬───────────┘    └─────────┬───────────┘                     │
│            │                          │                                  │
│            │ File                     │ Base64 PNG                       │
│            ▼                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐                    │
│  │              useRecipeForm.ts                    │                    │
│  │  • imageFile: File                               │                    │
│  │  • bannerImageFile: File                         │                    │
│  │  • base64ToFile() conversion                     │                    │
│  └─────────────────────┬───────────────────────────┘                    │
│                        │                                                 │
│                        ▼                                                 │
│  ┌─────────────────────────────────────────────────┐                    │
│  │                uploadApi                         │                    │
│  │  • uploadRecipeImage() → POST /api/upload        │                    │
│  │  • uploadBase64Image() → POST /api/upload/base64 │                    │
│  └─────────────────────┬───────────────────────────┘                    │
│                        │                                                 │
│                        ▼                                                 │
│  ┌─────────────────────────────────────────────────┐                    │
│  │          Backend app/api/upload.py               │                    │
│  │  • Validate image type                           │                    │
│  │  • cloudinary.uploader.upload()                  │                    │
│  │    - folder: meal-genie/recipes/{id}             │                    │
│  │    - public_id: {type}_{id}                      │                    │
│  │    - transformations: quality + format auto      │                    │
│  └─────────────────────┬───────────────────────────┘                    │
│                        │                                                 │
│                        ▼                                                 │
│  ┌─────────────────────────────────────────────────┐                    │
│  │              CLOUDINARY CDN                      │                    │
│  │  https://res.cloudinary.com/dfbeydsmt/...       │                    │
│  └─────────────────────┬───────────────────────────┘                    │
│                        │                                                 │
│                        ▼ secure_url                                      │
│  ┌─────────────────────────────────────────────────┐                    │
│  │            Database (Recipe)                     │                    │
│  │  • reference_image_path = secure_url             │                    │
│  │  • banner_image_path = secure_url                │                    │
│  └─────────────────────────────────────────────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Image Cleanup Flow (Data Clear)

When `clear_all_data()` is called, Cloudinary images are deleted before database records:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      IMAGE CLEANUP FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DataManagementService.clear_all_data() triggered                    │
│                              ↓                                          │
│  2. Query all recipes with image paths                                  │
│     SELECT * FROM recipes WHERE reference_image_path IS NOT NULL        │
│                    OR banner_image_path IS NOT NULL                     │
│                              ↓                                          │
│  3. For each recipe, extract Cloudinary public_id via regex:            │
│     /upload/(?:v\d+/)?(.+)\.\w+$                                        │
│                              ↓                                          │
│  4. Call cloudinary.uploader.destroy(public_id) for each image          │
│     - reference_image_path → delete                                     │
│     - banner_image_path → delete                                        │
│                              ↓                                          │
│  5. Log count of deleted images                                         │
│                              ↓                                          │
│  6. Proceed with database record deletion                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Methods** (in `app/services/data_management_service.py`):
- `_extract_cloudinary_public_id()` - Extracts public ID from Cloudinary URL using regex
- `_delete_cloudinary_images()` - Iterates recipes and deletes images via Cloudinary API
- `clear_all_data()` - Orchestrates cleanup, calls `_delete_cloudinary_images()` before DB deletion

---

## Configuration

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GEMINI_IMAGE_API_KEY` | Google Gemini API authentication |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Cloudinary API authentication key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret for signed requests |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### User Settings

Users can customize the image generation prompt via **Settings → AI Features**:

- Stored in `localStorage` under `meal-genie-settings`
- Must include `{recipe_name}` placeholder
- Reset to default available

### Python Dependencies

```
# requirements.txt
cloudinary>=1.36.0
```

---

## Known Issues

### Missing Error Handling (1 Component)

**Component:** `RecipeRouletteWidget` — image rendering section (search for `imageUrl &&`)

**Current behavior:** Checks if `imageUrl` exists but has no `onError` handler. If an image URL is present but the file is missing (404), the browser's broken image icon is displayed instead of the ChefHat placeholder.

**Note:** `RecipeImage` component provides `onError` handling. This component uses a native `<img>` tag instead.

### Resolved Issues

| Date | Component | Change |
|------|-----------|--------|
| 2026-01-18 | `MealQueueItem.tsx` | Now uses `RecipeImage` with `fill` mode |
| 2026-01-18 | `CircularImage.tsx` | Now wraps `RecipeImage` internally, uses `iconClassName` prop for custom icon sizing |

---

## Implementation Notes

1. **Dual-image generation** - Both square (1:1) and ultrawide (21:9) images are generated in a single API call. Gemini batches these requests.

2. **Failure handling** - Image generation failures do not block recipe creation. If images fail, the recipe saves and warnings are shown to the user.

3. **Base64 → File conversion** - Generated images arrive as base64 strings and are converted to File objects before upload. This allows the same Cloudinary upload pipeline for both AI-generated and user-uploaded images.

4. **g_auto parameter** - Cloudinary's `g_auto` (gravity auto) uses AI-powered subject detection to center the primary subject when cropping.

5. **Dual transformation points** - Transformations are applied at two points:
   - **Upload-time:** quality/format adjustments for storage
   - **Display-time:** resize/crop for specific contexts

6. **URL-based transformations** - For display transformations, the frontend modifies URLs directly by inserting transformation strings after `/upload/`. Cloudinary generates derivatives on-the-fly from the URL structure (no separate API call required).
