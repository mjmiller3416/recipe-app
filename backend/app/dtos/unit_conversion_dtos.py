"""app/core/dtos/unit_conversion_dtos.py

Pydantic DTOs for unit conversion rule operations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Base DTO ───────────────────────────────────────────────────────────────────────────────────────────────
class UnitConversionRuleBaseDTO(BaseModel):
    """Base DTO for unit conversion rule operations."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str = Field(..., min_length=1)
    from_unit: str = Field(..., min_length=1)
    to_unit: str = Field(..., min_length=1)
    factor: float = Field(..., gt=0)
    round_up: bool = Field(default=True)

    @field_validator("ingredient_name", "from_unit", "to_unit", mode="before")
    @classmethod
    def strip_and_lower(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v


# ── Create DTO ─────────────────────────────────────────────────────────────────────────────────────────────
class UnitConversionRuleCreateDTO(UnitConversionRuleBaseDTO):
    """DTO for creating a new unit conversion rule."""
    pass


# ── Update DTO ─────────────────────────────────────────────────────────────────────────────────────────────
class UnitConversionRuleUpdateDTO(BaseModel):
    """DTO for updating an existing unit conversion rule."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: Optional[str] = Field(None, min_length=1)
    from_unit: Optional[str] = Field(None, min_length=1)
    to_unit: Optional[str] = Field(None, min_length=1)
    factor: Optional[float] = Field(None, gt=0)
    round_up: Optional[bool] = None

    @field_validator("ingredient_name", "from_unit", "to_unit", mode="before")
    @classmethod
    def strip_and_lower(cls, v):
        if isinstance(v, str) and v:
            return v.strip().lower()
        return v


# ── Response DTO ───────────────────────────────────────────────────────────────────────────────────────────
class UnitConversionRuleResponseDTO(UnitConversionRuleBaseDTO):
    """DTO for unit conversion rule responses."""

    id: int
    created_at: datetime
