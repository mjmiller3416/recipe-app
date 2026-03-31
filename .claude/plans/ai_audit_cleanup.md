# AI Audit / Cleanup Plan

## Summary
The AI services have accumulated a number of code quality issues over time, including duplicated parsing logic, inconsistent enums, and some dead code. This plan outlines a comprehensive audit and cleanup effort to address these issues in a structured way, improving maintainability and reducing the risk of bugs.

### Issue 1 — _safe_int / _safe_float are copy-pasted between two services
*Location: wizard_generation/service.py lines ~210–228 and nutrition_estimation/service.py lines ~110–124.*

Byte-for-byte identical implementations. Both define module-level `_safe_int` and `_safe_float` private helpers. These belong in *response_utils.py* (or a new *parse_utils.py*) as public functions. This is also the only thing `nutrition_estimation` uses from the wizard's module pattern — it shouldn't be duplicating it.

> Fix: Move to *parse_utils.py* (preferred, since *response_utils.py* already has a clear Gemini-response-parsing responsibility — type casting is a different concern). Export as `safe_int` / `safe_float`.

### Issue 2 — Nutrition parsing logic duplicated
*Location: wizard_generation/service.py → _parse_nutrition(data: dict) and nutrition_estimation/service.py → inline nutrition dict → NutritionFactsDTO construction.*

Both take the same dict shape and construct the same NutritionFactsDTO. Wizard has this as a named static method; nutrition estimation re-implements it inline with the same _safe_int / _safe_float calls. The new url_import service will need this a third time.

> Fix: Extract to `parse_utils.parse_nutrition_dict(data: dict) → NutritionFactsDTO`. Both existing services import and call it.

### Issue 3 — Recipe parsing duplicated between wizard and assistant
*Location: wizard_generation/service.py → _parse_recipe(data: dict) and assistant/generators.py → _generate_recipe_from_args() inline.*

Both deserialize the same JSON shape into a recipe DTO. The only difference is the output type — wizard uses WizardGeneratedRecipeDTO, assistant uses GeneratedRecipeDTO. When you look at these two DTOs side by side, GeneratedRecipeDTO is just a strict subset of WizardGeneratedRecipeDTO — it's missing description, prep_time, cook_time, and difficulty. The assistant silently drops those fields during generation.

This is both a duplication issue and a data fidelity issue — if the assistant generates a recipe with prep/cook times, they get thrown away because the DTO can't hold them.

> Fix: Two-part. First, retire GeneratedRecipeDTO and have the assistant use RecipeGeneratedDTO instead (it already has all the fields — this is the renamed WizardGeneratedRecipeDTO from Phase 2). Second, extract `parse_utils.parse_recipe_dict(data: dict) → RecipeGeneratedDTO` and use it in both services. url_import will use this exact same function.

### Issue 4 — recipe_category enum is hardcoded but should be user-defined
This one is more consequential than it first appears. The wizard prompt hardcodes 10 category values and the assistant hardcodes 6 different ones — but the deeper problem isn't the mismatch between services, it's that neither should be hardcoded at all.

Recipe categories are user-configured at runtime. The app already supports built-in defaults that can be toggled, plus fully custom user-created categories. A static enum in a prompt can never reflect that — it will always be out of sync for any user who has customized their list, and it means a recipe generated with categories like "Weeknight Meals" or "Testing 123" would fall back to "other" because the AI was never told those were valid options.

Additionally, the free-text cuisine field in the AI generation preferences panel was serving double duty as both a style hint and a category hint — that ambiguity is resolved by replacing it with the same Category dropdown used in manual entry, pulling from the user's enabled categories directly.

> Fix:
> * Remove `cuisine` from WizardGenerationPreferencesDTO (soon RecipeGenerationPreferencesDTO), replace with `category: Optional[str]`
> * Add `allowed_categories: list[str]` to the request DTO
> * At the API layer, fetch the user's enabled categories before calling the service and pass them in — same pattern as how user context is already fetched for the assistant
> * In the prompt template, replace the hardcoded enum with dynamic interpolation: `recipe_category must be one of: {"|".join(allowed_categories)}`
> * On the frontend, replace the free-text Cuisine field in the AI generation preferences panel with the same Category dropdown component used in manual entry, pulling from the user's enabled categories

No recipe_constants.py needed — the source of truth is the user's settings, not a file.

### Issue 5 — Nutrition estimation uses a fragile JSON regex
*Location: nutrition_estimation/service.py → re.search(r"\{[^}]+\}", raw_text, re.DOTALL)*

This regex matches from the first { to the first }. It will fail silently on any JSON that contains nested objects — and NutritionFactsDTO fields are all at the top level, so it happens to work right now, but it's one field change away from breaking.

Meanwhile `wizard_generation` and the assistant recipe generator both use `response_mime_type: "application/json"` in the Gemini config, which forces clean JSON output and makes the regex unnecessary entirely.

> Fix: Add `response_mime_type: "application/json"` to the nutrition estimation call and remove the regex. Consistent with how the other JSON-producing calls already work.

### Issue 6 — Dead import in wizard_generation/service.py
Line 1 of the generate() method: from google.genai import types — imported but never used. The config dict is used instead (config={...}), which is correct and the pattern you should be using everywhere.

Secondary: `cooking_tips` and `nutrition_estimation` still use `types.GenerateContentConfig(...)` for their call config. Both patterns work but this will be standardized to dict config when those services are flattened in Phase 3 — no separate action needed.

### Issue 7 — Dead legacy code in user_context_builder.py
The class has two parallel APIs. The modern one (`build_context_data()`) is what *assistant.py* actually calls (confirmed in the API layer). The legacy string-based one — `build_context()`, `_build_recipes_context()`, `_build_meal_plan_context()`, `_build_shopping_context()` — is never called from anywhere in the API layer. That's roughly 50 lines that exist purely to confuse future maintainers.

> Fix: Delete the four legacy methods. If nothing calls them, they're gone. `build_context_data()` is the real API.

## Overall Structure Issues
In addition to the specific issues above, there are some broader structure and naming issues that make the codebase harder to navigate and maintain:
- The recipe generation logic is split between two services (`wizard_generation` and `assistant/generators`) with different DTOs and parsing logic. This should be consolidated into a single recipe_generation service with a shared DTO and parsing function.
- The cooking tips, nutrition estimation, and assistant suggestions services all have their own subdirectories with a single service.py file inside. This is overkill for such small services and adds unnecessary nesting. They should be flattened to *cooking_tips.py*, *nutrition_estimation.py*, and *meal_suggestions.py* (also renaming assistant_suggestions to meal_suggestions for clarity and consistency).

## Action Plan
This is a multi-phase plan to audit and clean up the AI services. Each phase builds on the previous one, so they should be done in order. The audit numbers correspond to the issues outlined above.

### Phase 1: Shared Parsing Utilities
- [x] Create parse_utils.py — New file in services/ai/ — audit #1
- [x] Move safe_int / safe_float into it — Remove from wizard_generation and nutrition_estimation — audit #1
- [x] Add parse_nutrition_dict() to parse_utils — Extract from wizard, replace inline version in nutrition estimation — audit #2

**Phase 1 is complete. Here's a summary of what was done:**

**Created:** `parse_utils.py` — new shared module with:
- `safe_int()` / `safe_float()` — type coercion helpers (public, no underscore prefix)
- `parse_nutrition_dict()` — constructs NutritionFactsDTO from a raw AI response dict

**Updated:**
- `wizard_generation/service.py` — removed `_safe_int`, `_safe_float`, and `_parse_nutrition`; imports `safe_int` and `parse_nutrition_dict` from parse_utils
- `nutrition_estimation/service.py` — removed `_safe_int`, `_safe_float`, and inline NutritionFactsDTO construction; imports `parse_nutrition_dict` from parse_utils
- Both test files updated to import from parse_utils instead of service-level private functions

**Not changed (intentionally out of scope):**
- The fragile JSON regex in nutrition_estimation (audit #5, Phase 4)
- The `from google.genai import types` dead import in wizard (audit #6, Phase 4)
- The `types.GenerateContentConfig(...)` pattern in nutrition_estimation (Phase 3 standardization)

**Test results:** 63/63 tests passing, zero regressions.

### Phase 2: Rename & Consolidate Recipe Generation
- [ ] Rename wizard_generation/ → recipe_generation/ — Update all imports across api, services, tests — naming
- [ ] Rename DTOs — drop Wizard prefix — WizardGeneratedRecipeDTO → RecipeGeneratedDTO, etc. — naming
- [ ] Add parse_recipe_dict() to parse_utils — Extract from (now renamed) recipe generation service — audit #3
- [ ] Retire GeneratedRecipeDTO from assistant — Replace with RecipeGeneratedDTO everywhere — audit #3
- [ ] Replace _generate_recipe_from_args() in assistant — Delete inline generation, call get_recipe_generation_service() instead — audit #3
- [ ] Update request DTO — Remove cuisine, add category: Optional[str] and allowed_categories: list[str] — audit #4
- [ ] Fetch and inject user categories at the API layer — Same pattern as user context for the assistant — audit #4
- [ ] Replace hardcoded enum in prompt template with dynamic interpolation from allowed_categories — audit #4
- [ ] Frontend: replace free-text Cuisine field with Category dropdown in AI generation preferences panel — audit #4

### Phase 3: Flatten Small Services
- [ ] Flatten cooking_tips/ → cooking_tips.py — Fold config constants into top of file, standardize to dict config, delete subdirectory — structure + audit #6
- [ ] Flatten nutrition_estimation/ → nutrition_estimation.py — Fold config constants into top of file, standardize to dict config, delete subdirectory — structure + audit #6
- [ ] Flatten + rename assistant_suggestions/ → meal_suggestions.py — Fix directory/class/DTO name inconsistency in one pass — structure

### Phase 4: Cleanup
- [ ] Fix nutrition estimation JSON parsing — Remove regex, add response_mime_type: "application/json" — audit #5
- [ ] Remove dead from google.genai import types — Unused import in recipe_generation/service.py — audit #6
- [ ] Delete legacy methods from user_context_builder.py — Remove build_context() and 3 private _build_* methods — audit #7