"""app/core/dtos/planner_dtos.py

Pydantic DTOs for meal planning and selection operations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from .recipe_dtos import RecipeCardDTO

# Ensure Recipe is available at runtime for forward references
"""DTO for meal selection responses with full recipe information is simplified to include only ID."""


# ── Base DTOs ───────────────────────────────────────────────────────────────────────────────────────────────
class MealSelectionBaseDTO(BaseModel):
    """Base DTO for meal selection operations."""

    model_config = ConfigDict(from_attributes=True)

    meal_name: str = Field(..., min_length=1, max_length=255)
    main_recipe_id: int = Field(..., ge=1)
    side_recipe_1_id: Optional[int] = Field(None, ge=1)
    side_recipe_2_id: Optional[int] = Field(None, ge=1)
    side_recipe_3_id: Optional[int] = Field(None, ge=1)

# ── Create DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class MealSelectionCreateDTO(MealSelectionBaseDTO):
    """DTO for creating a new meal selection."""
    pass

# ── Update DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class MealSelectionUpdateDTO(BaseModel):
    """DTO for updating an existing meal selection."""

    model_config = ConfigDict(from_attributes=True)

    meal_name: Optional[str] = Field(None, min_length=1, max_length=255)
    main_recipe_id: Optional[int] = Field(None, ge=1)
    side_recipe_1_id: Optional[int] = Field(None, ge=1)
    side_recipe_2_id: Optional[int] = Field(None, ge=1)
    side_recipe_3_id: Optional[int] = Field(None, ge=1)

# ── Response DTO ────────────────────────────────────────────────────────────────────────────────────────────
class MealSelectionResponseDTO(MealSelectionBaseDTO):
    """DTO for meal selection responses with full recipe information."""

    id: int
    main_recipe: Optional[RecipeCardDTO] = None
    side_recipe_1: Optional[RecipeCardDTO] = None
    side_recipe_2: Optional[RecipeCardDTO] = None
    side_recipe_3: Optional[RecipeCardDTO] = None

# ── Filter DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class MealSelectionFilterDTO(BaseModel):
    """DTO for filtering meal selections."""

    model_config = ConfigDict(from_attributes=True)

    meal_name_pattern: Optional[str] = None
    main_recipe_id: Optional[int] = None
    contains_recipe_id: Optional[int] = None
    limit: Optional[int] = Field(None, ge=1, le=100)
    offset: Optional[int] = Field(None, ge=0)

# ── Summary DTO ─────────────────────────────────────────────────────────────────────────────────────────────
class MealPlanSummaryDTO(BaseModel):
    """DTO for meal plan summary information."""

    model_config = ConfigDict(from_attributes=True)

    total_meals: int
    total_recipes: int
    meal_names: list[str]
    has_saved_plan: bool
    error: Optional[str] = None

# ── Validation Result DTO ───────────────────────────────────────────────────────────────────────────────────
class MealPlanValidationDTO(BaseModel):
    """DTO for meal plan validation results."""

    model_config = ConfigDict(from_attributes=True)

    is_valid: bool
    valid_ids: list[int]
    invalid_meal_ids: list[int]
    total_meals: int
    total_valid: int
    error: Optional[str] = None

# ── Save Result DTO ─────────────────────────────────────────────────────────────────────────────────────────
class MealPlanSaveResultDTO(BaseModel):
    """DTO for meal plan save operation results."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    saved_count: int
    invalid_ids: list[int]
    message: str
