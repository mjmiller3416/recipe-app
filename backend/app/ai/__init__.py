"""AI module for Meal Genie - contains all AI-powered services."""

from .services import (
    CookingTipService,
    get_cooking_tip_service,
    MealGenieService,
    get_meal_genie_service,
    ImageGenerationService,
    get_image_generation_service,
)
from .dtos import (
    CookingTipResponseDTO,
    MealGenieMessageDTO,
    MealGenieRequestDTO,
    MealGenieResponseDTO,
    ImageGenerationRequestDTO,
    ImageGenerationResponseDTO,
)

__all__ = [
    # Services
    "CookingTipService",
    "get_cooking_tip_service",
    "MealGenieService",
    "get_meal_genie_service",
    "ImageGenerationService",
    "get_image_generation_service",
    # DTOs
    "CookingTipResponseDTO",
    "MealGenieMessageDTO",
    "MealGenieRequestDTO",
    "MealGenieResponseDTO",
    "ImageGenerationRequestDTO",
    "ImageGenerationResponseDTO",
]
