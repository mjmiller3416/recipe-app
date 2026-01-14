"""DTOs for AI services."""

from .cooking_tip_dtos import CookingTipResponseDTO
from .image_generation_dtos import ImageGenerationRequestDTO, ImageGenerationResponseDTO
from .meal_genie_dtos import (
    MealGenieMessageDTO,
    MealGenieRequestDTO,
    MealGenieResponseDTO,
    GeneratedIngredientDTO,
    GeneratedRecipeDTO,
    RecipeGenerationRequestDTO,
    RecipeGenerationResponseDTO,
)
from .meal_suggestions_dtos import (
    MealSuggestionsRequestDTO,
    MealSuggestionsResponseDTO,
)

__all__ = [
    "CookingTipResponseDTO",
    "ImageGenerationRequestDTO",
    "ImageGenerationResponseDTO",
    "MealGenieMessageDTO",
    "MealGenieRequestDTO",
    "MealGenieResponseDTO",
    "GeneratedIngredientDTO",
    "GeneratedRecipeDTO",
    "RecipeGenerationRequestDTO",
    "RecipeGenerationResponseDTO",
    "MealSuggestionsRequestDTO",
    "MealSuggestionsResponseDTO",
]
