"""app/core/dtos/shopping_dtos.py

Pydantic DTOs for shopping list operations and data transfer.
Handles shopping item creation, updates, filtering, and aggregation.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── Base DTOs ───────────────────────────────────────────────────────────────────────────────────────────────
class ShoppingItemBaseDTO(BaseModel):
    """Base DTO for shopping item operations."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(..., ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)

    @field_validator("ingredient_name", mode="before")
    @classmethod
    def strip_ingredient_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

# ── Create DTOs ─────────────────────────────────────────────────────────────────────────────────────────────
class ShoppingItemCreateDTO(ShoppingItemBaseDTO):
    """DTO for creating a new shopping item."""
    source: Literal["recipe", "manual"] = "manual"

class ManualItemCreateDTO(BaseModel):
    """DTO for creating a manual shopping item."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(..., ge=0)
    unit: Optional[str] = Field(None, max_length=50)

    @field_validator("ingredient_name", mode="before")
    @classmethod
    def strip_ingredient_name(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

# ── Update DTOs ─────────────────────────────────────────────────────────────────────────────────────────────
class ShoppingItemUpdateDTO(BaseModel):
    """DTO for updating a shopping item."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    have: Optional[bool] = None

    @field_validator("ingredient_name", mode="before")
    @classmethod
    def strip_ingredient_name(cls, v):
        if isinstance(v, str) and v:
            return v.strip()
        return v

# ── Response DTOs ───────────────────────────────────────────────────────────────────────────────────────────
class ShoppingItemResponseDTO(ShoppingItemBaseDTO):
    """DTO for shopping item responses."""

    id: int
    source: Literal["recipe", "manual"]
    have: bool = False
    state_key: Optional[str] = None

class ShoppingListResponseDTO(BaseModel):
    """DTO for complete shopping list response."""

    model_config = ConfigDict(from_attributes=True)

    items: List[ShoppingItemResponseDTO]
    total_items: int
    checked_items: int
    recipe_items: int
    manual_items: int
    categories: List[str]

# ── Filter and Search DTOs ──────────────────────────────────────────────────────────────────────────────────
class ShoppingListFilterDTO(BaseModel):
    """DTO for filtering shopping list items."""

    model_config = ConfigDict(from_attributes=True)

    source: Optional[Literal["recipe", "manual"]] = None
    category: Optional[str] = None
    have: Optional[bool] = None
    search_term: Optional[str] = None
    limit: Optional[int] = Field(None, ge=1, le=100)
    offset: Optional[int] = Field(None, ge=0)

# ── Aggregation DTOs ────────────────────────────────────────────────────────────────────────────────────────
class IngredientAggregationDTO(BaseModel):
    """DTO for ingredient aggregation data."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str
    total_quantity: float
    unit: Optional[str]
    category: Optional[str]
    recipe_sources: List[str]  # recipe names that contribute to this ingredient

class ShoppingListGenerationDTO(BaseModel):
    """DTO for shopping list generation parameters."""

    model_config = ConfigDict(from_attributes=True)

    recipe_ids: List[int] = Field(...)
    include_manual_items: bool = True
    clear_existing: bool = False

# ── State Management DTOs ───────────────────────────────────────────────────────────────────────────────────
class ShoppingStateDTO(BaseModel):
    """DTO for shopping item state."""

    model_config = ConfigDict(from_attributes=True)

    key: str
    checked: bool

class BulkStateUpdateDTO(BaseModel):
    """DTO for bulk state updates with mapping of item IDs to their have status."""

    model_config = ConfigDict(from_attributes=True)

    item_updates: Dict[int, bool]

# ── Breakdown DTOs ──────────────────────────────────────────────────────────────────────────────────────────
class IngredientBreakdownItemDTO(BaseModel):
    """DTO for individual ingredient breakdown item."""

    model_config = ConfigDict(from_attributes=True)

    recipe_name: str
    quantity: float
    unit: Optional[str]

class IngredientBreakdownDTO(BaseModel):
    """DTO for ingredient breakdown by recipe."""

    model_config = ConfigDict(from_attributes=True)

    ingredient_name: str
    unit: str
    total_quantity: float
    recipe_contributions: List[IngredientBreakdownItemDTO]

# ── Operation Result DTOs ───────────────────────────────────────────────────────────────────────────────────
class ShoppingListGenerationResultDTO(BaseModel):
    """DTO for shopping list generation results."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    items_created: int
    items_updated: int
    total_items: int
    message: str
    errors: List[str] = []
    items: List[ShoppingItemResponseDTO] = []

class BulkOperationResultDTO(BaseModel):
    """DTO for bulk operation results."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    updated_count: int
    message: str
    errors: List[str] = []
