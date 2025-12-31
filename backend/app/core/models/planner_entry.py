"""app/core/models/planner_entry.py

SQLAlchemy ORM model for planner entries (meals added to the active planner).
"""

# -- Imports -------------------------------------------------------------------------------------
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .meal import Meal


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# -- PlannerEntry Model --------------------------------------------------------------------------
class PlannerEntry(Base):
    """
    Represents a meal's placement in the active meal planner.

    A planner entry is a reference to a meal that can be freely added/removed
    without affecting the underlying meal. This allows meals to be reused
    across different planning sessions.
    """
    __tablename__ = "planner_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Reference to the meal - CASCADE delete when meal is deleted
    meal_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meals.id", ondelete="CASCADE"),
        nullable=False
    )

    # Position in the planner (0-indexed, for drag-drop ordering)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Completion status
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Future calendar feature - nullable for now
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Exclude from shopping list generation
    exclude_from_shopping: Mapped[bool] = mapped_column(Boolean, default=False)

    # -- Relationships ---------------------------------------------------------------------------
    meal: Mapped["Meal"] = relationship(
        "Meal",
        back_populates="planner_entries",
        foreign_keys=[meal_id]
    )

    # -- String Representation -------------------------------------------------------------------
    def __repr__(self) -> str:
        return (
            f"<PlannerEntry(id={self.id}, meal_id={self.meal_id}, "
            f"position={self.position}, is_completed={self.is_completed})>"
        )

    # -- Helper Methods --------------------------------------------------------------------------
    def mark_completed(self) -> None:
        """Mark this entry as completed and set the completion timestamp."""
        self.is_completed = True
        self.completed_at = _utcnow()

    def mark_incomplete(self) -> None:
        """Mark this entry as incomplete and clear the completion timestamp."""
        self.is_completed = False
        self.completed_at = None

    def toggle_completion(self) -> bool:
        """
        Toggle the completion status.

        Returns:
            The new is_completed value
        """
        if self.is_completed:
            self.mark_incomplete()
        else:
            self.mark_completed()
        return self.is_completed

    def toggle_exclude_from_shopping(self) -> bool:
        """
        Toggle the exclude_from_shopping status.

        Returns:
            The new exclude_from_shopping value
        """
        self.exclude_from_shopping = not self.exclude_from_shopping
        return self.exclude_from_shopping
