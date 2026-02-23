"""DTOs for meal-specific AI suggestions."""

from pydantic import BaseModel
from typing import Optional


class MealSuggestionsRequestDTO(BaseModel):
    """Request for meal-specific cooking tip."""

    main_recipe_name: str
    main_recipe_category: Optional[str] = None  # e.g., "chicken", "beef"
    meal_type: Optional[str] = None  # e.g., "dinner"


class MealSuggestionsResponseDTO(BaseModel):
    """Response with a cooking tip for the meal."""

    success: bool
    cooking_tip: Optional[str] = None  # A tip specific to this meal
    error: Optional[str] = None
