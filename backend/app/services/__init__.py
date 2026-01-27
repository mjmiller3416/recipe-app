# app/core/services/__init__.py
"""
Service layer - business logic and orchestration.

Services are imported directly from their modules to avoid circular dependencies:
    from app.services.recipe_service import RecipeService

Do NOT add eager imports here - they cause circular import issues
when repositories import services (e.g., shopping_repo -> unit_conversion_service).
"""

__all__ = [
    "RecipeService",
    "RecipeSaveError",
    "DuplicateRecipeError",
    "IngredientService",
    "MealService",
    "MealSaveError",
    "MealNotFoundError",
    "InvalidRecipeError",
    "PlannerService",
    "PlannerFullError",
    "InvalidMealError",
    "EntryNotFoundError",
    "ShoppingService",
    "UserService",
    "UsageService",
]
