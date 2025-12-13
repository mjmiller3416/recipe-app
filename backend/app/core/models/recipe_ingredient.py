"""app/core/models/recipe_ingredient.py

SQLAlchemy model for the recipe_ingredients join table.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Optional

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base
from ..dtos.ingredient_dtos import IngredientDetailDTO


# ── Recipe Ingredient Model ─────────────────────────────────────────────────────────────────────────────────
class RecipeIngredient(Base):
    """Join table linking recipes and ingredients with quantities and units."""
    __tablename__ = "recipe_ingredients"

    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipe.id"), primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
    quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    ingredient = relationship("Ingredient", back_populates="recipe_links", lazy="joined")
    recipe = relationship("Recipe", back_populates="ingredients")

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return (
            f"RecipeIngredient(recipe_id={self.recipe_id}, "
            f"ingredient_id={self.ingredient_id}, "
            f"quantity={self.quantity}, unit={self.unit})"
        )

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def get_ingredient_detail(self) -> IngredientDetailDTO:
        """
        Return enriched ingredient details (name, category, qty, unit).
        """
        if not self.ingredient:
            raise ValueError(f"Ingredient {self.ingredient_id} not found")

        return IngredientDetailDTO(
            ingredient_name=self.ingredient.ingredient_name,
            ingredient_category=self.ingredient.ingredient_category,
            quantity=self.quantity,
            unit=self.unit,
        )
