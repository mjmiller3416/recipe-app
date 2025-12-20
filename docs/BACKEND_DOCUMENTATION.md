# Meal Genie Backend Documentation

Complete technical documentation for the Meal Genie backend API.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Getting Started](#getting-started)
5. [API Endpoints](#api-endpoints)
6. [Database Models](#database-models)
7. [Repositories](#repositories)
8. [Services](#services)
9. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
10. [Database Configuration](#database-configuration)
11. [Error Handling](#error-handling)
12. [Scripts & Utilities](#scripts--utilities)
13. [Development Guide](#development-guide)
14. [Feedback API](#feedback-api)

---

## Overview

The Meal Genie backend is a RESTful API built with FastAPI and Python. It provides:

- **Recipe Management** - CRUD operations for recipes with ingredients
- **Meal Planning** - Create meals from recipes and plan them
- **Shopping Lists** - Generate shopping lists from planned meals
- **Ingredient Management** - Manage ingredient database
- **Data Import/Export** - Excel import/export functionality
- **Image Upload** - Cloudinary integration for recipe images
- **AI Image Generation** - Gemini AI-powered recipe image generation
- **User Feedback** - GitHub issue integration for feedback

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | Latest | Web framework |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.0+ | Data validation |
| Alembic | Latest | Database migrations |
| SQLite | Default | Development database |
| PostgreSQL | Optional | Production database |
| Uvicorn | Latest | ASGI server |
| openpyxl | Latest | Excel file handling |

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                          # FastAPI application entry point
│   ├── api/                             # Route handlers
│   │   ├── recipes.py                   # Recipe endpoints
│   │   ├── meals.py                     # Meal endpoints
│   │   ├── planner.py                   # Planner endpoints
│   │   ├── shopping.py                  # Shopping list endpoints
│   │   ├── ingredients.py               # Ingredient endpoints
│   │   ├── data_management.py           # Import/export endpoints
│   │   ├── feedback.py                  # User feedback endpoints
│   │   ├── upload.py                    # Image upload endpoints (Cloudinary)
│   │   └── image_generation.py          # AI image generation endpoints
│   └── core/
│       ├── models/                      # SQLAlchemy ORM models
│       │   ├── recipe.py
│       │   ├── ingredient.py
│       │   ├── recipe_ingredient.py
│       │   ├── meal.py
│       │   ├── planner_entry.py
│       │   ├── recipe_history.py
│       │   ├── shopping_item.py
│       │   └── shopping_state.py
│       ├── repositories/                # Data access layer
│       │   ├── recipe_repo.py
│       │   ├── meal_repo.py
│       │   ├── planner_repo.py
│       │   ├── shopping_repo.py
│       │   └── ingredient_repo.py
│       ├── services/                    # Business logic layer
│       │   ├── recipe_service.py
│       │   ├── meal_service.py
│       │   ├── planner_service.py
│       │   ├── shopping_service.py
│       │   ├── ingredient_service.py
│       │   ├── data_management_service.py
│       │   ├── feedback_service.py
│       │   └── image_generation_service.py  # AI image generation
│       ├── dtos/                        # Pydantic validation models
│       │   ├── recipe_dtos.py
│       │   ├── meal_dtos.py
│       │   ├── planner_dtos.py
│       │   ├── shopping_dtos.py
│       │   ├── ingredient_dtos.py
│       │   ├── data_management_dtos.py
│       │   ├── feedback.py
│       │   └── image_generation_dtos.py     # AI image generation DTOs
│       └── database/
│           ├── db.py                    # Database connection & session
│           ├── base.py                  # SQLAlchemy declarative base
│           ├── app_data.db              # SQLite database file
│           └── migrations/              # Alembic migrations
│               ├── env.py
│               ├── alembic.ini
│               └── versions/            # Migration scripts
├── scripts/
│   ├── seed_database.py                 # Sample data seeder
│   └── list_recipes.py                  # Utility script
├── tests/
│   ├── conftest.py                      # Test fixtures
│   └── test_meal_and_planner.py         # Test cases
├── requirements.txt                     # Python dependencies
├── .env.example                         # Environment template
└── venv/                                # Virtual environment
```

---

## Getting Started

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
```

**Environment Variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `SQLALCHEMY_DATABASE_URL` | No | Database URL (default: SQLite) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for image uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI image generation |
| `GITHUB_TOKEN` | No | GitHub PAT for feedback submission |
| `GITHUB_REPO` | No | GitHub repo for feedback issues |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: *) |

### Running the Server

```bash
# Windows
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Linux/macOS
python -m uvicorn app.main:app --reload --port 8000
```

### Seeding Sample Data

```bash
# Windows
venv\Scripts\python.exe scripts/seed_database.py

# Linux/macOS
python scripts/seed_database.py
```

### API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## API Endpoints

### Base Configuration

- **Base URL**: `http://localhost:8000`
- **API Prefix**: `/api`
- **Content-Type**: `application/json`

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root health check |
| GET | `/health` | Health status |

---

### Recipe Endpoints (`/api/recipes`)

#### List Recipes
```http
GET /api/recipes
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `recipe_category` | string | Filter by category |
| `meal_type` | string | Filter by meal type |
| `diet_pref` | string | Filter by dietary preference |
| `search_term` | string | Search in name/description |
| `favorites_only` | boolean | Filter favorites only (default: false) |
| `cook_time` | integer | Filter by max cooking time (minutes) |
| `servings` | integer | Filter by number of servings |
| `sort_by` | string | Sort field: recipe_name, created_at, total_time, servings |
| `sort_order` | string | asc or desc (default: asc) |
| `limit` | integer | Max results (1-100) |
| `offset` | integer | Skip results for pagination |

**Response:** `RecipeResponseDTO[]`

#### Get Recipe Cards
```http
GET /api/recipes/cards
```

Lightweight version for list/grid views. Same query parameters as list.

**Response:** `RecipeCardDTO[]`

#### Get Single Recipe
```http
GET /api/recipes/{recipe_id}
```

**Response:** `RecipeResponseDTO`

#### Create Recipe
```http
POST /api/recipes
```

**Request Body:** `RecipeCreateDTO`
```json
{
  "recipe_name": "Pasta Carbonara",
  "recipe_category": "Italian",
  "meal_type": "Dinner",
  "diet_pref": null,
  "total_time": 30,
  "servings": 4,
  "directions": "1. Cook pasta\n2. Fry bacon\n3. Mix eggs and cheese",
  "notes": "Use fresh eggs for best results",
  "ingredients": [
    {
      "ingredient_name": "Spaghetti",
      "ingredient_category": "Pasta",
      "quantity": 400,
      "unit": "g"
    }
  ]
}
```

**Response:** `RecipeResponseDTO`

#### Update Recipe
```http
PUT /api/recipes/{recipe_id}
```

**Request Body:** `RecipeUpdateDTO` (all fields optional)

**Response:** `RecipeResponseDTO`

#### Delete Recipe
```http
DELETE /api/recipes/{recipe_id}
```

**Response:** `204 No Content`

#### Toggle Favorite
```http
POST /api/recipes/{recipe_id}/favorite
```

**Response:** `RecipeResponseDTO`

#### Get Categories
```http
GET /api/recipes/categories
```

**Response:** `string[]`

#### Get Meal Types
```http
GET /api/recipes/meal-types
```

**Response:** `string[]`

#### Get Deletion Impact
```http
GET /api/recipes/{recipe_id}/deletion-impact
```

Check what meals would be affected by deleting this recipe.

**Response:** `RecipeDeletionImpactDTO`

#### Get Last Cooked Date
```http
GET /api/recipes/{recipe_id}/last-cooked
```

**Response:** `{ "last_cooked": "2024-01-15T12:00:00Z" }`

---

### Meal Endpoints (`/api/meals`)

#### List Meals
```http
GET /api/meals
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name_pattern` | string | Search by name |
| `tags` | string[] | Filter by tags |
| `favorites_only` | boolean | Filter favorites |
| `limit` | integer | Max results |
| `offset` | integer | Pagination offset |

**Response:** `MealResponseDTO[]`

#### Get Single Meal
```http
GET /api/meals/{meal_id}
```

**Response:** `MealResponseDTO`

#### Get Meals by Recipe
```http
GET /api/meals/by-recipe/{recipe_id}
```

Get all meals that contain this recipe (as main or side).

**Response:** `MealResponseDTO[]`

#### Get Favorite Meals
```http
GET /api/meals/favorites
```

**Response:** `MealResponseDTO[]`

#### Create Meal
```http
POST /api/meals
```

**Request Body:** `MealCreateDTO`
```json
{
  "meal_name": "Italian Night",
  "main_recipe_id": 1,
  "side_recipe_ids": [2, 3],
  "is_favorite": false,
  "tags": ["italian", "dinner", "family"]
}
```

**Constraints:**
- `main_recipe_id` is required
- `side_recipe_ids` max 3 items
- `tags` max 20 items, 50 chars each

**Response:** `MealResponseDTO`

#### Update Meal
```http
PUT /api/meals/{meal_id}
```

**Request Body:** `MealUpdateDTO`

**Response:** `MealResponseDTO`

#### Delete Meal
```http
DELETE /api/meals/{meal_id}
```

Cascades to planner entries.

**Response:** `204 No Content`

#### Toggle Favorite
```http
POST /api/meals/{meal_id}/favorite
```

**Response:** `MealResponseDTO`

#### Add Side Recipe
```http
POST /api/meals/{meal_id}/sides/{recipe_id}
```

**Response:** `MealResponseDTO`

#### Remove Side Recipe
```http
DELETE /api/meals/{meal_id}/sides/{recipe_id}
```

**Response:** `MealResponseDTO`

#### Reorder Side Recipes
```http
PUT /api/meals/{meal_id}/sides/reorder
```

**Request Body:**
```json
{
  "side_recipe_ids": [3, 1, 2]
}
```

**Response:** `MealResponseDTO`

---

### Planner Endpoints (`/api/planner`)

#### Get All Entries
```http
GET /api/planner/entries
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `meal_id` | integer | Filter by meal |
| `completed` | boolean | Filter by status |

**Response:** `PlannerEntryResponseDTO[]`

#### Get Single Entry
```http
GET /api/planner/entries/{entry_id}
```

**Response:** `PlannerEntryResponseDTO`

#### Get Summary
```http
GET /api/planner/summary
```

**Response:** `PlannerSummaryDTO`
```json
{
  "total_entries": 5,
  "completed_entries": 2,
  "pending_entries": 3,
  "max_entries": 15,
  "available_slots": 10
}
```

#### Get Meal IDs
```http
GET /api/planner/meal-ids
```

**Response:** `integer[]`

#### Add Meal to Planner
```http
POST /api/planner/entries/{meal_id}
```

**Constraint:** Max 15 entries

**Response:** `PlannerEntryResponseDTO`

#### Bulk Add Meals
```http
POST /api/planner/entries/bulk
```

**Request Body:** `PlannerBulkAddDTO`
```json
{
  "meal_ids": [1, 2, 3]
}
```

**Response:** `PlannerOperationResultDTO`

#### Reorder Entries
```http
PUT /api/planner/entries/reorder
```

**Request Body:** `PlannerReorderDTO`
```json
{
  "entry_ids": [3, 1, 2, 4]
}
```

**Response:** `PlannerOperationResultDTO`

#### Toggle Completion
```http
POST /api/planner/entries/{entry_id}/toggle
```

**Response:** `PlannerEntryResponseDTO`

#### Mark Completed
```http
POST /api/planner/entries/{entry_id}/complete
```

**Response:** `PlannerEntryResponseDTO`

#### Mark Incomplete
```http
POST /api/planner/entries/{entry_id}/incomplete
```

**Response:** `PlannerEntryResponseDTO`

#### Remove Entry
```http
DELETE /api/planner/entries/{entry_id}
```

**Response:** `204 No Content`

#### Remove by Meal
```http
DELETE /api/planner/entries/by-meal/{meal_id}
```

**Response:** `PlannerOperationResultDTO`

#### Clear Planner
```http
DELETE /api/planner/clear
```

**Response:** `PlannerOperationResultDTO`

#### Clear Completed
```http
DELETE /api/planner/clear-completed
```

**Response:** `PlannerOperationResultDTO`

---

### Shopping Endpoints (`/api/shopping`)

#### Get Shopping List
```http
GET /api/shopping
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | "recipe" or "manual" |
| `category` | string | Filter by category |
| `have` | boolean | Filter by status |
| `search_term` | string | Search ingredient name |
| `limit` | integer | Max results |
| `offset` | integer | Pagination offset |

**Response:** `ShoppingListResponseDTO`

#### Get Single Item
```http
GET /api/shopping/items/{item_id}
```

**Response:** `ShoppingItemResponseDTO`

#### Add Manual Item
```http
POST /api/shopping/items
```

**Request Body:** `ManualItemCreateDTO`
```json
{
  "ingredient_name": "Milk",
  "quantity": 1,
  "unit": "gallon",
  "category": "Dairy"
}
```

**Response:** `ShoppingItemResponseDTO`

#### Update Item
```http
PATCH /api/shopping/items/{item_id}
```

**Request Body:** `ShoppingItemUpdateDTO`

**Response:** `ShoppingItemResponseDTO`

#### Toggle Item Status
```http
PATCH /api/shopping/items/{item_id}/toggle
```

**Response:** `ShoppingItemResponseDTO`

#### Delete Item
```http
DELETE /api/shopping/items/{item_id}
```

**Response:** `204 No Content`

#### Generate from Recipes
```http
POST /api/shopping/generate
```

**Request Body:** `ShoppingListGenerationDTO`
```json
{
  "recipe_ids": [1, 2, 3],
  "servings_multiplier": 1.5
}
```

**Response:** `ShoppingListGenerationResultDTO`

#### Get Ingredient Breakdown
```http
GET /api/shopping/breakdown
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `recipe_ids` | integer[] | Recipe IDs to analyze |

**Response:** `IngredientBreakdownDTO[]`

Shows aggregated ingredients across multiple recipes.

#### Clear All Items
```http
DELETE /api/shopping/clear
```

**Response:** `BulkOperationResultDTO`

#### Clear Manual Items
```http
DELETE /api/shopping/clear-manual
```

**Response:** `BulkOperationResultDTO`

#### Clear Recipe Items
```http
DELETE /api/shopping/clear-recipe
```

**Response:** `BulkOperationResultDTO`

#### Clear Completed Items
```http
DELETE /api/shopping/clear-completed
```

**Response:** `BulkOperationResultDTO`

#### Bulk Update Status
```http
PATCH /api/shopping/bulk-update
```

**Request Body:** `BulkStateUpdateDTO`
```json
{
  "updates": [
    { "item_id": 1, "have": true },
    { "item_id": 2, "have": false }
  ]
}
```

**Response:** `BulkOperationResultDTO`

---

### Ingredient Endpoints (`/api/ingredients`)

#### List Ingredients
```http
GET /api/ingredients
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name |
| `category` | string | Filter by category |
| `limit` | integer | Max results |
| `offset` | integer | Pagination offset |

**Response:** `IngredientResponseDTO[]`

#### Get Single Ingredient
```http
GET /api/ingredients/{ingredient_id}
```

**Response:** `IngredientResponseDTO`

#### Get Categories
```http
GET /api/ingredients/categories
```

**Response:** `string[]`

#### Get All Names
```http
GET /api/ingredients/names
```

For autocomplete functionality.

**Response:** `string[]`

#### Search Ingredients
```http
POST /api/ingredients/search
```

**Request Body:** `IngredientSearchDTO`
```json
{
  "search_term": "chicken",
  "category": "Meat",
  "limit": 10
}
```

**Response:** `IngredientResponseDTO[]`

#### Create Ingredient
```http
POST /api/ingredients
```

**Request Body:** `IngredientCreateDTO`
```json
{
  "ingredient_name": "Chicken Breast",
  "ingredient_category": "Meat"
}
```

Returns existing ingredient if name+category already exists.

**Response:** `IngredientResponseDTO`

#### Bulk Create Ingredients
```http
POST /api/ingredients/bulk
```

**Request Body:** `IngredientCreateDTO[]`

**Response:** `IngredientResponseDTO[]`

#### Update Ingredient
```http
PUT /api/ingredients/{ingredient_id}
```

**Request Body:** `IngredientUpdateDTO`

**Response:** `IngredientResponseDTO`

#### Delete Ingredient
```http
DELETE /api/ingredients/{ingredient_id}
```

**Response:** `204 No Content`

---

### Data Management Endpoints (`/api/data-management`)

#### Preview Import
```http
POST /api/data-management/import/preview
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: xlsx file (max 10MB)

**Response:** `ImportPreviewDTO`
```json
{
  "total_recipes": 25,
  "new_recipes": 20,
  "duplicate_recipes": [
    {
      "row": 5,
      "recipe_name": "Pasta",
      "category": "Italian",
      "existing_id": 42
    }
  ],
  "validation_errors": [
    {
      "row": 8,
      "field": "servings",
      "message": "Must be a positive integer"
    }
  ]
}
```

#### Execute Import
```http
POST /api/data-management/import/execute
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: xlsx file
- `resolutions`: JSON string of duplicate resolutions

**Request Format:**
```json
{
  "resolutions": [
    {
      "row": 5,
      "action": "UPDATE"
    },
    {
      "row": 12,
      "action": "SKIP"
    },
    {
      "row": 18,
      "action": "RENAME",
      "new_name": "Pasta v2"
    }
  ]
}
```

**Duplicate Actions:**
- `SKIP` - Don't import
- `UPDATE` - Update existing recipe
- `RENAME` - Create new with different name

**Response:** `ImportResultDTO`

#### Export Recipes
```http
GET /api/data-management/export
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `meal_type` | string | Filter by meal type |
| `favorites_only` | boolean | Export favorites only |

**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### Download Template
```http
GET /api/data-management/template
```

Get empty xlsx template for importing recipes.

**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

### Upload Endpoints (`/api/upload`)

Image upload and management via Cloudinary.

#### Upload Recipe Image
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file to upload |
| `recipeId` | string | Recipe ID for organizing |
| `imageType` | string | "reference" (thumbnail) or "banner" (hero) |

**Response:**
```json
{
  "success": true,
  "path": "https://res.cloudinary.com/...",
  "filename": "reference_123"
}
```

#### Delete Recipe Image
```http
DELETE /api/upload/{public_id:path}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `public_id` | string | Cloudinary public ID of the image |

**Response:**
```json
{
  "success": true
}
```

---

### Image Generation Endpoints (`/api/generate-image`)

AI-powered recipe image generation using Google Gemini.

#### Generate Recipe Image
```http
POST /api/generate-image
```

**Request Body:** `ImageGenerationRequestDTO`
```json
{
  "recipe_name": "Pasta Carbonara"
}
```

**Response:** `ImageGenerationResponseDTO`
```json
{
  "success": true,
  "image_data": "base64_encoded_image_data...",
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "image_data": null,
  "error": "Image generation failed: reason"
}
```

**Notes:**
- Uses Gemini AI model `gemini-2.5-flash-image`
- Returns base64-encoded image data
- Generates professional food photography style images
- Requires `GEMINI_API_KEY` environment variable

---

## Database Models

### Recipe

Main recipe entity with full details.

```python
class Recipe(Base):
    __tablename__ = "recipes"

    id: int                           # Primary key
    recipe_name: str                  # Required, unique with category
    recipe_category: str              # Indexed for filtering
    meal_type: str                    # Default "Dinner"
    diet_pref: Optional[str]          # Dietary preference
    total_time: Optional[int]         # Minutes
    servings: Optional[int]           # Number of servings
    directions: Optional[str]         # Cooking instructions (text)
    notes: Optional[str]              # Additional notes (text)
    reference_image_path: Optional[str]  # Thumbnail image
    banner_image_path: Optional[str]     # Hero image
    created_at: datetime              # UTC timestamp
    is_favorite: bool                 # Indexed for filtering

    # Relationships
    ingredients: List[RecipeIngredient]  # Cascade delete
    history: List[RecipeHistory]         # Cooking history
    main_meals: List[Meal]               # Meals using as main
```

**Helper Methods:**
- `formatted_time()` - Returns "Xh Ym" format
- `formatted_servings()` - Returns servings string
- `get_directions_list()` - Splits directions into steps
- `get_ingredient_details()` - Returns IngredientDetailDTO list

**Constraints:**
- Unique constraint on (recipe_name, recipe_category)

---

### Ingredient

Ingredient master data.

```python
class Ingredient(Base):
    __tablename__ = "ingredients"

    id: int                     # Primary key
    ingredient_name: str        # Indexed
    ingredient_category: str    # Indexed

    # Relationships
    recipe_links: List[RecipeIngredient]  # Cascade delete
```

**Helper Methods:**
- `display_label()` - Returns "name (category)"

**Constraints:**
- Unique constraint on (ingredient_name, ingredient_category)

---

### RecipeIngredient

Many-to-many relationship between recipes and ingredients.

```python
class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    recipe_id: int              # Composite PK
    ingredient_id: int          # Composite PK
    quantity: Optional[float]   # Amount
    unit: Optional[str]         # Unit of measure

    # Relationships
    ingredient: Ingredient      # Joined load
    recipe: Recipe
```

**Helper Methods:**
- `get_ingredient_detail()` - Returns IngredientDetailDTO

---

### Meal

A meal composed of a main recipe and optional side recipes.

```python
class Meal(Base):
    __tablename__ = "meals"

    id: int                           # Primary key
    meal_name: str                    # 1-255 characters
    main_recipe_id: int               # FK to Recipe (CASCADE)
    _side_recipe_ids_json: str        # JSON array, stored as TEXT
    is_favorite: bool                 # For filtering
    _tags_json: str                   # JSON array, stored as TEXT
    created_at: datetime              # UTC timestamp

    # Relationships
    main_recipe: Recipe
    planner_entries: List[PlannerEntry]  # Cascade delete
```

**Properties:**

`side_recipe_ids: List[int]`
- Getter/setter with validation
- Max 3 items
- Stored as JSON string

`tags: List[str]`
- Getter/setter with normalization
- Lowercase, stripped whitespace
- Duplicates removed (order preserved)
- Max 20 tags, 50 chars each

**Helper Methods:**
- `add_side_recipe(recipe_id)` - Add side (max 3, no duplicates)
- `remove_side_recipe(recipe_id)` - Remove side
- `get_all_recipe_ids()` - Returns [main_id] + side_ids
- `has_recipe(recipe_id)` - Check if meal contains recipe

**Constraints:**
- Max 3 side recipes
- Max 20 tags, 50 characters each

---

### PlannerEntry

Entry in the meal planner.

```python
class PlannerEntry(Base):
    __tablename__ = "planner_entries"

    id: int                          # Primary key
    meal_id: int                     # FK to Meal (CASCADE)
    position: int                    # 0-indexed for ordering
    is_completed: bool               # Default False
    completed_at: Optional[datetime] # Set when completed
    scheduled_date: Optional[date]   # For calendar feature

    # Relationships
    meal: Meal
```

**Helper Methods:**
- `mark_completed()` - Sets is_completed=True, sets completed_at
- `mark_incomplete()` - Sets is_completed=False, clears completed_at
- `toggle_completion()` - Returns new is_completed value

**Constraints:**
- Max 15 entries in planner

---

### ShoppingItem

Item in the shopping list.

```python
class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id: int                      # Primary key
    ingredient_name: str         # 1-255 characters
    quantity: float              # Default 0.0
    unit: Optional[str]          # Max 50 characters
    category: Optional[str]      # Max 100 characters
    source: Enum                 # "recipe" or "manual"
    have: bool                   # Checked status
    state_key: Optional[str]     # For state persistence
```

**Class Methods:**
- `create_from_recipe()` - Factory for recipe items
- `create_manual()` - Factory for manual items

**Helper Methods:**
- `key()` - Generates unique key
- `display_label()` - Returns "○/✓ name: qty unit"
- `formatted_quantity()` - Clean quantity string

---

### ShoppingState

Persists shopping item state across list regenerations.

```python
class ShoppingState(Base):
    __tablename__ = "shopping_states"

    id: int            # Primary key
    key: str           # Unique, normalized ingredient::unit
    quantity: float
    unit: str
    checked: bool      # Persistence flag
```

**Class Methods:**
- `normalize_key(key)` - Lowercase, stripped
- `create_key(ingredient_name, unit)` - Creates normalized key

---

### RecipeHistory

Tracks when recipes were cooked.

```python
class RecipeHistory(Base):
    __tablename__ = "recipe_history"

    id: int              # Primary key
    recipe_id: int       # FK to Recipe
    cooked_at: datetime  # Default UTC now

    # Relationships
    recipe: Recipe
```

---

## Repositories

Repositories handle all database operations. Each repository follows dependency injection pattern.

### RecipeRepo

```python
class RecipeRepo:
    def __init__(self, session: Session, ingredient_repo: IngredientRepo = None):
        ...

    # Create
    def persist_recipe_and_links(self, recipe_dto: RecipeCreateDTO) -> Recipe
    def create_recipe(self, recipe: Recipe) -> Recipe

    # Read
    def get_by_id(self, recipe_id: int) -> Optional[Recipe]
    def filter_recipes(self, filter_dto: RecipeFilterDTO) -> List[Recipe]
    def recipe_exists(self, name: str, category: str) -> bool
    def get_last_cooked_date(self, recipe_id: int) -> Optional[datetime]

    # Update
    def update_recipe(self, recipe_id: int, update_dto: RecipeUpdateDTO) -> Recipe
    def toggle_favorite(self, recipe_id: int) -> Recipe

    # Delete
    def delete_recipe(self, recipe: Recipe) -> None
```

### MealRepo

```python
class MealRepo:
    def __init__(self, session: Session):
        ...

    # Create
    def create_meal(self, meal: Meal) -> Meal

    # Read
    def get_by_id(self, meal_id: int) -> Optional[Meal]
    def get_all(self) -> List[Meal]
    def filter_meals(self, name_pattern, tags, favorites_only, limit, offset) -> List[Meal]
    def get_by_name_pattern(self, search_term: str) -> List[Meal]
    def get_favorites(self) -> List[Meal]
    def get_meals_by_main_recipe(self, recipe_id: int) -> List[Meal]
    def get_meals_with_side_recipe(self, recipe_id: int) -> List[Meal]

    # Update
    def update_meal(self, meal_id: int, update_dto: MealUpdateDTO) -> Meal
    def toggle_favorite(self, meal_id: int) -> Meal
    def remove_side_recipe_from_all_meals(self, recipe_id: int) -> None

    # Delete
    def delete_meal(self, meal_id: int) -> None

    # Validation
    def validate_recipe_ids(self, recipe_ids: List[int]) -> bool
```

### PlannerRepo

```python
class PlannerRepo:
    def __init__(self, session: Session):
        ...

    # Create
    def add_meal_to_planner(self, meal_id: int) -> PlannerEntry

    # Read
    def get_all_entries(self, meal_id: int = None, completed: bool = None) -> List[PlannerEntry]
    def get_entry_by_id(self, entry_id: int) -> Optional[PlannerEntry]
    def get_summary(self) -> PlannerSummaryDTO
    def get_meal_ids(self) -> List[int]

    # Update
    def reorder_entries(self, entry_ids: List[int]) -> None
    def toggle_completion(self, entry_id: int) -> PlannerEntry
    def mark_completed(self, entry_id: int) -> PlannerEntry
    def mark_incomplete(self, entry_id: int) -> PlannerEntry

    # Delete
    def remove_entry(self, entry_id: int) -> None
    def remove_entries_by_meal(self, meal_id: int) -> int
    def clear_planner(self) -> int
    def clear_completed(self) -> int
```

### ShoppingRepo

```python
class ShoppingRepo:
    def __init__(self, session: Session):
        ...

    # Create
    def add_item(self, item: ShoppingItem) -> ShoppingItem
    def add_items_from_recipe(self, recipe_id: int) -> List[ShoppingItem]

    # Read
    def get_shopping_list(self, filters: ShoppingListFilterDTO) -> ShoppingListResponseDTO
    def get_item(self, item_id: int) -> Optional[ShoppingItem]
    def get_items_by_source(self, source: str) -> List[ShoppingItem]

    # Update
    def update_item(self, item_id: int, update_dto: ShoppingItemUpdateDTO) -> ShoppingItem
    def toggle_item_status(self, item_id: int) -> ShoppingItem
    def bulk_update_status(self, item_updates: List[dict]) -> int

    # Delete
    def delete_item(self, item_id: int) -> None
    def clear_all(self) -> int
    def clear_by_source(self, source: str) -> int
```

### IngredientRepo

```python
class IngredientRepo:
    def __init__(self, session: Session):
        ...

    # Create
    def get_or_create(self, ingredient_dto: IngredientCreateDTO) -> Ingredient
    def create(self, ingredient_dto: IngredientCreateDTO) -> Ingredient

    # Read
    def get_by_id(self, ingredient_id: int) -> Optional[Ingredient]
    def get_all(self) -> List[Ingredient]
    def search(self, search_term: str, category: str = None) -> List[Ingredient]
    def get_categories(self) -> List[str]
    def get_all_names(self) -> List[str]
    def get_by_category(self, category: str) -> List[Ingredient]

    # Update
    def update(self, ingredient_id: int, update_dto: IngredientUpdateDTO) -> Ingredient

    # Delete
    def delete(self, ingredient_id: int) -> None
```

---

## Services

Services contain business logic and orchestrate repository operations.

### RecipeService

```python
class RecipeService:
    def __init__(self, session: Session):
        ...

    def create_recipe_with_ingredients(self, recipe_dto: RecipeCreateDTO) -> RecipeResponseDTO
    def resolve_ingredient(self, ing_dto: IngredientCreateDTO) -> Ingredient
    def list_filtered(self, filter_dto: RecipeFilterDTO) -> List[RecipeResponseDTO]
    def get_recipe(self, recipe_id: int) -> RecipeResponseDTO
    def update_recipe(self, recipe_id: int, update_dto: RecipeUpdateDTO) -> RecipeResponseDTO
    def delete_recipe(self, recipe_id: int) -> None
    def toggle_favorite(self, recipe_id: int) -> RecipeResponseDTO
    def get_recipe_deletion_impact(self, recipe_id: int) -> RecipeDeletionImpactDTO
    def get_last_cooked_date(self, recipe_id: int) -> Optional[datetime]
    def update_recipe_reference_image_path(self, recipe_id: int, path: str) -> None
    def update_recipe_banner_image_path(self, recipe_id: int, path: str) -> None
```

**Exceptions:**
- `RecipeSaveError` - Save operation failed
- `DuplicateRecipeError` - Recipe already exists

### MealService

```python
class MealService:
    def __init__(self, session: Session):
        ...

    def create_meal(self, create_dto: MealCreateDTO) -> MealResponseDTO
    def get_meal(self, meal_id: int) -> MealResponseDTO
    def get_all_meals(self) -> List[MealResponseDTO]
    def filter_meals(self, filter_dto: MealFilterDTO) -> List[MealResponseDTO]
    def search_meals(self, search_term: str) -> List[MealResponseDTO]
    def get_favorite_meals(self) -> List[MealResponseDTO]
    def get_meals_by_recipe(self, recipe_id: int) -> List[MealResponseDTO]
    def update_meal(self, meal_id: int, update_dto: MealUpdateDTO) -> MealResponseDTO
    def delete_meal(self, meal_id: int) -> None
    def toggle_favorite(self, meal_id: int) -> MealResponseDTO
    def add_side_recipe(self, meal_id: int, recipe_id: int) -> MealResponseDTO
    def remove_side_recipe(self, meal_id: int, recipe_id: int) -> MealResponseDTO
    def reorder_side_recipes(self, meal_id: int, side_recipe_ids: List[int]) -> MealResponseDTO
```

**Exceptions:**
- `MealSaveError` - Save operation failed
- `InvalidRecipeError` - Invalid recipe ID
- `MealNotFoundError` - Meal not found

**Constants:**
- `MAX_SIDE_RECIPES = 3`

### PlannerService

```python
class PlannerService:
    def __init__(self, session: Session):
        ...

    def get_all_entries(self, meal_id: int = None, completed: bool = None) -> List[PlannerEntryResponseDTO]
    def get_entry(self, entry_id: int) -> PlannerEntryResponseDTO
    def get_summary(self) -> PlannerSummaryDTO
    def get_meal_ids(self) -> List[int]
    def add_meal_to_planner(self, meal_id: int) -> PlannerEntryResponseDTO
    def add_meals_to_planner(self, meal_ids: List[int]) -> PlannerOperationResultDTO
    def reorder_entries(self, entry_ids: List[int]) -> PlannerOperationResultDTO
    def toggle_completion(self, entry_id: int) -> PlannerEntryResponseDTO
    def mark_completed(self, entry_id: int) -> PlannerEntryResponseDTO
    def mark_incomplete(self, entry_id: int) -> PlannerEntryResponseDTO
    def remove_entry(self, entry_id: int) -> None
    def remove_entries_by_meal(self, meal_id: int) -> PlannerOperationResultDTO
    def clear_planner(self) -> PlannerOperationResultDTO
    def clear_completed(self) -> PlannerOperationResultDTO
```

**Exceptions:**
- `PlannerFullError` - At capacity (15 entries)
- `InvalidMealError` - Meal doesn't exist

### ShoppingService

```python
class ShoppingService:
    def __init__(self, session: Session):
        ...

    def get_shopping_list(self, filters: ShoppingListFilterDTO) -> ShoppingListResponseDTO
    def add_manual_item(self, item_data: ManualItemCreateDTO) -> ShoppingItemResponseDTO
    def update_item(self, item_id: int, update_data: ShoppingItemUpdateDTO) -> ShoppingItemResponseDTO
    def toggle_item_status(self, item_id: int) -> ShoppingItemResponseDTO
    def delete_item(self, item_id: int) -> None
    def generate_shopping_list(self, generation_data: ShoppingListGenerationDTO) -> ShoppingListGenerationResultDTO
    def clear_shopping_list(self) -> BulkOperationResultDTO
    def clear_manual_items(self) -> BulkOperationResultDTO
    def clear_recipe_items(self) -> BulkOperationResultDTO
    def clear_completed_items(self) -> BulkOperationResultDTO
    def bulk_update_status(self, update_data: BulkStateUpdateDTO) -> BulkOperationResultDTO
    def get_ingredient_breakdown(self, recipe_ids: List[int]) -> List[IngredientBreakdownDTO]
```

### IngredientService

```python
class IngredientService:
    def __init__(self, session: Session):
        ...

    def create_ingredient(self, ingredient_data: IngredientCreateDTO) -> IngredientResponseDTO
    def bulk_create_ingredients(self, ingredients_data: List[IngredientCreateDTO]) -> List[IngredientResponseDTO]
    def get_ingredient_by_id(self, ingredient_id: int) -> IngredientResponseDTO
    def get_all_ingredients(self) -> List[IngredientResponseDTO]
    def search_ingredients(self, search_term: str, category: str = None) -> List[IngredientResponseDTO]
    def get_ingredients_by_category(self, category: str) -> List[IngredientResponseDTO]
    def update_ingredient(self, ingredient_id: int, update_data: IngredientUpdateDTO) -> IngredientResponseDTO
    def delete_ingredient(self, ingredient_id: int) -> None
    def get_ingredient_categories(self) -> List[str]
    def list_all_ingredient_names(self) -> List[str]
    def find_matching_ingredients(self, search_dto: IngredientSearchDTO) -> List[IngredientResponseDTO]
```

### DataManagementService

```python
class DataManagementService:
    def __init__(self, session: Session):
        ...

    def parse_xlsx(self, content: bytes) -> Tuple[List[RecipeImportRowDTO], List[ValidationErrorDTO]]
    def get_import_preview(self, recipes: List[RecipeImportRowDTO]) -> ImportPreviewDTO
    def execute_import(self, recipes: List[RecipeImportRowDTO], resolutions: List[DuplicateResolutionDTO]) -> ImportResultDTO
    def export_recipes_to_xlsx(self, filter_dto: ExportFilterDTO) -> bytes
    def generate_template_xlsx(self) -> bytes
```

**Duplicate Actions:**
- `SKIP` - Don't import
- `UPDATE` - Update existing recipe
- `RENAME` - Create new with different name

### ImageGenerationService

```python
class ImageGenerationService:
    def __init__(self):
        """Initialize with GEMINI_API_KEY from environment."""

    def generate_recipe_image(self, recipe_name: str) -> dict:
        """
        Generate an AI image for a recipe.

        Args:
            recipe_name: The name of the recipe to generate an image for.

        Returns:
            dict with 'success', 'image_data' (base64), and optional 'error'
        """

# Singleton accessor
def get_image_generation_service() -> ImageGenerationService:
    """Get the singleton instance of the image generation service."""
```

**Configuration:**
- Uses Google Gemini AI model `gemini-2.5-flash-image`
- Requires `GEMINI_API_KEY` environment variable
- Generates professional food photography style images
- Returns base64-encoded image data

**Exceptions:**
- Raises `ValueError` if `GEMINI_API_KEY` is not set

---

## DTOs (Data Transfer Objects)

All DTOs use Pydantic v2 with `ConfigDict(from_attributes=True)` for ORM compatibility.

### Recipe DTOs

```python
# Ingredient in recipe
class RecipeIngredientDTO(BaseModel):
    existing_ingredient_id: Optional[int] = None  # For linking to existing ingredient
    ingredient_name: str
    ingredient_category: str
    quantity: Optional[float] = None
    unit: Optional[str] = None

# Base recipe fields
class RecipeBaseDTO(BaseModel):
    recipe_name: str
    recipe_category: str
    meal_type: str = "Dinner"
    diet_pref: Optional[str] = None
    total_time: Optional[int] = None
    servings: Optional[int] = None
    directions: Optional[str] = None
    notes: Optional[str] = None
    reference_image_path: Optional[str] = None
    banner_image_path: Optional[str] = None

# Lightweight card for lists
class RecipeCardDTO(BaseModel):
    id: int
    recipe_name: str
    is_favorite: bool = False
    reference_image_path: Optional[str] = None
    servings: Optional[int] = None
    total_time: Optional[int] = None

    @classmethod
    def from_recipe(cls, recipe: Recipe) -> "RecipeCardDTO"
        """Convert a Recipe model to RecipeCardDTO."""

# Create request
class RecipeCreateDTO(RecipeBaseDTO):
    ingredients: List[RecipeIngredientDTO] = []

# Update request (all optional)
class RecipeUpdateDTO(BaseModel):
    recipe_name: Optional[str] = None
    recipe_category: Optional[str] = None
    meal_type: Optional[str] = None
    diet_pref: Optional[str] = None
    total_time: Optional[int] = None
    servings: Optional[int] = None
    directions: Optional[str] = None
    notes: Optional[str] = None
    reference_image_path: Optional[str] = None
    banner_image_path: Optional[str] = None
    ingredients: Optional[List[RecipeIngredientDTO]] = None
    is_favorite: Optional[bool] = None

# Full response
class RecipeResponseDTO(RecipeBaseDTO):
    id: int
    reference_image_path: Optional[str]
    banner_image_path: Optional[str]
    is_favorite: bool
    created_at: datetime
    ingredients: List[RecipeIngredientResponseDTO]

# Filter parameters
class RecipeFilterDTO(BaseModel):
    recipe_category: Optional[str] = None
    meal_type: Optional[str] = None
    diet_pref: Optional[str] = None
    cook_time: Optional[int] = None      # ge=0
    servings: Optional[int] = None       # ge=1
    sort_by: Optional[str] = None        # pattern: recipe_name|created_at|total_time|servings
    sort_order: Optional[str] = "asc"    # pattern: asc|desc
    favorites_only: bool = False
    search_term: Optional[str] = None
    limit: Optional[int] = None          # ge=1, le=100
    offset: Optional[int] = None         # ge=0
```

### Meal DTOs

```python
# Base meal fields
class MealBaseDTO(BaseModel):
    meal_name: str
    main_recipe_id: int
    side_recipe_ids: List[int] = []
    is_favorite: bool = False
    tags: List[str] = []

# Create request
class MealCreateDTO(MealBaseDTO):
    pass

# Update request (all optional)
class MealUpdateDTO(BaseModel):
    meal_name: Optional[str] = None
    main_recipe_id: Optional[int] = None
    side_recipe_ids: Optional[List[int]] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None

# Full response
class MealResponseDTO(MealBaseDTO):
    id: int
    created_at: datetime
    main_recipe: RecipeCardDTO

# Filter parameters
class MealFilterDTO(BaseModel):
    name_pattern: Optional[str] = None
    tags: Optional[List[str]] = None
    favorites_only: bool = False
    limit: int = 100
    offset: int = 0

# Deletion impact
class RecipeDeletionImpactDTO(BaseModel):
    recipe_id: int
    recipe_name: str
    affected_meals: List[MealResponseDTO]
    meals_to_delete: List[int]  # IDs of meals where this is main
    meals_to_update: List[int]  # IDs of meals where this is side
```

### Planner DTOs

```python
# Entry response
class PlannerEntryResponseDTO(BaseModel):
    id: int
    meal_id: int
    meal: MealResponseDTO
    position: int
    is_completed: bool
    completed_at: Optional[datetime]
    scheduled_date: Optional[date]

# Summary stats
class PlannerSummaryDTO(BaseModel):
    total_entries: int
    completed_entries: int
    pending_entries: int
    max_entries: int = 15
    available_slots: int

# Reorder request
class PlannerReorderDTO(BaseModel):
    entry_ids: List[int]

# Bulk add request
class PlannerBulkAddDTO(BaseModel):
    meal_ids: List[int]

# Operation result
class PlannerOperationResultDTO(BaseModel):
    success: bool
    message: str
    affected_count: int
```

### Shopping DTOs

```python
# Item response
class ShoppingItemResponseDTO(BaseModel):
    id: int
    ingredient_name: str
    quantity: float
    unit: Optional[str]
    category: Optional[str]
    source: str  # "recipe" or "manual"
    have: bool
    state_key: Optional[str]

# Manual item create
class ManualItemCreateDTO(BaseModel):
    ingredient_name: str
    quantity: float = 1.0
    unit: Optional[str] = None
    category: Optional[str] = None

# Item update
class ShoppingItemUpdateDTO(BaseModel):
    ingredient_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    have: Optional[bool] = None

# Full list response
class ShoppingListResponseDTO(BaseModel):
    items: List[ShoppingItemResponseDTO]
    total_items: int
    checked_items: int
    unchecked_items: int
    categories: List[str]

# Filter parameters
class ShoppingListFilterDTO(BaseModel):
    source: Optional[str] = None
    category: Optional[str] = None
    have: Optional[bool] = None
    search_term: Optional[str] = None
    limit: int = 100
    offset: int = 0

# Generation request
class ShoppingListGenerationDTO(BaseModel):
    recipe_ids: List[int]
    servings_multiplier: float = 1.0

# Ingredient breakdown
class IngredientBreakdownDTO(BaseModel):
    ingredient_name: str
    total_quantity: float
    unit: Optional[str]
    category: Optional[str]
    recipe_sources: List[IngredientBreakdownItemDTO]
```

### Ingredient DTOs

```python
# Base fields
class IngredientBaseDTO(BaseModel):
    ingredient_name: str
    ingredient_category: str

# Create request
class IngredientCreateDTO(IngredientBaseDTO):
    pass

# Update request
class IngredientUpdateDTO(BaseModel):
    ingredient_name: Optional[str] = None
    ingredient_category: Optional[str] = None

# Response
class IngredientResponseDTO(IngredientBaseDTO):
    id: int

# Search parameters
class IngredientSearchDTO(BaseModel):
    search_term: Optional[str] = None
    category: Optional[str] = None
    limit: int = 50

# Detail with quantity (for recipe ingredients)
class IngredientDetailDTO(BaseModel):
    id: int
    ingredient_name: str
    ingredient_category: str
    quantity: Optional[float]
    unit: Optional[str]

    def formatted_quantity(self) -> str:
        """Returns quantity as fraction (1/2, 1 1/4, etc.)"""

    def abbreviated_unit(self) -> str:
        """Returns abbreviated unit (tbsp, tsp, etc.)"""
```

### Data Management DTOs

```python
# Duplicate action enum
class DuplicateAction(str, Enum):
    SKIP = "SKIP"
    UPDATE = "UPDATE"
    RENAME = "RENAME"

# Import row from xlsx
class RecipeImportRowDTO(BaseModel):
    row_number: int
    recipe_name: str
    recipe_category: str
    meal_type: Optional[str]
    diet_pref: Optional[str]
    total_time: Optional[int]
    servings: Optional[int]
    directions: Optional[str]
    notes: Optional[str]
    ingredients: List[RecipeIngredientDTO]

# Duplicate found
class DuplicateRecipeDTO(BaseModel):
    row: int
    recipe_name: str
    category: str
    existing_id: int

# Validation error
class ValidationErrorDTO(BaseModel):
    row: int
    field: str
    message: str

# Import preview
class ImportPreviewDTO(BaseModel):
    total_recipes: int
    new_recipes: int
    duplicate_recipes: List[DuplicateRecipeDTO]
    validation_errors: List[ValidationErrorDTO]

# Duplicate resolution
class DuplicateResolutionDTO(BaseModel):
    row: int
    action: DuplicateAction
    new_name: Optional[str] = None  # Required for RENAME

# Import result
class ImportResultDTO(BaseModel):
    created_count: int
    updated_count: int
    skipped_count: int
    errors: List[ValidationErrorDTO]

# Export filter
class ExportFilterDTO(BaseModel):
    category: Optional[str] = None
    meal_type: Optional[str] = None
    favorites_only: bool = False
```

### Image Generation DTOs

```python
# Request for AI image generation
class ImageGenerationRequestDTO(BaseModel):
    recipe_name: str

# Response from image generation
class ImageGenerationResponseDTO(BaseModel):
    success: bool
    image_data: Optional[str] = None  # Base64 encoded image data
    error: Optional[str] = None
```

---

## Database Configuration

### Connection Setup (`db.py`)

```python
# Default SQLite
SQLALCHEMY_DATABASE_URL = os.getenv(
    "SQLALCHEMY_DATABASE_URL",
    "sqlite:///./app/core/database/app_data.db"
)

# Engine configuration
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

# Enable foreign keys for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

### Session Management

```python
# FastAPI dependency injection
def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

# Manual session creation
def create_session() -> Session:
    return SessionLocal()

# Context manager
class DatabaseSession:
    def __enter__(self) -> Session:
        self.session = SessionLocal()
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()
```

### PostgreSQL Support

Set environment variable for PostgreSQL:

```bash
SQLALCHEMY_DATABASE_URL=postgresql://user:password@localhost:5432/mealgenie
```

### Alembic Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

**Migration History:**
1. `create_recipe_tables` - Initial recipe schema
2. `add_ingredient_recipeingredient` - Ingredients
3. `updates_to_relationships` - Relationship updates
4. `rename_default_image_path` - Image path rename
5. `add_shopping_and_meal_planning` - Shopping & planning
6. `update_recipe_image_paths` - Dual images
7. `refactor_meals_and_planner` - Meals and planner refactor
8. `add_notes_field` - Add notes field

---

## Error Handling

### Custom Exceptions

```python
# Recipe errors
class RecipeSaveError(Exception):
    """Raised when recipe save fails"""

class DuplicateRecipeError(Exception):
    """Raised when recipe already exists"""

# Meal errors
class MealSaveError(Exception):
    """Raised when meal save fails"""

class InvalidRecipeError(Exception):
    """Raised when recipe ID is invalid"""

class MealNotFoundError(Exception):
    """Raised when meal is not found"""

# Planner errors
class PlannerFullError(Exception):
    """Raised when planner is at capacity"""

class InvalidMealError(Exception):
    """Raised when meal ID is invalid"""
```

### HTTP Error Responses

```python
from fastapi import HTTPException

# 400 Bad Request
raise HTTPException(status_code=400, detail="Invalid input")

# 404 Not Found
raise HTTPException(status_code=404, detail="Recipe not found")

# 409 Conflict
raise HTTPException(status_code=409, detail="Recipe already exists")

# 422 Unprocessable Entity
# Automatic for Pydantic validation errors

# 500 Internal Server Error
raise HTTPException(status_code=500, detail="Database error")
```

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

For validation errors:
```json
{
  "detail": [
    {
      "loc": ["body", "recipe_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Scripts & Utilities

### Seed Database (`scripts/seed_database.py`)

Generates realistic sample data for development.

**Usage:**
```bash
# Replace all data
python scripts/seed_database.py --mode replace

# Append data
python scripts/seed_database.py --mode append --count 10

# Recipes only
python scripts/seed_database.py --recipes-only

# Verbose output
python scripts/seed_database.py --verbose
```

**Seeded Data:**
- 400+ ingredients across 10 categories
- 25+ complete recipes with:
  - Full ingredient lists
  - Detailed directions
  - Notes and cooking times
  - Categories (Italian, Indian, Mexican, Asian, Mediterranean, etc.)
  - Meal types (Dinner, Lunch, Breakfast)
  - Dietary preferences (Gluten-Free, Vegan, Vegetarian)

### List Recipes (`scripts/list_recipes.py`)

Utility to list recipes in the database.

```bash
python scripts/list_recipes.py
```

---

## Development Guide

### Project Conventions

**Architecture:**
- Clean architecture with separation of concerns
- Routes → Services → Repositories → Models
- DTOs for all API boundaries

**Naming:**
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

**Code Style:**
- Type hints on all function signatures
- Docstrings for public methods
- Pydantic for data validation

### Adding a New Feature

1. **Create Model** (`core/models/`)
   ```python
   class NewFeature(Base):
       __tablename__ = "new_features"
       id = Column(Integer, primary_key=True)
       name = Column(String, nullable=False)
   ```

2. **Create DTOs** (`core/dtos/`)
   ```python
   class NewFeatureCreateDTO(BaseModel):
       name: str

   class NewFeatureResponseDTO(BaseModel):
       id: int
       name: str
       model_config = ConfigDict(from_attributes=True)
   ```

3. **Create Repository** (`core/repositories/`)
   ```python
   class NewFeatureRepo:
       def __init__(self, session: Session):
           self.session = session

       def create(self, dto: NewFeatureCreateDTO) -> NewFeature:
           feature = NewFeature(name=dto.name)
           self.session.add(feature)
           self.session.commit()
           return feature
   ```

4. **Create Service** (`core/services/`)
   ```python
   class NewFeatureService:
       def __init__(self, session: Session):
           self.repo = NewFeatureRepo(session)

       def create(self, dto: NewFeatureCreateDTO) -> NewFeatureResponseDTO:
           feature = self.repo.create(dto)
           return NewFeatureResponseDTO.model_validate(feature)
   ```

5. **Create Routes** (`api/`)
   ```python
   router = APIRouter(prefix="/api/new-features", tags=["New Features"])

   @router.post("/", response_model=NewFeatureResponseDTO)
   def create_feature(
       dto: NewFeatureCreateDTO,
       session: Session = Depends(get_session)
   ):
       service = NewFeatureService(session)
       return service.create(dto)
   ```

6. **Register Router** (`main.py`)
   ```python
   from app.api import new_features
   app.include_router(new_features.router)
   ```

7. **Create Migration**
   ```bash
   alembic revision --autogenerate -m "add new_features table"
   alembic upgrade head
   ```

### Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_meal_and_planner.py

# Run with coverage
pytest --cov=app

# Verbose output
pytest -v
```

### Common Patterns

**Dependency Injection:**
```python
@router.get("/{id}")
def get_item(
    id: int,
    session: Session = Depends(get_session)
):
    service = ItemService(session)
    return service.get(id)
```

**Transaction Management:**
```python
def create_with_relations(self, dto):
    try:
        item = Item(**dto.model_dump())
        self.session.add(item)
        self.session.flush()  # Get ID before commit

        for relation in dto.relations:
            self.session.add(Relation(item_id=item.id, **relation))

        self.session.commit()
        return item
    except Exception:
        self.session.rollback()
        raise
```

**Filtering Pattern:**
```python
def filter_items(self, filter_dto: FilterDTO) -> List[Item]:
    query = self.session.query(Item)

    if filter_dto.category:
        query = query.filter(Item.category == filter_dto.category)

    if filter_dto.search_term:
        query = query.filter(Item.name.ilike(f"%{filter_dto.search_term}%"))

    query = query.order_by(
        getattr(Item, filter_dto.sort_by).desc()
        if filter_dto.sort_direction == "desc"
        else getattr(Item, filter_dto.sort_by).asc()
    )

    return query.offset(filter_dto.offset).limit(filter_dto.limit).all()
```

---

## Constraints & Limits

| Feature | Limit |
|---------|-------|
| Planner Entries | 15 max |
| Side Recipes per Meal | 3 max |
| Meal Tags | 20 max, 50 chars each |
| Recipe Name | 255 chars |
| Ingredient Name | 255 chars |
| Import File Size | 10MB max |
| Pagination Limit | 100 items max |

---

## API Quick Reference

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Recipes | `/api/recipes` | GET, POST |
| Recipe | `/api/recipes/{id}` | GET, PUT, DELETE |
| Recipe Cards | `/api/recipes/cards` | GET |
| Meals | `/api/meals` | GET, POST |
| Meal | `/api/meals/{id}` | GET, PUT, DELETE |
| Planner | `/api/planner/entries` | GET, POST |
| Planner Entry | `/api/planner/entries/{id}` | GET, DELETE |
| Shopping | `/api/shopping` | GET |
| Shopping Item | `/api/shopping/items/{id}` | GET, PATCH, DELETE |
| Ingredients | `/api/ingredients` | GET, POST |
| Ingredient | `/api/ingredients/{id}` | GET, PUT, DELETE |
| Import | `/api/data-management/import/*` | POST |
| Export | `/api/data-management/export` | GET |
| Upload | `/api/upload` | POST, DELETE |
| Image Generation | `/api/generate-image` | POST |
| Feedback | `/api/feedback` | POST |

---

## Feedback API

Submit user feedback as GitHub Issues. Requires GitHub integration to be configured via environment variables.

### Configuration

Set the following environment variables:

```bash
GITHUB_TOKEN=github_pat_xxxxx    # Fine-grained personal access token with Issues read/write
GITHUB_REPO=username/repo-name   # Repository to create issues in
```

### Submit Feedback

```http
POST /api/feedback
```

**Request Body:** `FeedbackCreateDTO`
```json
{
  "category": "Feature Request",
  "message": "It would be great to have a dark mode toggle in the settings."
}
```

**Category Options:**
- `Feature Request` → Creates issue with `enhancement` label
- `Bug Report` → Creates issue with `bug` label
- `General Feedback` → Creates issue with `feedback` label
- `Question` → Creates issue with `question` label

**Response:** `FeedbackResponseDTO`
```json
{
  "success": true,
  "issue_url": "https://github.com/username/repo/issues/123",
  "message": "Thank you for your feedback! It has been submitted successfully."
}
```

**Error Response:**
```json
{
  "success": false,
  "issue_url": null,
  "message": "Feedback submission is not configured. Please contact the administrator."
}
```

### Feedback DTOs

```python
class FeedbackCreateDTO(BaseModel):
    category: str       # 1-50 characters
    message: str        # 10-5000 characters

class FeedbackResponseDTO(BaseModel):
    success: bool
    issue_url: Optional[str]
    message: str
```
