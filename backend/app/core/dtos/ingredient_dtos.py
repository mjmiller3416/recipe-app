"""app/core/dtos/ingredient_dtos.py

Pydantic DTOs for ingredient operations and data transfer.
Handles ingredient creation, updates, searching, and responses.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from fractions import Fraction
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Inline Format Helpers ──────────────────────────────────────────────────────────────────────────────────────
def _format_quantity(qty: float) -> str:
    """Format quantity as fraction or whole number."""
    if qty == int(qty):
        return str(int(qty))
    frac = Fraction(qty).limit_denominator(8)
    if frac.numerator > frac.denominator:
        whole = frac.numerator // frac.denominator
        remainder = frac.numerator % frac.denominator
        if remainder == 0:
            return str(whole)
        return f"{whole} {remainder}/{frac.denominator}"
    return f"{frac.numerator}/{frac.denominator}"


def _abbreviate_unit(unit: str) -> str:
    """Return abbreviated form of unit."""
    abbreviations = {
        "tablespoon": "tbsp", "tablespoons": "tbsp",
        "teaspoon": "tsp", "teaspoons": "tsp",
        "cup": "cup", "cups": "cups",
        "ounce": "oz", "ounces": "oz",
        "pound": "lb", "pounds": "lbs",
        "gram": "g", "grams": "g",
        "kilogram": "kg", "kilograms": "kg",
        "milliliter": "ml", "milliliters": "ml",
        "liter": "L", "liters": "L",
    }
    return abbreviations.get(unit.lower(), unit)


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
        return _format_quantity(self.quantity)

    @property
    def abbreviated_unit(self) -> str:
        """Return unit in abbreviated form."""
        if self.unit is None:
            return ""
        return _abbreviate_unit(self.unit)
