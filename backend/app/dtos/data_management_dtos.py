"""app/core/dtos/data_management_dtos.py

Pydantic DTOs for data management operations (import/export).
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .recipe_dtos import RecipeIngredientDTO


# ── Enums ───────────────────────────────────────────────────────────────────────────────────────────────────
class DuplicateAction(str, Enum):
    """Action to take when a duplicate recipe is found during import."""
    SKIP = "skip"
    UPDATE = "update"
    RENAME = "rename"


# ── Import DTOs ─────────────────────────────────────────────────────────────────────────────────────────────
class RecipeImportRowDTO(BaseModel):
    """Single recipe row parsed from xlsx import."""

    model_config = ConfigDict(from_attributes=True)

    recipe_name: str = Field(..., min_length=1)
    recipe_category: str = Field(..., min_length=1)
    meal_type: str = Field(default="Dinner", min_length=1)
    diet_pref: Optional[str] = None
    total_time: Optional[int] = Field(None, ge=0)
    servings: Optional[int] = Field(None, ge=1)
    directions: Optional[str] = None
    notes: Optional[str] = None
    ingredients: List[RecipeIngredientDTO] = []

    @field_validator("recipe_name", "recipe_category", "meal_type", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class DuplicateRecipeDTO(BaseModel):
    """Info about a duplicate recipe found during import."""

    model_config = ConfigDict(from_attributes=True)

    recipe_name: str
    recipe_category: str
    existing_id: int
    row_number: int


class ValidationErrorDTO(BaseModel):
    """Validation error for a specific row during import."""

    model_config = ConfigDict(from_attributes=True)

    row_number: int
    field: str
    message: str


class ImportPreviewDTO(BaseModel):
    """Preview of what will happen during import."""

    model_config = ConfigDict(from_attributes=True)

    total_recipes: int
    new_recipes: int
    duplicate_recipes: List[DuplicateRecipeDTO]
    validation_errors: List[ValidationErrorDTO]


class ImportResultDTO(BaseModel):
    """Result after import completes."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    created_count: int
    updated_count: int
    skipped_count: int
    errors: List[str]


class DuplicateResolutionDTO(BaseModel):
    """User's choice for handling a specific duplicate recipe."""

    model_config = ConfigDict(from_attributes=True)

    recipe_name: str
    recipe_category: str
    action: DuplicateAction
    new_name: Optional[str] = None  # Required if action is RENAME

    @field_validator("new_name", mode="before")
    @classmethod
    def strip_new_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


class ImportExecuteDTO(BaseModel):
    """Request to execute import with duplicate resolutions."""

    model_config = ConfigDict(from_attributes=True)

    resolutions: List[DuplicateResolutionDTO] = []


# ── Export DTOs ─────────────────────────────────────────────────────────────────────────────────────────────
class ExportFilterDTO(BaseModel):
    """Filter criteria for recipe export."""

    model_config = ConfigDict(from_attributes=True)

    recipe_category: Optional[str] = None
    meal_type: Optional[str] = None
    favorites_only: bool = False
