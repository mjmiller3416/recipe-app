"""app/models/user_ingredient_unit.py

SQLAlchemy model for user-customizable ingredient units.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .user import User


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# ── UserIngredientUnit Model ───────────────────────────────────────────────────────────────────────────────
class UserIngredientUnit(Base):
    """
    User-customizable ingredient unit.

    Each user has their own set of units (built-in + custom).
    Built-in units include mass (oz, lbs), volume (tsp, tbs, cup), and count types.
    Custom units are always of type "count".
    """

    __tablename__ = "user_ingredient_units"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # User ownership
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Unit identifiers
    value: Mapped[str] = mapped_column(String(100), nullable=False)  # slug: "oz", "tsp", "bag"
    label: Mapped[str] = mapped_column(String(100), nullable=False)  # display: "oz", "tsp", "bag"

    # Unit classification
    unit_type: Mapped[str] = mapped_column(String(20), nullable=False, default="count")  # "mass", "volume", "count"

    # Unit type and state
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="ingredient_units")

    # ── Constraints ─────────────────────────────────────────────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("user_id", "value", name="uq_user_ingredient_unit_value"),
    )

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"UserIngredientUnit(id={self.id}, value='{self.value}', label='{self.label}', "
            f"unit_type='{self.unit_type}', is_custom={self.is_custom}, is_enabled={self.is_enabled}, "
            f"position={self.position})"
        )
