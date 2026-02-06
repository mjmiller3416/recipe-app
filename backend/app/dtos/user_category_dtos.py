"""app/dtos/user_category_dtos.py

Pydantic DTOs for user category operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# -- Response DTO --------------------------------------------------------------------------------
class UserCategoryResponseDTO(BaseModel):
    """DTO for user category responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    value: str
    label: str
    is_custom: bool
    is_enabled: bool
    position: int

    @classmethod
    def from_model(cls, category) -> "UserCategoryResponseDTO":
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
class UserCategoryCreateDTO(BaseModel):
    """DTO for creating a new custom category."""

    model_config = ConfigDict(from_attributes=True)

    label: str = Field(..., min_length=1, max_length=50)

    @field_validator("label", mode="before")
    @classmethod
    def strip_label(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# -- Update DTO ----------------------------------------------------------------------------------
class UserCategoryUpdateDTO(BaseModel):
    """DTO for updating an existing category."""

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
class UserCategoryReorderDTO(BaseModel):
    """DTO for reordering categories."""

    model_config = ConfigDict(from_attributes=True)

    ordered_ids: List[int] = Field(..., min_length=1)


# -- Bulk Update DTOs ----------------------------------------------------------------------------
class UserCategoryBulkItemDTO(BaseModel):
    """Single item in a bulk update."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_enabled: bool
    position: int


class UserCategoryBulkUpdateDTO(BaseModel):
    """DTO for bulk updating categories."""

    model_config = ConfigDict(from_attributes=True)

    categories: List[UserCategoryBulkItemDTO] = Field(..., min_length=1)


__all__ = [
    "UserCategoryResponseDTO",
    "UserCategoryCreateDTO",
    "UserCategoryUpdateDTO",
    "UserCategoryReorderDTO",
    "UserCategoryBulkItemDTO",
    "UserCategoryBulkUpdateDTO",
]
