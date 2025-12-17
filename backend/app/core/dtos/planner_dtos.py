"""app/core/dtos/planner_dtos.py

Pydantic DTOs for planner entry operations.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from .meal_dtos import MealResponseDTO


# ── Planner Entry DTOs ──────────────────────────────────────────────────────────────────────────────────────
class PlannerEntryBaseDTO(BaseModel):
    """Base DTO for planner entry operations."""

    model_config = ConfigDict(from_attributes=True)

    meal_id: int = Field(..., ge=1)
    position: int = Field(default=0, ge=0)
    is_completed: bool = Field(default=False)
    scheduled_date: Optional[date] = None


class PlannerEntryCreateDTO(BaseModel):
    """DTO for creating a new planner entry."""

    model_config = ConfigDict(from_attributes=True)

    meal_id: int = Field(..., ge=1)
    scheduled_date: Optional[date] = None


class PlannerEntryUpdateDTO(BaseModel):
    """DTO for updating an existing planner entry."""

    model_config = ConfigDict(from_attributes=True)

    position: Optional[int] = Field(None, ge=0)
    is_completed: Optional[bool] = None
    scheduled_date: Optional[date] = None


class PlannerEntryResponseDTO(PlannerEntryBaseDTO):
    """DTO for planner entry responses with full details."""

    id: int
    completed_at: Optional[datetime] = None
    meal: Optional[MealResponseDTO] = None


class PlannerEntryReorderDTO(BaseModel):
    """DTO for reordering planner entries."""

    model_config = ConfigDict(from_attributes=True)

    entry_id: int = Field(..., ge=1)
    new_position: int = Field(..., ge=0)


class PlannerEntriesReorderDTO(BaseModel):
    """DTO for batch reordering planner entries."""

    model_config = ConfigDict(from_attributes=True)

    # List of entry IDs in the desired order
    entry_ids: list[int] = Field(..., min_length=0, max_length=15)


# ── Planner Summary ─────────────────────────────────────────────────────────────────────────────────────────
class PlannerSummaryDTO(BaseModel):
    """DTO for planner summary information."""

    model_config = ConfigDict(from_attributes=True)

    total_entries: int
    completed_entries: int
    pending_entries: int
    total_recipes: int
    has_entries: bool
    error: Optional[str] = None


# ── Planner Validation ──────────────────────────────────────────────────────────────────────────────────────
class PlannerValidationDTO(BaseModel):
    """DTO for planner validation results."""

    model_config = ConfigDict(from_attributes=True)

    is_valid: bool
    can_add_more: bool
    current_count: int
    max_count: int = 15
    error: Optional[str] = None
