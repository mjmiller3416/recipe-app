"""app/core/models/recipe_history.py

SQLAlchemy model for tracking when recipes were cooked.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..utils import utcnow
from ..database.base import Base


# ── Recipe History Model ────────────────────────────────────────────────────────────────────────────────────
class RecipeHistory(Base):
    __tablename__ = "recipe_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipe.id"), nullable=False)
    cooked_at: Mapped[datetime] = mapped_column(default=utcnow)

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    recipe = relationship("Recipe", back_populates="history")

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"RecipeHistory(id={self.id}, recipe_id={self.recipe_id}, "
            f"cooked_at={self.cooked_at})"
        )
