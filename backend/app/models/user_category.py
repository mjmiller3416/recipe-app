"""app/models/user_category.py

SQLAlchemy model for user-customizable recipe categories.
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


# ── UserCategory Model ──────────────────────────────────────────────────────────────────────────────────────
class UserCategory(Base):
    """
    User-customizable recipe category.

    Each user has their own set of categories (built-in + custom).
    Built-in categories are seeded on first access and cannot be deleted.
    Custom categories can be created, renamed, and deleted by the user.
    All categories can be enabled/disabled and reordered.
    """

    __tablename__ = "user_categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # User ownership
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Category identifiers
    value: Mapped[str] = mapped_column(String(100), nullable=False)  # slug: "beef", "instant-pot"
    label: Mapped[str] = mapped_column(String(100), nullable=False)  # display: "Beef", "Instant Pot"

    # Category type and state
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="categories")

    # ── Constraints ─────────────────────────────────────────────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("user_id", "value", name="uq_user_category_value"),
    )

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"UserCategory(id={self.id}, value='{self.value}', label='{self.label}', "
            f"is_custom={self.is_custom}, is_enabled={self.is_enabled}, position={self.position})"
        )
