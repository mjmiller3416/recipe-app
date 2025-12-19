# Backend/Frontend Integration Guide

This document provides comprehensive documentation for the backend/frontend integration in the Meal Genie recipe application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Integration Status](#integration-status)
- [Data Flow Patterns](#data-flow-patterns)
- [Type Definitions](#type-definitions)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                         localhost:3000                           │
├─────────────────────────────────────────────────────────────────┤
│  Pages                    │  API Client (lib/api.ts)            │
│  ─────────────────────    │  ────────────────────────           │
│  /recipes      [API] ────►│  recipeApi                          │
│  /recipes/[id] [API] ────►│  plannerApi                         │
│  /meal-planner [MOCK]     │  shoppingApi                        │
│  /shopping-list [MOCK]    │  ingredientApi                      │
│  /recipes/add  [PARTIAL]  │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼ HTTP (fetch)
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (FastAPI)                        │
│                         localhost:8000                           │
├─────────────────────────────────────────────────────────────────┤
│  Routers                  │  Services                           │
│  ─────────────────────    │  ────────────────────────           │
│  /api/recipes             │  RecipeService                      │
│  /api/planner             │  MealPlannerService                 │
│  /api/shopping            │  ShoppingListService                │
│  /api/ingredients         │  IngredientService                  │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────────┐
│                       Database (SQLite/PostgreSQL)               │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 14+ |
| UI Components | shadcn/ui + Tailwind CSS | Latest |
| Backend | FastAPI | >= 0.109.0 |
| ORM | SQLAlchemy | >= 2.0.0 |
| Database | SQLite (dev) / PostgreSQL (prod) | - |
| Validation | Pydantic | >= 2.0.0 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

- API Documentation (Swagger): `http://localhost:8000/docs`
- Alternative Docs (ReDoc): `http://localhost:8000/redoc`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## API Reference

### Base Configuration

The API client is configured in `frontend/src/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

### Recipe API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List all recipes with optional filters |
| GET | `/api/recipes/{id}` | Get recipe by ID |
| POST | `/api/recipes` | Create new recipe |
| PUT | `/api/recipes/{id}` | Update recipe |
| DELETE | `/api/recipes/{id}` | Delete recipe |
| POST | `/api/recipes/{id}/favorite` | Toggle favorite status |
| GET | `/api/recipes/categories` | Get all recipe categories |
| GET | `/api/recipes/meal-types` | Get all meal types |

**Query Parameters for List Endpoint:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by recipe category |
| `meal_type` | string | Filter by meal type |
| `diet_pref` | string | Filter by dietary preference |
| `max_time` | number | Maximum cooking time in minutes |
| `min_servings` | number | Minimum servings |
| `max_servings` | number | Maximum servings |
| `sort_by` | string | Sort field (name, created_at, total_time) |
| `sort_order` | string | Sort direction (asc, desc) |

### Planner API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planner/meals` | Get all meal selections |
| GET | `/api/planner/meals/{id}` | Get meal by ID |
| POST | `/api/planner/meals` | Create meal selection |
| PUT | `/api/planner/meals/{id}` | Update meal selection |
| DELETE | `/api/planner/meals/{id}` | Delete meal selection |
| POST | `/api/planner/save` | Save current meal plan |
| POST | `/api/planner/clear` | Clear all meals |
| GET | `/api/planner/summary` | Get meal plan summary |

### Shopping API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shopping` | Get shopping list |
| GET | `/api/shopping/items` | Get all shopping items |
| POST | `/api/shopping/items` | Add item to list |
| PUT | `/api/shopping/items/{id}` | Update shopping item |
| DELETE | `/api/shopping/items/{id}` | Remove item |
| POST | `/api/shopping/items/{id}/toggle` | Toggle checked status |
| POST | `/api/shopping/generate` | Generate list from recipes |
| POST | `/api/shopping/bulk-toggle` | Bulk toggle items |
| POST | `/api/shopping/clear` | Clear shopping list |
| POST | `/api/shopping/clear-checked` | Clear checked items |

### Ingredient API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | List all ingredients |
| GET | `/api/ingredients/search` | Search ingredients |
| GET | `/api/ingredients/categories` | Get ingredient categories |
| GET | `/api/ingredients/names` | Get ingredient names |

---

## Integration Status

### Current Status Overview

| Page | Status | Notes |
|------|--------|-------|
| `/recipes` | ✅ **Integrated** | Fully connected to backend API |
| `/recipes/[id]` | ✅ **Integrated** | Full CRUD + meal plan integration |
| `/meal-planner` | ⚠️ **Mock Data** | Uses `mockMealSelections` from mockData.ts |
| `/shopping-list` | ⚠️ **Mock Data** | Uses `mockShoppingList` from mockData.ts |
| `/recipes/add` | ⚠️ **Partial** | Form exists, needs API connection |
| `/dashboard` | 📋 **Placeholder** | Empty page, needs implementation |

### Pages Using Mock Data

> **Note:** The following pages are currently using mock data and need to be migrated to use the real API endpoints once backend integration is complete.

#### Meal Planner (`/meal-planner`)

**Current Implementation:**
```typescript
// frontend/src/app/meal-planner/page.tsx
import { mockMealSelections, mockRecipes } from "@/lib/mockData";

const [meals, setMeals] = useState<Meal[]>(mockMealSelections);
```

**Required Migration:**
```typescript
// Replace with API calls
import { plannerApi } from "@/lib/api";

useEffect(() => {
  const fetchMeals = async () => {
    try {
      setIsLoading(true);
      const data = await plannerApi.getMeals();
      setMeals(data);
    } catch (err) {
      setError("Failed to load meal plan");
    } finally {
      setIsLoading(false);
    }
  };
  fetchMeals();
}, []);
```

#### Shopping List (`/shopping-list`)

**Current Implementation:**
```typescript
// frontend/src/app/shopping-list/page.tsx
import { mockShoppingList } from "@/lib/mockData";

const [items, setItems] = useState<ShoppingItemResponseDTO[]>(mockShoppingList.items);
```

**Required Migration:**
```typescript
// Replace with API calls
import { shoppingApi } from "@/lib/api";

useEffect(() => {
  const fetchShoppingList = async () => {
    try {
      setIsLoading(true);
      const data = await shoppingApi.getList();
      setItems(data.items);
    } catch (err) {
      setError("Failed to load shopping list");
    } finally {
      setIsLoading(false);
    }
  };
  fetchShoppingList();
}, []);
```

### Pages Fully Integrated

#### Recipe Browser (`/recipes`)

- Fetches recipes via `recipeApi.list()`
- Supports favorite toggling with optimistic updates
- Includes loading and error states
- Uses `mapRecipesForCards()` for DTO transformation

#### Recipe Detail (`/recipes/[id]`)

- Fetches single recipe via `recipeApi.get(id)`
- Supports favorite toggle via `recipeApi.toggleFavorite(id)`
- Supports recipe deletion via `recipeApi.delete(id)`
- Integrates with meal planner via `plannerApi.getMeals()` and `plannerApi.updateMeal()`

---

## Data Flow Patterns

### Pattern 1: Async Loading with useEffect

Used for pages that need to fetch data on mount.

```typescript
const [data, setData] = useState<DataType[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.list();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

### Pattern 2: Optimistic Updates

Used for mutations where immediate UI feedback is important.

```typescript
const handleToggle = async (item: Item) => {
  // Optimistic update
  setItems((prev) =>
    prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
  );

  try {
    await api.toggle(item.id);
  } catch (err) {
    // Revert on error
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i))
    );
    toast.error("Failed to update");
  }
};
```

### Pattern 3: Conditional Fetch (Dialog/Modal)

Used when data should only be fetched when a dialog opens.

```typescript
const [open, setOpen] = useState(false);
const [dialogData, setDialogData] = useState<DataType[]>([]);

useEffect(() => {
  if (open) {
    const fetchDialogData = async () => {
      const data = await api.getRelatedData();
      setDialogData(data);
    };
    fetchDialogData();
  }
}, [open]);
```

---

## Type Definitions

### Recipe Types

```typescript
// Response DTO from backend
interface RecipeResponseDTO {
  id: number;
  recipe_name: string;
  description: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  total_time: number;
  recipe_category: string;
  meal_type: string;
  diet_pref: string;
  reference_image_path: string;
  is_favorite: boolean;
  ingredients: RecipeIngredientDTO[];
  instructions: InstructionDTO[];
  created_at: string;
  updated_at: string;
}

// Create/Update DTO
interface RecipeCreateDTO {
  recipe_name: string;
  description?: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  recipe_category: string;
  meal_type: string;
  diet_pref?: string;
  ingredients: RecipeIngredientCreateDTO[];
  instructions: InstructionCreateDTO[];
}

// Frontend card data (transformed)
interface RecipeCardData {
  id: string;
  name: string;
  servings: number;
  totalTime: number;
  imageUrl: string;
  category: string;
  mealType: string;
  dietaryPreference: string;
  isFavorite: boolean;
  ingredients?: IngredientData[];
}
```

### Meal Planner Types

```typescript
interface MealSelectionResponseDTO {
  id: number;
  day_of_week: string;
  meal_type: string;
  recipe_id: number | null;
  recipe: RecipeCardDTO | null;
  servings: number;
  notes: string;
}

interface MealSelectionCreateDTO {
  day_of_week: string;
  meal_type: string;
  recipe_id?: number;
  servings?: number;
  notes?: string;
}
```

### Shopping List Types

```typescript
interface ShoppingListResponseDTO {
  items: ShoppingItemResponseDTO[];
  total_items: number;
  checked_items: number;
  unchecked_items: number;
}

interface ShoppingItemResponseDTO {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  category: string;
  is_checked: boolean;
  source: "recipe" | "manual";
  recipe_id: number | null;
  state_key: string;
}
```

---

## Environment Configuration

### Backend (`backend/.env`)

```env
# Database Configuration
DATABASE_URL=sqlite:///./app.db

# For PostgreSQL (production):
# DATABASE_URL=postgresql://user:password@localhost:5432/recipe_db

# Optional: OpenAI for AI features
# OPENAI_API_KEY=your-api-key
```

### Frontend (`frontend/.env.local`)

```env
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Troubleshooting

### Common Issues

#### CORS Errors

If you see CORS errors in the browser console, ensure the backend has the frontend origin configured:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### API Connection Refused

1. Verify the backend is running: `http://localhost:8000/health`
2. Check `NEXT_PUBLIC_API_URL` is set correctly
3. Ensure no firewall blocking the port

#### Database Migration Issues

```bash
# Reset and rerun migrations
alembic downgrade base
alembic upgrade head
```

#### Type Mismatches

If you encounter type errors between frontend and backend:

1. Check the DTO definitions in `frontend/src/lib/api.ts`
2. Compare with Pydantic models in `backend/app/schemas/`
3. Ensure field names match (backend uses `snake_case`, frontend may need mapping)

### Debugging Tips

1. **Backend Logs**: Check terminal running uvicorn for request/response logs
2. **API Docs**: Use `http://localhost:8000/docs` to test endpoints directly
3. **Network Tab**: Use browser DevTools to inspect API calls
4. **React DevTools**: Inspect component state for data issues

---

## Migration Checklist

Use this checklist when migrating a page from mock data to real API:

- [ ] Import the appropriate API module from `@/lib/api`
- [ ] Add loading state (`useState<boolean>`)
- [ ] Add error state (`useState<string | null>`)
- [ ] Create `useEffect` hook for data fetching
- [ ] Add loading UI (spinner/skeleton)
- [ ] Add error UI with retry option
- [ ] Update mutation handlers to call API methods
- [ ] Add optimistic updates where appropriate
- [ ] Remove mock data imports
- [ ] Test error scenarios (network failure, 404, etc.)
- [ ] Test loading states

---

## Contributing

When adding new API integrations:

1. Add endpoint to backend router
2. Add corresponding method to frontend API client (`lib/api.ts`)
3. Add TypeScript types for request/response DTOs
4. Update this documentation
5. Remove any mock data usage for the integrated feature

---

*Last updated: December 2024*
