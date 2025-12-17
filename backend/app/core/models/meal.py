"""app/core/models/meal.py

SQLAlchemy ORM model for meals (saved meal configurations).
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .planner_entry import PlannerEntry
    from .recipe import Recipe


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# -- Meal Model ----------------------------------------------------------------------------------
class Meal(Base):
    """
    Represents a saved meal configuration with one main recipe and optional side recipes.

    A meal is a reusable entity that can be added to the planner multiple times.
    Meals persist independently of planner state.
    """
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meal_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Main recipe (required) - CASCADE delete when recipe is deleted
    main_recipe_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="CASCADE"),
        nullable=False
    )

    # Side recipe IDs stored as JSON array (0-3 items, ordered)
    # Using Text to store JSON string for SQLite compatibility
    _side_recipe_ids_json: Mapped[Optional[str]] = mapped_column(
        "side_recipe_ids",
        Text,
        nullable=True,
        default="[]"
    )

    # Favorite flag for quick filtering
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)

    # Tags stored as JSON array of strings
    _tags_json: Mapped[Optional[str]] = mapped_column(
        "tags",
        Text,
        nullable=True,
        default="[]"
    )

    # Timestamp for creation
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow
    )

    # -- Relationships ---------------------------------------------------------------------------
    main_recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        foreign_keys=[main_recipe_id],
        back_populates="main_meals"
    )

    planner_entries: Mapped[List["PlannerEntry"]] = relationship(
        "PlannerEntry",
        back_populates="meal",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    # -- Properties for JSON fields --------------------------------------------------------------
    @property
    def side_recipe_ids(self) -> List[int]:
        """Get the list of side recipe IDs."""
        import json
        if not self._side_recipe_ids_json:
            return []
        try:
            return json.loads(self._side_recipe_ids_json)
        except (json.JSONDecodeError, TypeError):
            return []

    @side_recipe_ids.setter
    def side_recipe_ids(self, value: List[int]) -> None:
        """Set the list of side recipe IDs (max 3)."""
        import json
        if value is None:
            value = []
        if len(value) > 3:
            raise ValueError("Maximum of 3 side recipes allowed")
        self._side_recipe_ids_json = json.dumps(value)

    @property
    def tags(self) -> List[str]:
        """Get the list of tags."""
        import json
        if not self._tags_json:
            return []
        try:
            return json.loads(self._tags_json)
        except (json.JSONDecodeError, TypeError):
            return []

    @tags.setter
    def tags(self, value: List[str]) -> None:
        """Set the list of tags."""
        import json
        if value is None:
            value = []
        self._tags_json = json.dumps(value)

    # -- String Representation -------------------------------------------------------------------
    def __repr__(self) -> str:
        return (
            f"<Meal(id={self.id}, meal_name='{self.meal_name}', "
            f"main_recipe_id={self.main_recipe_id}, "
            f"side_recipe_ids={self.side_recipe_ids})>"
        )

    # -- Helper Methods --------------------------------------------------------------------------
    def add_side_recipe(self, recipe_id: int) -> bool:
        """
        Add a side recipe ID if space is available.

        Args:
            recipe_id: The recipe ID to add

        Returns:
            True if added, False if already at max capacity or already exists
        """
        current = self.side_recipe_ids
        if len(current) >= 3:
            return False
        if recipe_id in current:
            return False
        current.append(recipe_id)
        self.side_recipe_ids = current
        return True

    def remove_side_recipe(self, recipe_id: int) -> bool:
        """
        Remove a side recipe ID from the list.

        Args:
            recipe_id: The recipe ID to remove

        Returns:
            True if removed, False if not found
        """
        current = self.side_recipe_ids
        if recipe_id not in current:
            return False
        current.remove(recipe_id)
        self.side_recipe_ids = current
        return True

    def get_all_recipe_ids(self) -> List[int]:
        """Return all recipe IDs (main + sides) for this meal."""
        return [self.main_recipe_id] + self.side_recipe_ids

    def has_recipe(self, recipe_id: int) -> bool:
        """Check if this meal contains a specific recipe (main or side)."""
        return recipe_id == self.main_recipe_id or recipe_id in self.side_recipe_ids
