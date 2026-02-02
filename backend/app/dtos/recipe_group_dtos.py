"""app/dtos/recipe_group_dtos.py

Pydantic DTOs for recipe group operations.
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# -- Base DTO ------------------------------------------------------------------------------------
class RecipeGroupBaseDTO(BaseModel):
    """Base DTO for recipe group operations."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# -- Create DTO ----------------------------------------------------------------------------------
class RecipeGroupCreateDTO(RecipeGroupBaseDTO):
    """DTO for creating a new recipe group."""
    pass


# -- Update DTO ----------------------------------------------------------------------------------
class RecipeGroupUpdateDTO(BaseModel):
    """DTO for updating an existing recipe group."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v


# -- Response DTO --------------------------------------------------------------------------------
class RecipeGroupResponseDTO(RecipeGroupBaseDTO):
    """DTO for recipe group responses."""

    id: int
    created_at: Optional[str] = None  # ISO format datetime string
    recipe_count: int = 0  # Number of recipes in this group

    @classmethod
    def from_model(cls, group, recipe_count: int = 0):
        """Create DTO from model instance."""
        return cls(
            id=group.id,
            name=group.name,
            created_at=group.created_at.isoformat() if group.created_at else None,
            recipe_count=recipe_count,
        )


# -- Assignment DTO ------------------------------------------------------------------------------
class RecipeGroupAssignmentDTO(BaseModel):
    """DTO for assigning/removing recipes to/from groups."""

    model_config = ConfigDict(from_attributes=True)

    group_ids: list[int] = Field(default_factory=list)


__all__ = [
    "RecipeGroupBaseDTO",
    "RecipeGroupCreateDTO",
    "RecipeGroupUpdateDTO",
    "RecipeGroupResponseDTO",
    "RecipeGroupAssignmentDTO",
]
