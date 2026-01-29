"""app/core/models/shopping_item.py

SQLAlchemy ORM model for shopping list items.
Handles both recipe-generated and manually added shopping items.
"""

# ── Imports ─────────────────────────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base
from ..utils.unit_conversion import get_dimension

if TYPE_CHECKING:
    from .shopping_item_contribution import ShoppingItemContribution
    from .user import User


# ── Shopping Item Model ─────────────────────────────────────────────────────────────────────────────────────
class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    ingredient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    # source and status
    source: Mapped[str] = mapped_column(
        Enum("recipe", "manual", name="shopping_source"),
        nullable=False,
        default="manual",
        index=True
    )
    have: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Unique key for aggregation: "ingredient_name::dimension"
    # Used to identify items for diff-based sync (recipe items only)
    aggregation_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True, index=True)

    # User ownership
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # ── Relationships ──────────────────────────────────────────────────────────────────────────────────────
    # Contributions from planner entries (cascade delete when item is deleted)
    contributions: Mapped[List["ShoppingItemContribution"]] = relationship(
        "ShoppingItemContribution",
        back_populates="shopping_item",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # User ownership
    user: Mapped["User"] = relationship("User", back_populates="shopping_items")

    # ── String Representation ───────────────────────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<ShoppingItem(id={self.id}, name='{self.ingredient_name}', qty={self.quantity}, have={self.have})>"

    # ── Helper Methods ──────────────────────────────────────────────────────────────────────────────────────
    def get_aggregation_key(self) -> str:
        """Generate the aggregation key for this shopping item using dimension."""
        if self.aggregation_key:
            return self.aggregation_key
        dimension = get_dimension(self.unit)
        return f"{self.ingredient_name.lower().strip()}::{dimension}"

    @staticmethod
    def make_aggregation_key(ingredient_name: str, dimension: str) -> str:
        """Create an aggregation key from ingredient name and dimension."""
        return f"{ingredient_name.lower().strip()}::{dimension}"

    def get_recipe_sources(self) -> List[str]:
        """Get list of recipe names that contribute to this item from contributions."""
        if not self.contributions:
            return []
        # We need to load recipe names from contributions
        # This requires the relationship to be loaded
        recipe_names: set[str] = set()
        for contrib in self.contributions:
            # Access recipe through lazy load if needed
            if hasattr(contrib, 'recipe') and contrib.recipe:
                recipe_names.add(contrib.recipe.recipe_name)
        return sorted(list(recipe_names))

    def display_label(self) -> str:
        """Return a human-friendly label for UI display."""
        icon = "✓" if self.have else "○"
        unit_display = f" {self.unit}" if self.unit else ""
        return f"{icon} {self.ingredient_name}: {self.quantity}{unit_display}"

    def formatted_quantity(self) -> str:
        """Return formatted quantity string."""
        if self.quantity == int(self.quantity):
            return str(int(self.quantity))
        return f"{self.quantity:.2f}".rstrip('0').rstrip('.')

    @classmethod
    def create_from_recipe(
        cls,
        ingredient_name: str,
        quantity: float,
        unit: Optional[str] = None,
        category: Optional[str] = None,
        aggregation_key: Optional[str] = None
        ) -> "ShoppingItem":
        """
        Create a shopping item from recipe data.

        Args:
            ingredient_name (str): The name of the ingredient.
            quantity (float): The quantity of the ingredient.
            unit (Optional[str]): The unit of measurement, if any.
            category (Optional[str]): The category of the ingredient.
            aggregation_key (Optional[str]): The aggregation key for this item.

        Returns:
            ShoppingItem: A new shopping item instance.
        """
        # Generate aggregation key if not provided
        if not aggregation_key:
            dimension = get_dimension(unit)
            aggregation_key = cls.make_aggregation_key(ingredient_name, dimension)

        return cls(
            ingredient_name=ingredient_name,
            quantity=quantity,
            unit=unit,
            category=category,
            source="recipe",
            have=False,
            aggregation_key=aggregation_key
        )

    @classmethod
    def create_manual(
        cls,
        ingredient_name: str,
        quantity: float,
        unit: Optional[str] = None,
        category: Optional[str] = None
        ) -> "ShoppingItem":
        """
        Create a manual shopping item.

        Args:
            ingredient_name (str): The name of the ingredient.
            quantity (float): The quantity of the ingredient.
            unit (Optional[str]): The unit of measurement, if any.
            category (Optional[str]): The category for the ingredient.

        Returns:
            ShoppingItem: A new manual shopping item instance.
        """
        return cls(
            ingredient_name=ingredient_name,
            quantity=quantity,
            unit=unit,
            category=category,
            source="manual",
            have=False
        )
