"""AI API routers for Meal Genie."""

from .cooking_tips import router as cooking_tips_router
from .meal_genie import router as meal_genie_router
from .image_generation import router as image_generation_router

__all__ = [
    "cooking_tips_router",
    "meal_genie_router",
    "image_generation_router",
]
