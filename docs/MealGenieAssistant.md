# Meal Genie Assistant

> A conversational AI cooking assistant powered by Google Gemini that helps users with cooking tips, recipe suggestions, and full recipe generation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Backend](#backend)
  - [API Endpoints](#api-endpoints)
  - [Service Layer](#service-layer)
  - [Configuration](#configuration)
  - [DTOs](#dtos)
- [Frontend](#frontend)
  - [Components](#components)
  - [API Client](#api-client)
  - [Types](#types)
- [Data Flow](#data-flow)
- [Recipe Generation](#recipe-generation)
- [User Context](#user-context)
- [Future Extensibility](#future-extensibility)

---

## Overview

Meal Genie is an AI-powered cooking assistant integrated into the Recipe App. It provides:

- **Conversational chat** for cooking tips, techniques, and troubleshooting
- **Recipe suggestions** based on ingredients or preferences
- **Full recipe generation** with AI-generated images
- **Personalized responses** using the user's saved recipes, meal plans, and shopping lists

### Key Features

| Feature | Description |
|---------|-------------|
| Natural conversation | Multi-turn chat with memory of previous messages |
| Recipe awareness | Checks user's saved recipes before suggesting new ones |
| Smart context | Only loads shopping list when user explicitly references it |
| Image generation | Automatically generates recipe images (1:1 and 21:9 formats) |
| Responsive UI | Mobile sheet drawer / Desktop floating popup |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐                   │
│  │ MealGeniePopup  │───▶│MealGenieChatContent│                 │
│  │ (Wrapper)       │    │   (Chat UI)       │                  │
│  └─────────────────┘    └────────┬─────────┘                   │
│                                  │                              │
│                         ┌────────▼─────────┐                   │
│                         │   mealGenieApi   │                   │
│                         │ (API Client)     │                   │
│                         └────────┬─────────┘                   │
└──────────────────────────────────┼──────────────────────────────┘
                                   │ HTTP POST
┌──────────────────────────────────┼──────────────────────────────┐
│                         BACKEND  │                              │
│                                  │                              │
│                         ┌────────▼─────────┐                   │
│                         │   meal_genie.py  │                   │
│                         │   (API Router)   │                   │
│                         └────────┬─────────┘                   │
│                                  │                              │
│  ┌───────────────────┐  ┌───────▼──────────┐  ┌──────────────┐│
│  │UserContextBuilder │◀─│MealGenieService  │─▶│ Gemini API   ││
│  │(Builds context)   │  │ (AI Logic)       │  │ (Google AI)  ││
│  └───────────────────┘  └───────┬──────────┘  └──────────────┘│
│                                 │                              │
│                         ┌───────▼──────────┐                   │
│                         │ImageGenService   │                   │
│                         │(Recipe Images)   │                   │
│                         └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend

### API Endpoints

**Base path:** `/api/ai/meal-genie`

#### `POST /ask`

Send a message to Meal Genie and receive an AI response. The AI may automatically generate a recipe if the user asks for one.

**Request Body:**
```typescript
{
  message: string;                    // User's message
  conversation_history?: {            // Previous messages (optional)
    role: "user" | "assistant";
    content: string;
  }[];
}
```

**Response:**
```typescript
{
  success: boolean;
  response?: string;                  // AI's text response
  recipe?: GeneratedRecipeDTO;        // Recipe data (if generated)
  reference_image_data?: string;      // Base64 image (1:1 square)
  banner_image_data?: string;         // Base64 image (21:9 ultrawide)
  error?: string;
}
```

#### `POST /generate-recipe`

Explicitly request recipe generation with the `recipe_create` tool.

**Request Body:**
```typescript
{
  message: string;
  conversation_history?: MealGenieMessage[];
  generate_image?: boolean;           // Default: true
}
```

**Response:**
```typescript
{
  success: boolean;
  recipe?: GeneratedRecipeDTO;
  reference_image_data?: string;
  banner_image_data?: string;
  ai_message?: string;                // Friendly message from AI
  needs_more_info: boolean;           // True if AI is asking questions
  error?: string;
}
```

**File:** [meal_genie.py](../backend/app/api/ai/meal_genie.py)

---

### Service Layer

#### `MealGenieService`

Core service class that interacts with the Google Gemini API.

**Methods:**

| Method | Description |
|--------|-------------|
| `ask()` | Send a message and get a response using specified tool |
| `generate_recipe()` | Generate a recipe using the `recipe_create` tool |
| `_extract_recipe_json()` | Parse recipe JSON from delimited response |
| `_extract_ai_message()` | Extract friendly message outside JSON block |

**Singleton Pattern:**
```python
from app.ai.services import get_meal_genie_service

service = get_meal_genie_service()
result = service.ask(message="What can I make with chicken?")
```

**File:** [meal_genie_service.py](../backend/app/ai/services/meal_genie_service.py)

---

### Configuration

#### Model Settings

| Setting | Value |
|---------|-------|
| Model | `gemini-3-flash-preview` |
| API Key Env Var | `GEMINI_ASSISTANT_API_KEY` |

#### System Prompt

The AI personality is defined as "Meal Genie" - a warm, clever cooking spirit with these characteristics:

- **Tone:** Friendly kitchen mentor, concise (2-4 sentences typically)
- **Style:** Confident recommendations, natural kitchen language
- **Behavior:** Checks saved recipes first, avoids repetitive questions

#### Tools

Currently enabled tools:

| Tool | Description |
|------|-------------|
| `chat` | General cooking assistant (tips, substitutions, suggestions) |
| `recipe_create` | Generate complete recipes with structured JSON output |

Future tools (placeholders):
- `recipe_search` - Search user's saved recipes
- `meal_planning` - Suggest meals based on schedule
- `substitutions` - Ingredient substitutions from pantry
- `pantry_recipes` - Recipes based on pantry contents

**File:** [meal_genie_config.py](../backend/app/ai/config/meal_genie_config.py)

---

### DTOs

#### `MealGenieMessageDTO`
```python
class MealGenieMessageDTO(BaseModel):
    role: Literal["user", "assistant"]
    content: str
```

#### `GeneratedRecipeDTO`
```python
class GeneratedRecipeDTO(BaseModel):
    recipe_name: str
    recipe_category: str      # beef|chicken|pork|seafood|vegetarian|other
    meal_type: str            # appetizer|breakfast|lunch|dinner|dessert|side|snack|sauce|other
    diet_pref: Optional[str]  # none|vegan|gluten-free|dairy-free|keto|paleo|low-carb|diabetic
    total_time: Optional[int]
    servings: Optional[int]
    directions: Optional[str]
    notes: Optional[str]
    ingredients: List[GeneratedIngredientDTO]
```

#### `GeneratedIngredientDTO`
```python
class GeneratedIngredientDTO(BaseModel):
    ingredient_name: str       # Title Case (e.g., "Chicken Breast")
    ingredient_category: str   # produce|dairy|deli|meat|condiments|oils-and-vinegars|seafood|pantry|spices|frozen|bakery|baking|beverages|other
    quantity: Optional[float]
    unit: Optional[str]        # tbs|tsp|cup|oz|lbs|stick|bag|box|can|jar|package|piece|slice|whole|pinch|dash|to-taste
```

**File:** [meal_genie_dtos.py](../backend/app/ai/dtos/meal_genie_dtos.py)

---

## Frontend

### Components

#### `MealGeniePopup`

Wrapper component that handles responsive display:

- **Mobile (< 768px):** Bottom sheet drawer using Shadcn `Sheet` component
- **Desktop:** Floating popup with minimize/expand animation
  - Minimized: 56px circular button with animated sparkles icon
  - Expanded: 384x500px chat window

**Props:**
```typescript
interface MealGeniePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**File:** [MealGeniePopup.tsx](../frontend/src/components/meal-genie/MealGeniePopup.tsx)

---

#### `MealGenieChatContent`

The main chat interface used by both mobile and desktop views.

**Features:**
- Message history with role-based styling (user bubbles vs assistant bubbles)
- Auto-scroll to latest message
- Fade indicators for scrollable content
- Loading state with pulsing sparkles animation
- "View Recipe Draft" button when recipe is generated
- Suggestion buttons for empty state
- Clear history button

**Props:**
```typescript
interface MealGenieChatContentProps {
  onClose: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
  isMobile?: boolean;
}
```

**Suggestion Buttons:**
1. "What can I make with chicken?"
2. "Quick weeknight dinner ideas"
3. "Help me plan meals for the week"

**File:** [MealGenieChatContent.tsx](../frontend/src/components/meal-genie/MealGenieChatContent.tsx)

---

#### `AskMealGenieWidget`

Standalone widget version (exported from `MealGenieAssistant.tsx`). Can be embedded directly in pages without the popup wrapper.

**File:** [MealGenieAssistant.tsx](../frontend/src/components/meal-genie/MealGenieAssistant.tsx)

---

### API Client

```typescript
import { mealGenieApi } from "@/lib/api";

// Send a chat message
const response = await mealGenieApi.ask(
  "What can I make with chicken?",
  conversationHistory  // optional
);

// Generate a recipe
const recipe = await mealGenieApi.generateRecipe(
  "Make me a quick pasta dish",
  conversationHistory,
  true  // generateImage
);
```

**File:** [api.ts](../frontend/src/lib/api.ts) (lines 805-844)

---

### Types

TypeScript interfaces mirror the backend DTOs:

```typescript
// Message in conversation
interface MealGenieMessage {
  role: "user" | "assistant";
  content: string;
}

// Chat response
interface MealGenieResponseDTO {
  success: boolean;
  response?: string;
  recipe?: GeneratedRecipeDTO;
  reference_image_data?: string;
  banner_image_data?: string;
  error?: string;
}

// Generated recipe structure
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

**File:** [types/index.ts](../frontend/src/types/index.ts) (lines 580-648)

---

## Data Flow

### Chat Flow

```
1. User types message in MealGenieChatContent
2. handleSubmit() called
3. mealGenieApi.ask() sends POST to /api/ai/meal-genie/ask
4. Backend builds user context (saved recipes, meal plan, optionally shopping list)
5. MealGenieService.ask() calls Gemini API with system prompt + context
6. Response parsed for recipe JSON (if present)
7. If recipe found, images are generated via ImageGenerationService
8. Response returned to frontend
9. Message displayed in chat
10. If recipe present, "View Recipe Draft" button appears
```

### Recipe Handoff Flow

```
1. User clicks "View Recipe Draft" button
2. Recipe data stored in sessionStorage (key: "meal-genie-generated-recipe")
3. Router navigates to /recipes/add?from=ai
4. useRecipeForm hook reads from sessionStorage
5. Recipe form pre-populated with AI-generated data
6. User can edit and save the recipe
```

---

## Recipe Generation

### JSON Format

The AI outputs recipes wrapped in special delimiters:

```
<<<RECIPE_JSON>>>
{
  "recipe_name": "Honey Garlic Chicken",
  "recipe_category": "chicken",
  "meal_type": "dinner",
  ...
}
<<<END_RECIPE_JSON>>>

Here's your delicious honey garlic chicken recipe! The key is...
```

The service extracts JSON using regex and parses the friendly message separately.

### Duplicate Prevention

Before generating a recipe, the AI checks the user's saved recipes. If a recipe with the same name exists, it:
1. Acknowledges the existing recipe
2. Offers to suggest a variation with a different name

---

## User Context

The `UserContextBuilder` class constructs context for the AI:

### Always Included
- User's saved recipes (names and categories)
- Current meal plan
- User's favorite recipes

### Conditionally Included
Shopping list is only included when the user's message contains keywords like:
- "shopping list"
- "what i have"
- "ingredients i have"
- "use what i have"
- "from my list"

This optimization prevents unnecessary context loading.

**File:** [user_context_builder.py](../backend/app/ai/services/user_context_builder.py)

---

## Future Extensibility

The configuration is designed for easy addition of new tools:

```python
# In meal_genie_config.py
TOOLS = {
    "chat": { ... },          # Currently enabled
    "recipe_create": { ... }, # Currently enabled

    # Future tools (uncomment when ready):
    # "recipe_search": { ... },
    # "meal_planning": { ... },
    # "substitutions": { ... },
    # "pantry_recipes": { ... },
}
```

Each tool can have:
- `enabled`: Boolean flag
- `description`: What the tool does
- `system_prompt_extension`: Additional prompt instructions
- `requires_context`: What user data is needed

---

## File Reference

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/ai/meal_genie.py` | API router with endpoints |
| `backend/app/ai/services/meal_genie_service.py` | Core AI service |
| `backend/app/ai/config/meal_genie_config.py` | Prompts and configuration |
| `backend/app/ai/dtos/meal_genie_dtos.py` | Request/response DTOs |
| `backend/app/ai/services/user_context_builder.py` | User context builder |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/components/meal-genie/MealGeniePopup.tsx` | Popup wrapper (responsive) |
| `frontend/src/components/meal-genie/MealGenieChatContent.tsx` | Chat interface |
| `frontend/src/components/meal-genie/MealGenieAssistant.tsx` | Widget component |
| `frontend/src/components/meal-genie/index.ts` | Barrel exports |
| `frontend/src/lib/api.ts` | API client methods |
| `frontend/src/types/index.ts` | TypeScript interfaces |
| `frontend/src/hooks/useChatHistory.ts` | Chat history hook |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_ASSISTANT_API_KEY` | Google Gemini API key for Meal Genie |

---

## Session Storage Keys

| Key | Description |
|-----|-------------|
| `meal-genie-generated-recipe` | Stores AI-generated recipe for handoff to recipe form |
