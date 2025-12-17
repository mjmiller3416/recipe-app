"""app/core/dtos/meal_dtos.py

Pydantic DTOs for meal operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

if TYPE_CHECKING:
    from ..models.recipe import Recipe

from .recipe_dtos import RecipeCardDTO


# -- Base DTO ------------------------------------------------------------------------------------
class MealBaseDTO(BaseModel):
    """Base DTO for meal operations."""

    model_config = ConfigDict(from_attributes=True)

    meal_name: str = Field(..., min_length=1, max_length=255)
    main_recipe_id: int = Field(..., ge=1)
    side_recipe_ids: List[int] = Field(default_factory=list, max_length=3)
    is_favorite: bool = False
    tags: List[str] = Field(default_factory=list)

    @field_validator("meal_name", mode="before")
    @classmethod
    def strip_meal_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("side_recipe_ids", mode="before")
    @classmethod
    def validate_side_recipes(cls, v):
        if v is None:
            return []
        if len(v) > 3:
            raise ValueError("Maximum of 3 side recipes allowed")
        return v


# -- Create DTO ----------------------------------------------------------------------------------
class MealCreateDTO(MealBaseDTO):
    """DTO for creating a new meal."""
    pass


# -- Update DTO ----------------------------------------------------------------------------------
class MealUpdateDTO(BaseModel):
    """DTO for updating an existing meal."""

    model_config = ConfigDict(from_attributes=True)

    meal_name: Optional[str] = Field(None, min_length=1, max_length=255)
    main_recipe_id: Optional[int] = Field(None, ge=1)
    side_recipe_ids: Optional[List[int]] = Field(None, max_length=3)
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None

    @field_validator("meal_name", mode="before")
    @classmethod
    def strip_meal_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("side_recipe_ids", mode="before")
    @classmethod
    def validate_side_recipes(cls, v):
        if v is None:
            return None
        if len(v) > 3:
            raise ValueError("Maximum of 3 side recipes allowed")
        return v


# -- Response DTO --------------------------------------------------------------------------------
class MealResponseDTO(MealBaseDTO):
    """DTO for meal responses with full recipe information."""

    id: int
    created_at: Optional[str] = None  # ISO format datetime string
    main_recipe: Optional[RecipeCardDTO] = None


# -- Filter DTO ----------------------------------------------------------------------------------
class MealFilterDTO(BaseModel):
    """DTO for filtering meals."""

    model_config = ConfigDict(from_attributes=True)

    name_pattern: Optional[str] = None
    tags: Optional[List[str]] = None
    favorites_only: bool = False
    limit: Optional[int] = Field(None, ge=1, le=100)
    offset: Optional[int] = Field(None, ge=0)


# -- Recipe Deletion Impact DTO ------------------------------------------------------------------
class RecipeDeletionImpactDTO(BaseModel):
    """DTO for showing the impact of deleting a recipe on meals."""

    model_config = ConfigDict(from_attributes=True)

    recipe_id: int
    meals_to_delete: List[MealResponseDTO] = Field(
        default_factory=list,
        description="Meals that will be deleted (recipe is their main)"
    )
    meals_to_update: List[MealResponseDTO] = Field(
        default_factory=list,
        description="Meals that will have this recipe removed from sides"
    )
    total_affected: int = 0


# Re-export RecipeCardDTO for convenience
__all__ = [
    "MealBaseDTO",
    "MealCreateDTO",
    "MealUpdateDTO",
    "MealResponseDTO",
    "MealFilterDTO",
    "RecipeDeletionImpactDTO",
    "RecipeCardDTO",
]
