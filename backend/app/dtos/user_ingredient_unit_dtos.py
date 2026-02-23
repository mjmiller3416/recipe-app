"""app/dtos/user_ingredient_unit_dtos.py

Pydantic DTOs for user ingredient unit operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# -- Response DTO --------------------------------------------------------------------------------
class UserIngredientUnitResponseDTO(BaseModel):
    """DTO for user ingredient unit responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    value: str
    label: str
    unit_type: str
    is_custom: bool
    is_enabled: bool
    position: int

    @classmethod
    def from_model(cls, unit) -> "UserIngredientUnitResponseDTO":
        """Create DTO from model instance."""
        return cls(
            id=unit.id,
            value=unit.value,
            label=unit.label,
            unit_type=unit.unit_type,
            is_custom=unit.is_custom,
            is_enabled=unit.is_enabled,
            position=unit.position,
        )


# -- Create DTO ----------------------------------------------------------------------------------
class UserIngredientUnitCreateDTO(BaseModel):
    """DTO for creating a new custom ingredient unit."""

    model_config = ConfigDict(from_attributes=True)

    label: str = Field(..., min_length=1, max_length=50)

    @field_validator("label", mode="before")
    @classmethod
    def strip_label(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# -- Update DTO ----------------------------------------------------------------------------------
class UserIngredientUnitUpdateDTO(BaseModel):
    """DTO for updating an existing ingredient unit."""

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
class UserIngredientUnitReorderDTO(BaseModel):
    """DTO for reordering ingredient units."""

    model_config = ConfigDict(from_attributes=True)

    ordered_ids: List[int] = Field(..., min_length=1)


# -- Bulk Update DTOs ----------------------------------------------------------------------------
class UserIngredientUnitBulkItemDTO(BaseModel):
    """Single item in a bulk update."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_enabled: bool
    position: int


class UserIngredientUnitBulkUpdateDTO(BaseModel):
    """DTO for bulk updating ingredient units."""

    model_config = ConfigDict(from_attributes=True)

    units: List[UserIngredientUnitBulkItemDTO] = Field(..., min_length=1)


__all__ = [
    "UserIngredientUnitResponseDTO",
    "UserIngredientUnitCreateDTO",
    "UserIngredientUnitUpdateDTO",
    "UserIngredientUnitReorderDTO",
    "UserIngredientUnitBulkItemDTO",
    "UserIngredientUnitBulkUpdateDTO",
]
