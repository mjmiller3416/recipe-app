"""app/dtos/user_ingredient_category_dtos.py

Pydantic DTOs for user ingredient category operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# -- Response DTO --------------------------------------------------------------------------------
class UserIngredientCategoryResponseDTO(BaseModel):
    """DTO for user ingredient category responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    value: str
    label: str
    is_custom: bool
    is_enabled: bool
    position: int

    @classmethod
    def from_model(cls, category) -> "UserIngredientCategoryResponseDTO":
        """Create DTO from model instance."""
        return cls(
            id=category.id,
            value=category.value,
            label=category.label,
            is_custom=category.is_custom,
            is_enabled=category.is_enabled,
            position=category.position,
        )


# -- Create DTO ----------------------------------------------------------------------------------
class UserIngredientCategoryCreateDTO(BaseModel):
    """DTO for creating a new custom ingredient category."""

    model_config = ConfigDict(from_attributes=True)

    label: str = Field(..., min_length=1, max_length=50)

    @field_validator("label", mode="before")
    @classmethod
    def strip_label(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# -- Update DTO ----------------------------------------------------------------------------------
class UserIngredientCategoryUpdateDTO(BaseModel):
    """DTO for updating an existing ingredient category."""

    model_config = ConfigDict(from_attributes=True)

    label: Optional[str] = Field(None, min_length=1, max_length=50)
    is_enabled: Optional[bool] = None

    @field_validator("label", mode="before")
    @classmethod
    def strip_label(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# -- Reorder DTO ---------------------------------------------------------------------------------
class UserIngredientCategoryReorderDTO(BaseModel):
    """DTO for reordering ingredient categories."""

    model_config = ConfigDict(from_attributes=True)

    ordered_ids: List[int] = Field(..., min_length=1)


# -- Bulk Update DTOs ----------------------------------------------------------------------------
class UserIngredientCategoryBulkItemDTO(BaseModel):
    """Single item in a bulk update."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_enabled: bool
    position: int


class UserIngredientCategoryBulkUpdateDTO(BaseModel):
    """DTO for bulk updating ingredient categories."""

    model_config = ConfigDict(from_attributes=True)

    categories: List[UserIngredientCategoryBulkItemDTO] = Field(..., min_length=1)


__all__ = [
    "UserIngredientCategoryResponseDTO",
    "UserIngredientCategoryCreateDTO",
    "UserIngredientCategoryUpdateDTO",
    "UserIngredientCategoryReorderDTO",
    "UserIngredientCategoryBulkItemDTO",
    "UserIngredientCategoryBulkUpdateDTO",
]
