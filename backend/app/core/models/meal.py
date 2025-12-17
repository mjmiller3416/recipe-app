"""app/core/models/meal.py

SQLAlchemy ORM model for meals (reusable saved meals with main + side recipes).
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey

from ..database.base import Base

if TYPE_CHECKING:
    from .recipe import Recipe
    from .planner_entry import PlannerEntry


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# ── Meal Model ──────────────────────────────────────────────────────────────────────────────────────────────
class Meal(Base):
    """
    Represents a reusable saved meal consisting of one main recipe and 0-3 side recipes.
    
    Meals persist independently and can be referenced by planner entries.
    Deleting a meal will cascade delete any planner entries referencing it.
    """
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    main_recipe_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="CASCADE"),
        nullable=False
    )
    side_recipe_ids: Mapped[List[int]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        nullable=False
    )

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    main_recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        foreign_keys=[main_recipe_id],
        back_populates="meals_as_main"
    )
    
    planner_entries: Mapped[List["PlannerEntry"]] = relationship(
        "PlannerEntry",
        back_populates="meal",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"<Meal(id={self.id}, meal_name='{self.meal_name}', "
            f"main_recipe_id={self.main_recipe_id}, "
            f"side_count={len(self.side_recipe_ids)}, "
            f"is_favorite={self.is_favorite})>"
        )

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def get_all_recipe_ids(self) -> List[int]:
        """Return list of all recipe IDs (main + sides) in this meal."""
        return [self.main_recipe_id] + self.side_recipe_ids

    def add_side_recipe(self, recipe_id: int) -> bool:
        """
        Add a side recipe to the meal if there's room (max 3 sides).
        
        Args:
            recipe_id: ID of the recipe to add
            
        Returns:
            True if added successfully, False if already at max capacity
        """
        if len(self.side_recipe_ids) >= 3:
            return False
        if recipe_id not in self.side_recipe_ids:
            self.side_recipe_ids = self.side_recipe_ids + [recipe_id]
        return True

    def remove_side_recipe(self, recipe_id: int) -> bool:
        """
        Remove a side recipe from the meal.
        
        Args:
            recipe_id: ID of the recipe to remove
            
        Returns:
            True if removed, False if not found
        """
        if recipe_id in self.side_recipe_ids:
            self.side_recipe_ids = [rid for rid in self.side_recipe_ids if rid != recipe_id]
            return True
        return False

    def reorder_side_recipes(self, ordered_ids: List[int]) -> bool:
        """
        Reorder side recipes according to the provided list.
        
        Args:
            ordered_ids: New order of side recipe IDs (max 3)
            
        Returns:
            True if reordered successfully, False if invalid
        """
        if len(ordered_ids) > 3:
            return False
        # Verify all IDs are currently in the meal
        if not all(rid in self.side_recipe_ids for rid in ordered_ids):
            return False
        self.side_recipe_ids = ordered_ids
        return True

    def has_tag(self, tag: str) -> bool:
        """
        Check if the meal has a specific tag (case-insensitive).
        
        Args:
            tag: Tag to check for
            
        Returns:
            True if tag exists, False otherwise
        """
        return any(t.lower() == tag.lower() for t in self.tags)

    def add_tag(self, tag: str) -> bool:
        """
        Add a tag to the meal if not already present (case-insensitive check).
        
        Args:
            tag: Tag to add
            
        Returns:
            True if added, False if already exists
        """
        if not self.has_tag(tag):
            self.tags = self.tags + [tag]
            return True
        return False

    def remove_tag(self, tag: str) -> bool:
        """
        Remove a tag from the meal (case-insensitive).
        
        Args:
            tag: Tag to remove
            
        Returns:
            True if removed, False if not found
        """
        original_len = len(self.tags)
        self.tags = [t for t in self.tags if t.lower() != tag.lower()]
        return len(self.tags) < original_len
