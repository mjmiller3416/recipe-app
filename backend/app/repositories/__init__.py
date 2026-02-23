# app/core/repositories/__init__.py
"""
Repository layer - data access and persistence.

Repositories are imported directly from their modules to avoid circular dependencies:
    from app.repositories.recipe_repo import RecipeRepo

Do NOT add eager imports here - they can cause circular import issues
when modules cross-reference between repositories and services.
"""

__all__ = [
    "FeedbackRepo",
    "RecipeRepo",
    "IngredientRepo",
    "MealRepo",
    "PlannerRepo",
    "ShoppingRepo",
    "UserRepo",
]
