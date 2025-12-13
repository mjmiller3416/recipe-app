""" app/core/models/meal_selection.py

SQLAlchemy ORM model for meal selections and their recipes.
"""
# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base

if TYPE_CHECKING:
    from ..models.recipe import Recipe


# ── Meal Selection Model ────────────────────────────────────────────────────────────────────────────────────
class MealSelection(Base):
    __tablename__ = "meal_selections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meal_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # recipe foreign keys
    main_recipe_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="CASCADE"),
        nullable=False
    )
    side_recipe_1_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="SET NULL"),
        nullable=True
    )
    side_recipe_2_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="SET NULL"),
        nullable=True
    )
    side_recipe_3_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("recipe.id", ondelete="SET NULL"),
        nullable=True
    )

    # ── Relationships ───────────────────────────────────────────────────────────────────────────────────────
    main_recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        foreign_keys=[main_recipe_id],
        back_populates="main_meal_selections"
    )
    side_recipe_1: Mapped[Optional["Recipe"]] = relationship(
        "Recipe",
        foreign_keys=[side_recipe_1_id]
    )
    side_recipe_2: Mapped[Optional["Recipe"]] = relationship(
        "Recipe",
        foreign_keys=[side_recipe_2_id]
    )
    side_recipe_3: Mapped[Optional["Recipe"]] = relationship(
        "Recipe",
        foreign_keys=[side_recipe_3_id]
    )


    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<MealSelection(id={self.id}, meal_name='{self.meal_name}'," \
               f" main_recipe_id={self.main_recipe_id})>"

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def get_side_recipes(self) -> List["Recipe"]:
        """Return any side dish Recipes for this meal."""
        sides = []
        for recipe in (self.side_recipe_1, self.side_recipe_2, self.side_recipe_3):
            if recipe is not None:
                sides.append(recipe)
        return sides

    def get_all_recipes(self) -> List["Recipe"]:
        """Return all recipes (main and sides) for this meal."""
        return [self.main_recipe] + self.get_side_recipes()

    @property
    def side_recipe_ids(self) -> List[int]:
        """Return list of side recipe IDs that are not None."""
        return [
            recipe_id for recipe_id in
            [self.side_recipe_1_id, self.side_recipe_2_id, self.side_recipe_3_id]
            if recipe_id is not None
        ]
