# Meal Genie AI Assistant Redesign (MGA Refactor)

## Overview
Implementing the comprehensive MGA refactor from `mga_refactor.md`:
- New "kitchen bestie" personality system prompt
- Gemini function calling (replacing delimiter-based JSON parsing)
- Conditional context loading (ingredients/shopping list only when needed)
- Single unified `/chat` endpoint
- Frontend updates for new flow

---

## Phase 1: Backend Configuration
- [x] **1.1** Replace `meal_genie_config.py` with new system prompt and function definitions
  - New `BASE_SYSTEM_PROMPT` with warm personality guidelines
  - Add `TOOL_DEFINITIONS` for Gemini function calling (`suggest_recipes`, `create_recipe`, `answer_cooking_question`)
  - Add `build_user_context_prompt()` function
  - Add `get_full_system_prompt()` function
  - Add keyword detection functions (`should_include_ingredients`, `should_include_shopping_list`)

## Phase 2: Backend Service
- [x] **2.1** Update `user_context_builder.py`
  - Add `include_ingredients` parameter support
  - Add recipe ingredient fetching with `_get_recipe_ingredients()`
  - Limit saved recipes to 30 (favorites + 20 recent) to prevent context bloat

- [x] **2.2** Rewrite `meal_genie_service.py` with function calling
  - New `chat()` method as single entry point
  - Implement `_build_context()` with conditional loading
  - Implement `_build_contents()` for conversation history
  - Implement `_process_response()` to handle function calls
  - Implement `_handle_function_call()` with immediate generation loop for suggestions
  - Implement `_generate_recipe_from_args()` with JSON response mode

## Phase 3: Backend API
- [x] **3.1** Add `/chat` endpoint to `meal_genie.py` router
  - Single unified endpoint that uses new service
  - Keyword detection for context loading flags
  - Image generation for recipes
  - Keep `/ask` as backwards-compatible alias

## Phase 4: Frontend Updates
- [x] **4.1** Update `api.ts` - Add `chat()` method to `mealGenieApi`
  - New method pointing to `/api/ai/meal-genie/chat`
  - Keep `ask()` as alias for backwards compatibility

- [x] **4.2** Update `MealGenieChatContent.tsx`
  - Switch to using new `chat()` API method
  - Handle unified response (chat, suggestions, or recipe)
  - Simplified flow - AI decides what to do

## Phase 5: Testing & Cleanup
- [ ] **5.1** Manual testing of key flows
  - Test: "dinner ideas?" → suggestions with personality
  - Test: "let's do the [recipe]" → recipe generation
  - Test: "how do I know when salmon is done?" → cooking question
  - Test conversation memory across turns

- [ ] **5.2** Cleanup (after successful testing)
  - Remove legacy `<<<RECIPE_JSON>>>` delimiter handling
  - Remove `/generate-recipe` endpoint (or keep as legacy)
  - Remove old tool-based routing in config

---

## Review

### Summary of Changes

**Architecture Change:** Replaced delimiter-based JSON parsing (`<<<RECIPE_JSON>>>`) with Gemini's native function calling API. The AI now explicitly declares its intent via function calls (`suggest_recipes`, `create_recipe`, `answer_cooking_question`), making routing deterministic.

### Files Modified

1. **`backend/app/ai/config/meal_genie_config.py`** - Complete rewrite
   - New "kitchen bestie" personality prompt (~180 lines)
   - `TOOL_DEFINITIONS` for Gemini function calling (3 tools)
   - `build_user_context_prompt()` for structured context formatting
   - Keyword detection functions for conditional context loading

2. **`backend/app/ai/services/user_context_builder.py`** - Enhanced
   - New `build_context_data()` returns structured dict
   - `_get_saved_recipes()` now limits to 30 (favorites + 20 recent)
   - `_get_recipe_ingredients()` for ingredient-based queries
   - Legacy methods preserved for backwards compatibility

3. **`backend/app/ai/services/meal_genie_service.py`** - Major rewrite
   - New `chat()` method as unified entry point
   - Function calling with `tools` config and `AUTO` mode
   - "Classifier-Generator" pattern for suggestions (prevents null responses)
   - `_generate_recipe_from_args()` with JSON response mode
   - Legacy methods preserved for backwards compatibility

4. **`backend/app/api/ai/meal_genie.py`** - New endpoint
   - New `/chat` endpoint with context-aware loading
   - `/ask` redirects to `/chat` for backwards compatibility
   - `/generate-recipe` updated to use new service

5. **`frontend/src/lib/api.ts`** - New method
   - New `chat()` method pointing to `/api/ai/meal-genie/chat`
   - `ask()` kept as deprecated alias
   - `generateRecipe()` marked as deprecated

6. **`frontend/src/components/meal-genie/MealGenieChatContent.tsx`** - Minor update
   - Changed `mealGenieApi.ask()` to `mealGenieApi.chat()`

### Key Features

- **Warm Personality:** "Kitchen bestie" tone with natural interjections and emojis
- **Smart Routing:** AI chooses tools via function calling (AUTO mode)
- **Context Efficiency:** Ingredients/shopping list loaded only when relevant
- **Recipe Limiting:** Max 30 recipes in context (favorites prioritized)
- **JSON Guarantee:** Recipe generation uses `response_mime_type: "application/json"`
- **Backwards Compatible:** Legacy endpoints and methods still work

### Testing Recommendations

Test these flows per the spec's Testing Guide (Section 9):
1. "dinner ideas?" → Should trigger `suggest_recipes`, return 4-6 ideas
2. "let's do the tuscan chicken" → Should trigger `create_recipe`, return recipe JSON
3. "how do I know when salmon is done?" → Should trigger `answer_cooking_question`
4. Conversation memory across multiple turns
5. Personality check with stressed message ("ugh I have no idea what to make")

---

## Notes
- Using `gemini-3-flash-preview` model
- Temperature: 0.8 for personality variety
- Function calling in AUTO mode lets Gemini decide when to use tools
- Immediate generation loop prevents null responses from suggest_recipes
