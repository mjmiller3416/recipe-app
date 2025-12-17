"""app/core/dtos/meal_dtos.py

Pydantic DTOs for meal operations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .recipe_dtos import RecipeCardDTO


# ── Base DTOs ───────────────────────────────────────────────────────────────────────────────────────────────
class MealBaseDTO(BaseModel):
    """Base DTO for meal operations."""

    model_config = ConfigDict(from_attributes=True)

    meal_name: str = Field(..., min_length=1, max_length=255)
    main_recipe_id: int = Field(..., ge=1)
    side_recipe_ids: List[int] = Field(default_factory=list, max_length=3)
    is_favorite: bool = Field(default=False)
    tags: List[str] = Field(default_factory=list)

    @field_validator('side_recipe_ids')
    @classmethod
    def validate_side_recipe_ids(cls, v: List[int]) -> List[int]:
        """Ensure side recipe IDs are unique and within limit."""
        if len(v) > 3:
            raise ValueError('Maximum 3 side recipes allowed')
        if len(v) != len(set(v)):
            raise ValueError('Duplicate side recipe IDs not allowed')
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Strip whitespace from tags."""
        return [tag.strip() for tag in v if tag.strip()]


# ── Create DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class MealCreateDTO(MealBaseDTO):
    """DTO for creating a new meal."""
    pass


# ── Update DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class MealUpdateDTO(BaseModel):
    """DTO for updating an existing meal."""

    model_config = ConfigDict(from_attributes=True)

    meal_name: Optional[str] = Field(None, min_length=1, max_length=255)
    main_recipe_id: Optional[int] = Field(None, ge=1)
    side_recipe_ids: Optional[List[int]] = Field(None, max_length=3)
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None

    @field_validator('side_recipe_ids')
    @classmethod
    def validate_side_recipe_ids(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        """Ensure side recipe IDs are unique and within limit."""
        if v is None:
            return v
        if len(v) > 3:
            raise ValueError('Maximum 3 side recipes allowed')
        if len(v) != len(set(v)):
            raise ValueError('Duplicate side recipe IDs not allowed')
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Strip whitespace from tags."""
        if v is None:
            return v
        return [tag.strip() for tag in v if tag.strip()]


# ── Response DTO ────────────────────────────────────────────────────────────────────────────────────────────
class MealResponseDTO(MealBaseDTO):
    """DTO for meal responses with full details."""

    id: int
    created_at: datetime
    main_recipe: Optional[RecipeCardDTO] = None
    side_recipes: List[RecipeCardDTO] = Field(default_factory=list)

    @classmethod
    def from_meal(cls, meal, main_recipe=None, side_recipes=None):
        """Create response DTO from meal model with optional recipe details."""
        return cls(
            id=meal.id,
            meal_name=meal.meal_name,
            main_recipe_id=meal.main_recipe_id,
            side_recipe_ids=meal.side_recipe_ids,
            is_favorite=meal.is_favorite,
            tags=meal.tags,
            created_at=meal.created_at,
            main_recipe=main_recipe,
            side_recipes=side_recipes or []
        )


# ── Filter DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class MealFilterDTO(BaseModel):
    """DTO for filtering meals."""

    model_config = ConfigDict(from_attributes=True)

    name_pattern: Optional[str] = None
    tags: Optional[List[str]] = None  # AND logic: meal must have all specified tags
    is_favorite: Optional[bool] = None
    main_recipe_id: Optional[int] = None
    contains_recipe_id: Optional[int] = None  # In main or sides
    limit: Optional[int] = Field(None, ge=1, le=100)
    offset: Optional[int] = Field(None, ge=0)

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Strip whitespace from tags."""
        if v is None:
            return v
        return [tag.strip() for tag in v if tag.strip()]


# ── Deletion Impact DTO ─────────────────────────────────────────────────────────────────────────────────────
class MealDeletionImpactDTO(BaseModel):
    """DTO for meal deletion impact information."""

    model_config = ConfigDict(from_attributes=True)

    meal_id: int
    meal_name: str
    planner_entries_count: int
    in_active_planner: bool


# ── Side Recipe Operations ──────────────────────────────────────────────────────────────────────────────────
class MealSideRecipeAddDTO(BaseModel):
    """DTO for adding a side recipe to a meal."""

    model_config = ConfigDict(from_attributes=True)

    recipe_id: int = Field(..., ge=1)


class MealSideRecipeReorderDTO(BaseModel):
    """DTO for reordering side recipes in a meal."""

    model_config = ConfigDict(from_attributes=True)

    side_recipe_ids: List[int] = Field(..., max_length=3)

    @field_validator('side_recipe_ids')
    @classmethod
    def validate_side_recipe_ids(cls, v: List[int]) -> List[int]:
        """Ensure side recipe IDs are unique."""
        if len(v) != len(set(v)):
            raise ValueError('Duplicate side recipe IDs not allowed')
        return v


# ── Tag Operations ──────────────────────────────────────────────────────────────────────────────────────────
class MealTagAddDTO(BaseModel):
    """DTO for adding a tag to a meal."""

    model_config = ConfigDict(from_attributes=True)

    tag: str = Field(..., min_length=1, max_length=50)

    @field_validator('tag')
    @classmethod
    def validate_tag(cls, v: str) -> str:
        """Strip whitespace from tag."""
        return v.strip()
