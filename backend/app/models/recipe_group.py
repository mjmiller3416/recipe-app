"""app/models/recipe_group.py

SQLAlchemy model for recipe groups (user-defined collections).
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List

from sqlalchemy import DateTime, ForeignKey, String, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship


def _utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)

from ..database.base import Base

if TYPE_CHECKING:
    from .recipe import Recipe
    from .user import User


# ── Association Table ───────────────────────────────────────────────────────────────────────────────────────
recipe_group_association = Table(
    "recipe_group_association",
    Base.metadata,
    Column("recipe_id", Integer, ForeignKey("recipe.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("recipe_groups.id", ondelete="CASCADE"), primary_key=True),
)


# ── RecipeGroup Model ───────────────────────────────────────────────────────────────────────────────────────
class RecipeGroup(Base):
    __tablename__ = "recipe_groups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # User ownership
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # ── Relationships  ──────────────────────────────────────────────────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="recipe_groups")
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe",
        secondary=recipe_group_association,
        back_populates="groups"
    )

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"RecipeGroup(id={self.id}, name={self.name}, user_id={self.user_id})"
