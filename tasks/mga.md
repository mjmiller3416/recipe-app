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
- [ ] **1.1** Replace `meal_genie_config.py` with new system prompt and function definitions
  - New `BASE_SYSTEM_PROMPT` with warm personality guidelines
  - Add `TOOL_DEFINITIONS` for Gemini function calling (`suggest_recipes`, `create_recipe`, `answer_cooking_question`)
  - Add `build_user_context_prompt()` function
  - Add `get_full_system_prompt()` function
  - Add keyword detection functions (`should_include_ingredients`, `should_include_shopping_list`)

## Phase 2: Backend Service
- [ ] **2.1** Update `user_context_builder.py`
  - Add `include_ingredients` parameter support
  - Add recipe ingredient fetching with `_get_recipe_ingredients()`
  - Limit saved recipes to 30 (favorites + 20 recent) to prevent context bloat

- [ ] **2.2** Rewrite `meal_genie_service.py` with function calling
  - New `chat()` method as single entry point
  - Implement `_build_context()` with conditional loading
  - Implement `_build_contents()` for conversation history
  - Implement `_process_response()` to handle function calls
  - Implement `_handle_function_call()` with immediate generation loop for suggestions
  - Implement `_generate_recipe_from_args()` with JSON response mode

## Phase 3: Backend API
- [ ] **3.1** Add `/chat` endpoint to `meal_genie.py` router
  - Single unified endpoint that uses new service
  - Keyword detection for context loading flags
  - Image generation for recipes
  - Keep `/ask` as backwards-compatible alias

## Phase 4: Frontend Updates
- [ ] **4.1** Update `api.ts` - Add `chat()` method to `mealGenieApi`
  - New method pointing to `/api/ai/meal-genie/chat`
  - Keep `ask()` as alias for backwards compatibility

- [ ] **4.2** Update `MealGenieChatContent.tsx`
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
*To be filled after implementation*

---

## Notes
- Using `gemini-3-flash-preview` model
- Temperature: 0.8 for personality variety
- Function calling in AUTO mode lets Gemini decide when to use tools
- Immediate generation loop prevents null responses from suggest_recipes
