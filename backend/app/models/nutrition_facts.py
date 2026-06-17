"""app/core/models/nutrition_facts.py

SQLAlchemy model for recipe nutrition facts.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from .recipe import Recipe


class NutritionFacts(Base):
    __tablename__ = "nutrition_facts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipe.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Per-serving values
    calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    protein_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_fat_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    saturated_fat_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trans_fat_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cholesterol_mg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sodium_mg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_carbs_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dietary_fiber_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_sugars_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Whether values were estimated by AI
    is_ai_estimated: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship back to recipe
    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="nutrition_facts")

    def __repr__(self) -> str:
        return (
            f"NutritionFacts(id={self.id}, recipe_id={self.recipe_id}, "
            f"calories={self.calories})"
        )
