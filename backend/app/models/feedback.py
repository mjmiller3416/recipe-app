"""app/models/feedback.py

SQLAlchemy model for user feedback submissions.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .user import User


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# ── Feedback Model ──────────────────────────────────────────────────────────────────────────────────────────
class Feedback(Base):
    """
    User feedback submission.

    Stores feedback submitted through the in-app feedback form,
    including category, message, and optional context metadata.
    """

    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # User ownership
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Feedback content
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User")

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"Feedback(id={self.id}, user_id={self.user_id}, "
            f"category='{self.category}', created_at={self.created_at})"
        )
