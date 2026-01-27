"""app/models/user_usage.py

SQLAlchemy ORM model for tracking user AI feature usage.
Tracks monthly usage counts for rate limiting and analytics.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .user import User


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


def _current_month() -> str:
    """Return current month as YYYY-MM string."""
    return datetime.now(timezone.utc).strftime("%Y-%m")


class UserUsage(Base):
    """
    Monthly AI feature usage tracking per user.

    Each row represents one user's usage for one month.
    The unique constraint on (user_id, month) ensures one row per user per month.

    Usage counts are incremented by the AI services when features are used.
    These counts are checked against tier limits to enforce rate limiting.
    """
    __tablename__ = "user_usage"
    __table_args__ = (
        UniqueConstraint("user_id", "month", name="uq_user_usage_user_month"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Month in YYYY-MM format (e.g., "2026-01")
    month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)

    # AI feature usage counts (all default to 0)
    ai_images_generated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_suggestions_requested: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_assistant_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    recipes_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    # ── Relationships ───────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="usage_records")

    # ── Helper Methods ──────────────────────────────────────────────────────
    @classmethod
    def get_current_month(cls) -> str:
        """Get the current month string for queries."""
        return _current_month()

    def __repr__(self) -> str:
        return (
            f"<UserUsage(user_id={self.user_id}, month='{self.month}', "
            f"images={self.ai_images_generated}, suggestions={self.ai_suggestions_requested}, "
            f"messages={self.ai_assistant_messages}, recipes={self.recipes_created})>"
        )
