"""app/core/dtos/ingredient_dtos.py

Pydantic DTOs for ingredient operations and data transfer.
Handles ingredient creation, updates, searching, and responses.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Base DTOs ───────────────────────────────────────────────────────────────────────────────────────────────
class IngredientBaseDTO(BaseModel):
    """Base DTO for ingredient operations."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str = Field(..., min_length=1)
    ingredient_category: str = Field(..., min_length=1)

    @field_validator("ingredient_name", "ingredient_category", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

# ── Create DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class IngredientCreateDTO(IngredientBaseDTO):
    """DTO for creating a new ingredient."""
    pass

# ── Update DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class IngredientUpdateDTO(BaseModel):
    """DTO for updating an existing ingredient."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: Optional[str] = Field(None, min_length=1)
    ingredient_category: Optional[str] = Field(None, min_length=1)

    @field_validator("ingredient_name", "ingredient_category", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str) and v:
            return v.strip()
        return v

# ── Response DTO ────────────────────────────────────────────────────────────────────────────────────────────
class IngredientResponseDTO(IngredientBaseDTO):
    """DTO for ingredient responses."""

    id: int

# ── Search DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class IngredientSearchDTO(BaseModel):
    """DTO for searching ingredients."""

    model_config = ConfigDict(from_attributes=True)

    search_term: str = Field(..., min_length=1)
    category: Optional[str] = None
    limit: Optional[int] = Field(None, ge=1, le=100)
    offset: Optional[int] = Field(None, ge=0)

# ── Detail DTO ──────────────────────────────────────────────────────────────────────────────────────────────
class IngredientDetailDTO(BaseModel):
    """DTO for ingredient details with quantity information."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str
    ingredient_category: str
    quantity: Optional[float] = None
    unit: Optional[str] = None

    @property
    def formatted_quantity(self) -> str:
        """Return quantity formatted as fractions/whole numbers."""
        if self.quantity is None:
            return ""

        from ..utils.format_utils import format_quantity
        return format_quantity(self.quantity)

    @property
    def abbreviated_unit(self) -> str:
        """Return unit in abbreviated form."""
        if self.unit is None:
            return ""

        from ..utils.format_utils import abbreviate_unit
        return abbreviate_unit(self.unit)
