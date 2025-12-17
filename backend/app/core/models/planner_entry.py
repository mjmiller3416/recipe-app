"""app/core/models/planner_entry.py

SQLAlchemy ORM model for planner entries (references to meals in the active meal plan).
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .meal import Meal


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# ── Planner Entry Model ─────────────────────────────────────────────────────────────────────────────────────
class PlannerEntry(Base):
    """
    Represents a reference to a meal in the active meal plan.
    
    Planner entries are ephemeral - they can be freely added/removed without
    affecting the underlying meal. Deleting a meal will cascade delete its entries.
    """
    __tablename__ = "planner_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meal_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meals.id", ondelete="CASCADE"),
        nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    scheduled_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    meal: Mapped["Meal"] = relationship(
        "Meal",
        back_populates="planner_entries"
    )

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"<PlannerEntry(id={self.id}, meal_id={self.meal_id}, "
            f"position={self.position}, is_completed={self.is_completed})>"
        )

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def mark_completed(self) -> None:
        """Mark this planner entry as completed and set the completion timestamp."""
        self.is_completed = True
        self.completed_at = _utcnow()

    def mark_incomplete(self) -> None:
        """Mark this planner entry as incomplete and clear the completion timestamp."""
        self.is_completed = False
        self.completed_at = None
